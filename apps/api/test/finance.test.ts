import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeader, makeApp, registerUser, resetDb } from './helpers.js';

const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 7)}-01`;

describe('finance', () => {
  let app: FastifyInstance;
  let token: string;
  let auth: Record<string, string>;

  beforeAll(async () => {
    app = await makeApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
    const u = await registerUser(app);
    token = u.accessToken;
    auth = authHeader(token);
  });

  async function createCategory(type: 'income' | 'expense', name: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: auth,
      payload: { type, name },
    });
    expect(res.statusCode).toBe(201);
    return res.json();
  }

  describe('categories', () => {
    it('creates, lists, filters, updates and soft-deletes', async () => {
      const salary = await createCategory('income', 'Salary');
      await createCategory('expense', 'Rent');

      const all = await app.inject({ method: 'GET', url: '/api/categories', headers: auth });
      expect(all.json()).toHaveLength(2);

      const onlyIncome = await app.inject({
        method: 'GET',
        url: '/api/categories?type=income',
        headers: auth,
      });
      expect(onlyIncome.json()).toHaveLength(1);
      expect(onlyIncome.json()[0].name).toBe('Salary');

      const upd = await app.inject({
        method: 'PATCH',
        url: `/api/categories/${salary.id}`,
        headers: auth,
        payload: { color: '#16a34a' },
      });
      expect(upd.json().color).toBe('#16a34a');

      const del = await app.inject({
        method: 'DELETE',
        url: `/api/categories/${salary.id}`,
        headers: auth,
      });
      expect(del.statusCode).toBe(204);

      const after = await app.inject({ method: 'GET', url: '/api/categories', headers: auth });
      expect(after.json()).toHaveLength(1);
    });

    it('rejects duplicate name+type with 409', async () => {
      await createCategory('expense', 'Rent');
      const dup = await app.inject({
        method: 'POST',
        url: '/api/categories',
        headers: auth,
        payload: { type: 'expense', name: 'Rent' },
      });
      expect(dup.statusCode).toBe(409);
    });
  });

  describe('income', () => {
    it('CRUD with category embedding, pagination and filters', async () => {
      const cat = await createCategory('income', 'Salary');

      const created = await app.inject({
        method: 'POST',
        url: '/api/income',
        headers: auth,
        payload: { amount: '5200.00', date: monthStart, categoryId: cat.id, description: 'Salary' },
      });
      expect(created.statusCode).toBe(201);
      const body = created.json();
      expect(body.amount).toBe('5200.00');
      expect(body.category).toMatchObject({ id: cat.id, name: 'Salary' });

      const list = await app.inject({ method: 'GET', url: '/api/income?pageSize=10', headers: auth });
      expect(list.json().meta.total).toBe(1);
      expect(list.json().data).toHaveLength(1);

      const filtered = await app.inject({
        method: 'GET',
        url: `/api/income?categoryId=${cat.id}`,
        headers: auth,
      });
      expect(filtered.json().meta.total).toBe(1);

      const upd = await app.inject({
        method: 'PATCH',
        url: `/api/income/${body.id}`,
        headers: auth,
        payload: { amount: '5500.00' },
      });
      expect(upd.json().amount).toBe('5500.00');

      const del = await app.inject({ method: 'DELETE', url: `/api/income/${body.id}`, headers: auth });
      expect(del.statusCode).toBe(204);
      const after = await app.inject({ method: 'GET', url: '/api/income', headers: auth });
      expect(after.json().meta.total).toBe(0);
    });

    it('creates recurring income with a rule', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/income',
        headers: auth,
        payload: {
          amount: '5200.00',
          date: monthStart,
          recurrence: { frequency: 'monthly', interval: 1, startDate: monthStart },
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().isRecurring).toBe(true);
      expect(res.json().recurringRule).toMatchObject({ frequency: 'monthly', interval: 1 });
    });
  });

  describe('expenses', () => {
    it('marks paid/unpaid and tracks paidAt', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/api/expenses',
        headers: auth,
        payload: { amount: '1800.00', dueDate: today, description: 'Rent', status: 'unpaid' },
      });
      const exp = created.json();
      expect(exp.status).toBe('unpaid');
      expect(exp.paidAt).toBeNull();

      const paid = await app.inject({
        method: 'PATCH',
        url: `/api/expenses/${exp.id}`,
        headers: auth,
        payload: { status: 'paid' },
      });
      expect(paid.json().status).toBe('paid');
      expect(paid.json().paidAt).not.toBeNull();

      const unpaidList = await app.inject({
        method: 'GET',
        url: '/api/expenses?status=unpaid',
        headers: auth,
      });
      expect(unpaidList.json().meta.total).toBe(0);
    });
  });

  describe('dashboard', () => {
    it('summary aggregates income, expenses, net, savings rate', async () => {
      const incCat = await createCategory('income', 'Salary');
      const expCat = await createCategory('expense', 'Rent');
      await app.inject({
        method: 'POST',
        url: '/api/income',
        headers: auth,
        payload: { amount: '1000.00', date: monthStart, categoryId: incCat.id },
      });
      await app.inject({
        method: 'POST',
        url: '/api/expenses',
        headers: auth,
        payload: { amount: '400.00', dueDate: today, categoryId: expCat.id, status: 'unpaid' },
      });

      const res = await app.inject({ method: 'GET', url: '/api/dashboard/summary', headers: auth });
      expect(res.statusCode).toBe(200);
      const s = res.json();
      expect(s.income).toBe('1000.00');
      expect(s.expenses).toBe('400.00');
      expect(s.net).toBe('600.00');
      expect(s.savingsRate).toBe(60);
      expect(s.spendingByCategory).toHaveLength(1);
      expect(s.upcomingBills.length).toBeGreaterThanOrEqual(1);
    });

    it('cashflow returns N historical points plus a projection', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/dashboard/cashflow?months=3',
        headers: auth,
      });
      expect(res.statusCode).toBe(200);
      const pts = res.json().points;
      expect(pts).toHaveLength(4); // 3 historical + 1 projected
      expect(pts.at(-1).projected).toBe(true);
    });
  });

  it('enforces per-user ownership (404 across users)', async () => {
    const cat = await createCategory('income', 'Salary');
    const created = await app.inject({
      method: 'POST',
      url: '/api/income',
      headers: auth,
      payload: { amount: '100.00', date: monthStart, categoryId: cat.id },
    });
    const otherUser = await registerUser(app, { email: `other-${Date.now()}@test.dev` });
    const res = await app.inject({
      method: 'GET',
      url: `/api/income/${created.json().id}`,
      headers: authHeader(otherUser.accessToken),
    });
    expect(res.statusCode).toBe(404);
  });
});
