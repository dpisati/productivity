import cron, { type ScheduledTask } from 'node-cron';
import { and, eq, inArray, isNotNull, isNull, lte } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type { FastifyInstance } from 'fastify';
import { enumerateOccurrences } from './recurrence.js';
import {
  createStubAlexaService,
  type AlexaReminderService,
} from '../modules/integrations/alexa/alexa.service.js';

const DAY_MS = 86_400_000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Reminder pipeline + cron scheduler.
 *
 * The three stages are exposed as pure-ish functions (taking `now`) so they can
 * be invoked directly and deterministically from tests; `start()` wires them to
 * a once-a-minute cron job for the running server.
 */
export function createSchedulerService(app: FastifyInstance) {
  const { db, log } = app;
  const alexa: AlexaReminderService = createStubAlexaService(log);
  const tasksT = schema.tasks;
  const occ = schema.taskOccurrences;
  const rem = schema.reminders;

  /** Create task_occurrences for recurring + dated tasks up to the horizon. */
  async function materialize(now = new Date(), horizonDays = 14): Promise<number> {
    const from = ymd(now);
    const to = ymd(new Date(now.getTime() + horizonDays * DAY_MS));

    const rows = await db.query.tasks.findMany({
      where: and(isNull(tasksT.deletedAt)),
      with: { recurringRule: true },
    });

    let inserted = 0;
    for (const t of rows) {
      const dates: string[] = [];
      if (t.isRecurring && t.recurringRule) {
        dates.push(...enumerateOccurrences(t.recurringRule, from, to));
      } else if (t.dueDate) {
        dates.push(t.dueDate);
      }
      for (const d of dates) {
        const res = await db
          .insert(occ)
          .values({ taskId: t.id, occurrenceDate: d })
          .onConflictDoNothing()
          .returning({ id: occ.id });
        inserted += res.length;
      }
    }
    return inserted;
  }

  /** Ensure a pending reminder exists per enabled channel for each upcoming,
   * still-pending occurrence whose task has a reminder time. */
  async function enqueue(now = new Date(), horizonDays = 14): Promise<number> {
    const horizon = ymd(new Date(now.getTime() + horizonDays * DAY_MS));

    const candidates = await db
      .select({
        occId: occ.id,
        occDate: occ.occurrenceDate,
        userId: tasksT.userId,
        reminderTime: tasksT.reminderTime,
        telegram: tasksT.telegramEnabled,
        alexa: tasksT.alexaEnabled,
      })
      .from(occ)
      .innerJoin(tasksT, eq(occ.taskId, tasksT.id))
      .where(
        and(
          isNull(tasksT.deletedAt),
          isNotNull(tasksT.reminderTime),
          eq(occ.status, 'pending'),
          lte(occ.occurrenceDate, horizon),
        ),
      );
    if (candidates.length === 0) return 0;

    // Existing reminders for these occurrences, keyed by "occId:channel".
    const occIds = candidates.map((c) => c.occId);
    const existing = await db
      .select({ occId: rem.taskOccurrenceId, channel: rem.channel })
      .from(rem)
      .where(inArray(rem.taskOccurrenceId, occIds));
    const seen = new Set(existing.map((e) => `${e.occId}:${e.channel}`));

    const toInsert: (typeof rem.$inferInsert)[] = [];
    for (const c of candidates) {
      const hhmm = (c.reminderTime ?? '09:00:00').slice(0, 5);
      const scheduledFor = new Date(`${c.occDate}T${hhmm}:00Z`);
      const channels: Array<'in_app' | 'telegram' | 'alexa'> = ['in_app'];
      if (c.telegram) channels.push('telegram');
      if (c.alexa) channels.push('alexa');
      for (const channel of channels) {
        if (seen.has(`${c.occId}:${channel}`)) continue;
        toInsert.push({ userId: c.userId, taskOccurrenceId: c.occId, channel, scheduledFor });
      }
    }
    if (toInsert.length === 0) return 0;
    await db.insert(rem).values(toInsert);
    return toInsert.length;
  }

  /** Deliver all pending reminders whose time has arrived. */
  async function dispatch(now = new Date()): Promise<number> {
    const due = await db.query.reminders.findMany({
      where: and(eq(rem.status, 'pending'), lte(rem.scheduledFor, now)),
      with: { taskOccurrence: { with: { task: true } } },
    });

    let sent = 0;
    for (const r of due) {
      const title = r.taskOccurrence?.task?.title ?? 'Reminder';
      const message = `Reminder: ${title}`;
      let externalId: string | null = null;

      try {
        if (r.channel === 'in_app') {
          await db.insert(schema.notifications).values({
            userId: r.userId,
            type: 'task_due',
            title: message,
            body: r.taskOccurrence ? `Due ${r.taskOccurrence.occurrenceDate}` : null,
            payload: { reminderId: r.id, taskId: r.taskOccurrence?.taskId ?? null },
          });
        } else if (r.channel === 'telegram') {
          // Real delivery is wired in the Telegram milestone; stubbed for now.
          log.info({ reminderId: r.id, userId: r.userId }, '[telegram-stub] would send reminder');
        } else if (r.channel === 'alexa') {
          const res = await alexa.create({ userId: r.userId, text: message, scheduledFor: r.scheduledFor });
          externalId = res.externalId;
        }

        await db
          .update(rem)
          .set({ status: 'sent', sentAt: now, externalId })
          .where(eq(rem.id, r.id));
        sent++;
      } catch (err) {
        log.error({ err, reminderId: r.id }, 'reminder dispatch failed');
        await db.update(rem).set({ status: 'failed' }).where(eq(rem.id, r.id));
      }
    }
    return sent;
  }

  /** Run the full pipeline once. */
  async function tick(now = new Date()): Promise<{ materialized: number; enqueued: number; dispatched: number }> {
    const materialized = await materialize(now);
    const enqueued = await enqueue(now);
    const dispatched = await dispatch(now);
    if (materialized || enqueued || dispatched) {
      log.info({ materialized, enqueued, dispatched }, 'scheduler tick');
    }
    return { materialized, enqueued, dispatched };
  }

  let job: ScheduledTask | null = null;

  /** Schedule the pipeline to run every minute. */
  function start(): void {
    if (job) return;
    job = cron.schedule('* * * * *', () => {
      tick().catch((err) => log.error({ err }, 'scheduler tick error'));
    });
    log.info('scheduler started (every minute)');
  }

  function stop(): void {
    job?.stop();
    job = null;
  }

  return { materialize, enqueue, dispatch, tick, start, stop };
}

export type SchedulerService = ReturnType<typeof createSchedulerService>;
