import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createSchedulerService } from '../src/lib/scheduler.js';
import { authHeader, makeApp, registerUser, resetDb } from './helpers.js';

const todayStr = new Date().toISOString().slice(0, 10);
const at = (h: number) => new Date(`${todayStr}T${String(h).padStart(2, '0')}:00:00Z`);

describe('tasks & reminders', () => {
  let app: FastifyInstance;
  let auth: Record<string, string>;
  let scheduler: ReturnType<typeof createSchedulerService>;

  beforeAll(async () => {
    app = await makeApp();
    scheduler = createSchedulerService(app);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
    const u = await registerUser(app);
    auth = authHeader(u.accessToken);
  });

  async function createTask(payload: Record<string, unknown>) {
    const res = await app.inject({ method: 'POST', url: '/api/tasks', headers: auth, payload });
    expect(res.statusCode).toBe(201);
    return res.json();
  }

  it('CRUD a simple task', async () => {
    const t = await createTask({ title: 'Buy milk', priority: 'low' });
    expect(t).toMatchObject({ title: 'Buy milk', priority: 'low', status: 'pending', isRecurring: false });

    const upd = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${t.id}`,
      headers: auth,
      payload: { status: 'completed' },
    });
    expect(upd.json().status).toBe('completed');

    const del = await app.inject({ method: 'DELETE', url: `/api/tasks/${t.id}`, headers: auth });
    expect(del.statusCode).toBe(204);

    const list = await app.inject({ method: 'GET', url: '/api/tasks', headers: auth });
    expect(list.json().meta.total).toBe(0);
  });

  it('creates a single occurrence for a non-recurring dated task', async () => {
    const t = await createTask({ title: 'Pay rent', dueDate: todayStr });
    const occ = await app.inject({ method: 'GET', url: `/api/tasks/${t.id}/occurrences`, headers: auth });
    expect(occ.json()).toHaveLength(1);
    expect(occ.json()[0].occurrenceDate).toBe(todayStr);
  });

  it('materializes recurring occurrences within the horizon', async () => {
    const t = await createTask({
      title: 'Take medication',
      reminderTime: '08:00',
      recurrence: { frequency: 'daily', interval: 1, startDate: todayStr },
    });
    expect(t.isRecurring).toBe(true);

    const inserted = await scheduler.materialize(at(12));
    expect(inserted).toBeGreaterThanOrEqual(14);

    const occ = await app.inject({ method: 'GET', url: `/api/tasks/${t.id}/occurrences`, headers: auth });
    expect(occ.json().length).toBeGreaterThanOrEqual(14);
    expect(occ.json().some((o: { occurrenceDate: string }) => o.occurrenceDate === todayStr)).toBe(true);
  });

  it('marks an occurrence completed', async () => {
    const t = await createTask({ title: 'Pay rent', dueDate: todayStr });
    const occ = (await app.inject({ method: 'GET', url: `/api/tasks/${t.id}/occurrences`, headers: auth })).json();
    const upd = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${t.id}/occurrences/${occ[0].id}`,
      headers: auth,
      payload: { status: 'completed' },
    });
    expect(upd.json().status).toBe('completed');
    expect(upd.json().completedAt).not.toBeNull();
  });

  it('enqueues reminders per enabled channel and dispatches due ones to notifications', async () => {
    await createTask({
      title: 'Take medication',
      reminderTime: '08:00',
      telegramEnabled: true,
      alexaEnabled: true,
      recurrence: { frequency: 'daily', interval: 1, startDate: todayStr },
    });

    await scheduler.materialize(at(12));
    const enqueued = await scheduler.enqueue(at(12));
    // in_app + telegram + alexa for each of ~15 occurrences
    expect(enqueued).toBeGreaterThanOrEqual(3);

    // Today's reminders (08:00) are due at noon; future days are not.
    const dispatched = await scheduler.dispatch(at(12));
    expect(dispatched).toBe(3); // in_app + telegram + alexa for today

    // in-app channel produced a notification
    const unread = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: auth });
    expect(unread.json().count).toBe(1);

    // sent reminders are visible and the alexa one carries an external id
    const sent = await app.inject({ method: 'GET', url: '/api/reminders?status=sent', headers: auth });
    expect(sent.json().meta.total).toBe(3);
    const alexa = await app.inject({ method: 'GET', url: '/api/reminders?channel=alexa&status=sent', headers: auth });
    expect(alexa.json().data[0].externalId).toBeTypeOf('string');
  });

  it('is idempotent: re-running the pipeline does not duplicate reminders/notifications', async () => {
    await createTask({
      title: 'Take medication',
      reminderTime: '08:00',
      recurrence: { frequency: 'daily', interval: 1, startDate: todayStr },
    });
    await scheduler.tick(at(12));
    const firstUnread = (await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: auth })).json().count;
    await scheduler.tick(at(12));
    const secondUnread = (await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: auth })).json().count;
    expect(secondUnread).toBe(firstUnread);
  });

  it('marks notifications read', async () => {
    await createTask({ title: 'Med', reminderTime: '08:00', recurrence: { frequency: 'daily', interval: 1, startDate: todayStr } });
    await scheduler.tick(at(12));

    const list = (await app.inject({ method: 'GET', url: '/api/notifications', headers: auth })).json();
    expect(list.meta.total).toBe(1);

    await app.inject({ method: 'POST', url: `/api/notifications/${list.data[0].id}/read`, headers: auth });
    const unread = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: auth });
    expect(unread.json().count).toBe(0);
  });
});
