# HRMS + InHouse Chat

> Internal Human Resource Management System with integrated team chat.
> **Monolithic PWA** · Next.js 14 + Express.js · Poly-Database · Cross-Platform Push Notifications

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 8 — `npm install -g pnpm`
- Docker + Docker Compose
- Git

### 1. Clone & Install
```bash
git clone <repo-url> hrms
cd hrms
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your values:
# - Supabase URL + keys (create free project at supabase.com)
# - Generate VAPID keys: npx web-push generate-vapid-keys
# Leave DATABASE_URL, MONGODB_URI, REDIS_URL as-is for Docker
```

### 3. Start Local Services (Docker)
```bash
docker compose up -d
# Starts: PostgreSQL (5432), MongoDB (27017), Redis (6379),
#         MailHog (8025), Redis Insight (5540)
```

### 4. Database Setup
```bash
pnpm db:migrate   # Run Prisma migrations
pnpm db:seed      # Seed initial data (departments, leave types, admin user)
```

### 5. Start Development
```bash
pnpm dev
# Web:  http://localhost:3000
# API:  http://localhost:4000
# Mail: http://localhost:8025  (MailHog)
```

---

## Project Structure

```
hrms/
├── .windsurfrules          ← Global Windsurf AI rules
├── .windsurf/
│   ├── memories.md         ← Project context for AI sessions
│   └── workflows.md        ← Reusable AI task workflows
├── apps/
│   ├── web/                ← Next.js 14 PWA
│   │   └── .windsurfrules  ← Frontend-specific rules
│   └── api/                ← Express.js API
│       ├── .windsurfrules  ← Backend-specific rules
│       ├── prisma/         ← PostgreSQL schema + migrations
│       └── models/         ← Mongoose schemas (MongoDB)
├── packages/
│   ├── types/              ← Shared TypeScript types + Zod schemas
│   └── email-templates/    ← React Email templates
├── .github/workflows/      ← GitHub Actions CI
├── docker-compose.yml      ← Local dev services
└── ARCHITECTURE.md         ← Full architecture documentation
```

---

## Key Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm lint` | ESLint across all packages |
| `pnpm format` | Prettier format all files |
| `pnpm test` | Run all Vitest tests |
| `pnpm db:migrate` | Create + run new Prisma migration |
| `pnpm db:studio` | Open Prisma Studio (DB browser) |
| `pnpm db:seed` | Seed the database |
| `docker compose up -d` | Start local services |
| `docker compose down` | Stop local services |

---

## Databases

| Database | Local URL | Purpose |
|---|---|---|
| PostgreSQL | `localhost:5432` | HRM core data |
| MongoDB | `localhost:27017` | Chat, notifications, feeds |
| Redis | `localhost:6379` | Cache, presence, queues |
| Supabase | cloud (free tier) | Auth, Storage, Realtime |

**Free GUIs:**
- PostgreSQL + MongoDB: [DBeaver](https://dbeaver.io/) (free)
- MongoDB: [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (free)
- Redis: [Redis Insight](http://localhost:5540) (runs in Docker)
- Email: [MailHog](http://localhost:8025) (runs in Docker)

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete documentation including:
- Poly-database strategy and feature → DB mapping
- Cross-platform notification system (Web, Android, iOS PWA, Email)
- CSS/Tailwind rules
- Code conventions
- Security practices
- Performance optimization guide
- Free toolchain reference

---

## Windsurf AI Setup

This project is configured for Windsurf IDE with cascade rules:

| Rules File | Scope |
|---|---|
| `.windsurfrules` | All files — global conventions |
| `apps/web/.windsurfrules` | Next.js + Tailwind specific rules |
| `apps/api/.windsurfrules` | Express + Prisma + Mongoose rules |
| `apps/api/prisma/.windsurfrules` | Prisma schema conventions |
| `apps/api/models/.windsurfrules` | Mongoose model conventions |
| `packages/.windsurfrules` | Shared packages conventions |
| `.windsurf/memories.md` | Project context across sessions |
| `.windsurf/workflows.md` | Reusable scaffold workflows |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| State | TanStack Query + Zustand |
| Auth | Supabase Auth (JWT + RLS + MFA) |
| API | Express.js 5, TypeScript, Socket.io |
| Validation | Zod (shared frontend + backend) |
| ORM | Prisma (PostgreSQL) + Mongoose (MongoDB) |
| Files | Supabase Storage |
| Realtime | Socket.io + Supabase Realtime |
| Push | web-push (VAPID — no Firebase) |
| Queue | BullMQ (Redis) |
| Email | Nodemailer + React Email + MailHog (dev) |
| PDF | Puppeteer |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |
| Deploy | Nginx + PM2 + Let's Encrypt |

**Zero paid tools required.**
