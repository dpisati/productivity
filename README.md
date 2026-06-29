# Productivity Platform

A production-ready, Dockerized full-stack app for **personal finance, tasks,
reminders**, and messaging integrations (Telegram now, Alexa later).

> **Status:** Milestone 1 — monorepo skeleton. The app boots end-to-end (web →
> API health check). Database schema, auth, and feature modules follow in later
> milestones (see [Roadmap](#roadmap)).

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Zustand, TanStack Query, React Router |
| Backend  | Node 20, TypeScript, Fastify, Drizzle ORM, Zod, JWT (access + refresh), argon2, node-cron |
| Database | PostgreSQL 16 (Docker) locally → Supabase Postgres in production |
| Tooling  | pnpm workspaces, Turborepo, ESLint (flat), Prettier, Vitest, Playwright |

## Monorepo layout

```
apps/
  api/      Fastify backend
  web/      React + Vite frontend
packages/
  shared/   Zod schemas + DTOs shared by api & web (single source of truth)
  db/       Drizzle schema, migrations, seed, client
  config/   Shared tsconfig + ESLint presets
```

## Prerequisites

- Node ≥ 20.10, pnpm 10.x (`corepack enable`)
- Docker + Docker Compose (for Postgres / full stack)

## Quick start (local, without Docker)

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# In one terminal — API (http://localhost:4000, health at /api/health)
pnpm --filter @productivity/api dev

# In another — web app (http://localhost:5173)
pnpm --filter @productivity/web dev
```

The web app shows an **API status** indicator that turns green once it reaches
`/api/health` through the Vite dev proxy.

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
# web → http://localhost:5173 · api → http://localhost:4000/api/health
```

### Database (Docker Postgres)

```bash
docker compose up -d postgres
# from the host, migrate + seed (uses localhost):
DATABASE_URL=postgres://postgres:postgres@localhost:5432/productivity \
  pnpm --filter @productivity/db migrate
DATABASE_URL=postgres://postgres:postgres@localhost:5432/productivity \
  pnpm --filter @productivity/db seed
```

Demo login (seeded): **demo@productivity.app** / **Password123!**

## Common scripts

```bash
pnpm dev          # turbo: run all dev servers
pnpm build        # turbo: build all packages/apps
pnpm typecheck    # turbo: typecheck everything
pnpm lint         # turbo: lint everything
pnpm test         # turbo: run unit/integration tests
pnpm db:migrate   # apply Drizzle migrations (M2+)
pnpm db:seed      # seed demo data (M2+)
```

## Roadmap

| Milestone | Scope |
|-----------|-------|
| **M1** ✅ | Monorepo + tooling skeleton, bootable api/web |
| **M2** ✅ | Drizzle schema (13 tables), migrations, seed, Docker Postgres |
| **M3** ✅ | Fastify foundation + full auth (JWT, refresh, reset, verify), RBAC, audit logs, Swagger at `/docs` |
| **M4** ✅ | Finance module: categories, income, expenses CRUD + dashboard summary & cashflow |
| **M5** ✅ | Tasks + recurring rules + occurrences, node-cron scheduler, reminder pipeline, notifications |
| **M6** ✅ | Frontend foundation: router, auth flow, layout, dark mode, shadcn/ui, typed API client |
| M7 | Frontend modules + charts (dashboard, finance, tasks, calendar, settings) |
| M8 | Telegram integration (bot, linking, webhook, notifier) |
| M9 | Alexa stubs, Playwright E2E, docs, Alexa implementation plan |
