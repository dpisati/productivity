/**
 * @productivity/shared — single source of truth for cross-cutting Zod schemas,
 * DTO types, and enums shared between the API and web app.
 *
 * Domain schemas (auth, finance, tasks, …) are added here in later milestones.
 */
export * from './common/enums.js';
export * from './common/primitives.js';
export * from './common/pagination.js';
export * from './common/recurrence.js';
export * from './auth/index.js';
export * from './categories/schemas.js';
export * from './finance/schemas.js';
export * from './dashboard/schemas.js';
export * from './tasks/schemas.js';
export * from './reminders/schemas.js';
export * from './notifications/schemas.js';
