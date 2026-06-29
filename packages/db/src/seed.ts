import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { db, sql } from './client';
import * as s from './schema/index';

const DEMO_EMAIL = 'demo@productivity.app';
const DEMO_PASSWORD = 'Password123!';

/** Format a Date as YYYY-MM-DD using *local* components (timezone-safe — avoids
 * the UTC shift that toISOString would introduce near month boundaries). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Date in the current month on a given day-of-month. */
function thisMonth(day: number): string {
  const now = new Date();
  return ymd(new Date(now.getFullYear(), now.getMonth(), day));
}

/**
 * Seed a demo account with categories, recurring income/expenses, and tasks.
 * Idempotent: removes any existing demo user (cascades) before re-inserting.
 */
async function main() {
  console.log('[db] seeding…');

  // Clean slate for the demo user (FK cascades remove dependent rows).
  await db.delete(s.users).where(eq(s.users.email, DEMO_EMAIL));

  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  const [user] = await db
    .insert(s.users)
    .values({ email: DEMO_EMAIL, passwordHash, name: 'Demo User', emailVerified: true })
    .returning();
  if (!user) throw new Error('failed to insert demo user');
  const userId = user.id;

  await db.insert(s.userSettings).values({ userId, currency: 'USD', timezone: 'UTC' });

  // Categories
  const [salaryCat, freelanceCat] = await db
    .insert(s.categories)
    .values([
      { userId, type: 'income', name: 'Salary', color: '#16a34a', icon: 'wallet' },
      { userId, type: 'income', name: 'Freelance', color: '#0ea5e9', icon: 'laptop' },
    ])
    .returning();

  const expenseCats = await db
    .insert(s.categories)
    .values([
      { userId, type: 'expense', name: 'Rent', color: '#ef4444', icon: 'home' },
      { userId, type: 'expense', name: 'Utilities', color: '#f59e0b', icon: 'zap' },
      { userId, type: 'expense', name: 'Groceries', color: '#84cc16', icon: 'shopping-cart' },
      { userId, type: 'expense', name: 'Subscriptions', color: '#a855f7', icon: 'repeat' },
      { userId, type: 'expense', name: 'Transportation', color: '#06b6d4', icon: 'car' },
    ])
    .returning();
  const rentCat = expenseCats[0]!;
  const utilitiesCat = expenseCats[1]!;
  const groceriesCat = expenseCats[2]!;
  const subsCat = expenseCats[3]!;

  // Recurring rules (monthly) for salary and rent.
  const [salaryRule, rentRule, medsRule, regoRule] = await db
    .insert(s.recurringRules)
    .values([
      { userId, frequency: 'monthly', interval: 1, startDate: thisMonth(1) },
      { userId, frequency: 'monthly', interval: 1, startDate: thisMonth(1) },
      { userId, frequency: 'daily', interval: 1, startDate: thisMonth(1) },
      { userId, frequency: 'yearly', interval: 1, startDate: thisMonth(1) },
    ])
    .returning();

  // Income
  await db.insert(s.income).values([
    {
      userId,
      categoryId: salaryCat!.id,
      amount: '5200.00',
      date: thisMonth(1),
      description: 'Monthly salary',
      isRecurring: true,
      recurringRuleId: salaryRule!.id,
    },
    {
      userId,
      categoryId: freelanceCat!.id,
      amount: '750.00',
      date: thisMonth(12),
      description: 'Freelance project',
    },
  ]);

  // Expenses (mix of paid/unpaid, recurring/one-off)
  await db.insert(s.expenses).values([
    {
      userId,
      categoryId: rentCat.id,
      amount: '1800.00',
      dueDate: thisMonth(5),
      description: 'Apartment rent',
      isRecurring: true,
      recurringRuleId: rentRule!.id,
      status: 'unpaid',
    },
    {
      userId,
      categoryId: utilitiesCat.id,
      amount: '140.00',
      dueDate: thisMonth(10),
      description: 'Electricity + water',
      status: 'paid',
      paidAt: new Date(),
    },
    {
      userId,
      categoryId: groceriesCat.id,
      amount: '420.00',
      dueDate: thisMonth(15),
      description: 'Groceries',
      status: 'paid',
      paidAt: new Date(),
    },
    {
      userId,
      categoryId: subsCat.id,
      amount: '15.99',
      dueDate: thisMonth(20),
      description: 'Streaming subscription',
      status: 'unpaid',
    },
  ]);

  // Tasks: daily / monthly / yearly
  const [medsTask] = await db
    .insert(s.tasks)
    .values({
      userId,
      title: 'Take medication',
      description: 'Daily evening dose',
      priority: 'high',
      status: 'pending',
      reminderTime: '20:00',
      isRecurring: true,
      recurringRuleId: medsRule!.id,
      telegramEnabled: true,
    })
    .returning();

  await db.insert(s.tasks).values([
    {
      userId,
      title: 'Pay rent',
      description: 'Monthly rent payment',
      priority: 'urgent',
      status: 'pending',
      dueDate: thisMonth(5),
      reminderTime: '09:00',
      isRecurring: true,
      recurringRuleId: rentRule!.id,
      telegramEnabled: true,
    },
    {
      userId,
      title: 'Vehicle registration',
      description: 'Annual vehicle registration renewal',
      priority: 'medium',
      status: 'pending',
      dueDate: thisMonth(28),
      isRecurring: true,
      recurringRuleId: regoRule!.id,
    },
    {
      userId,
      categoryId: groceriesCat.id,
      title: 'Weekly grocery run',
      priority: 'low',
      status: 'pending',
      dueDate: thisMonth(new Date().getDate()),
    },
  ]);

  // A few occurrences for the daily medication task.
  if (medsTask) {
    const today = new Date();
    await db.insert(s.taskOccurrences).values([
      { taskId: medsTask.id, occurrenceDate: ymd(today), status: 'pending' },
      {
        taskId: medsTask.id,
        occurrenceDate: ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
        status: 'completed',
        completedAt: new Date(),
      },
    ]);
  }

  // Welcome notification
  await db.insert(s.notifications).values({
    userId,
    type: 'system',
    title: 'Welcome to your Productivity Platform',
    body: 'Your demo account is ready. Explore finance, tasks, and reminders.',
  });

  console.log(`[db] seed complete. Demo login → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await sql.end();
}

main().catch((err) => {
  console.error('[db] seed failed:', err);
  process.exit(1);
});
