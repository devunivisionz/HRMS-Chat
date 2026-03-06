# Windsurf Memories — HRMS Project Context
# This file is read by Windsurf AI to maintain context across sessions.
# Update this file when major architectural decisions change.

## WHAT THIS PROJECT IS
Internal HRMS (Human Resource Management System) + InHouse Chat for a 20-person company.
Single monolithic PWA. Priority: HRMS features > Chat features.

## CURRENT PHASE
Phase 1 — Foundation setup.
Next: Phase 2 — Core HRM (Employee, Attendance, Leave modules).

## DATABASE ROUTING — MEMORIZE THIS
- PostgreSQL (Prisma):    employees, attendance, leaves, payroll, performance, recruitment
- MongoDB (Mongoose):     chat messages, channels, notifications, activity feed, audit logs, push subscriptions
- Supabase:               auth (JWT + RLS), storage (files/PDFs/CVs/avatars), realtime subscriptions
- Redis:                  presence TTL, rate limiting, API cache, BullMQ job queues

## ROLES
- ADMIN    → full access
- HR       → all HRM modules
- MANAGER  → own team only
- EMPLOYEE → own records only

## KEY ARCHITECTURAL DECISIONS (do not reverse without discussion)
1. Monolith — NOT microservices. Single Express.js server handles all modules.
2. No Firebase/FCM — use web-push (VAPID) for push notifications.
3. No paid tools anywhere — only free/open-source.
4. Supabase replaces custom auth AND MinIO for file storage.
5. MongoDB replaces PostgreSQL for chat (flexible schema, Atlas Search).
6. BullMQ (Redis) for all async jobs — never process push/email synchronously.
7. Socket.io for chat realtime — Supabase Realtime for simpler status events.
8. pnpm + Turborepo monorepo — apps/web, apps/api, packages/types, packages/email-templates.

## FOLDER CONVENTIONS TO ALWAYS FOLLOW
- New HRM module files go in: apps/api/src/modules/[module-name]/
- New page files go in:       apps/web/app/(hrms)/[module-name]/
- Shared types go in:         packages/types/src/
- Mongoose models go in:      apps/api/models/
- Email templates go in:      packages/email-templates/src/

## NEVER DO THESE
- Never use `any` in TypeScript
- Never fetch in useEffect — use Server Components or TanStack Query
- Never use raw <img> — always next/image
- Never inline styles — Tailwind classes only
- Never hardcode hex colors — use CSS variable tokens
- Never send push/email synchronously — always BullMQ queue
- Never trust role from client request body
- Never import one module's service from another module
- Never return unbounded list from API — always paginate
- Never commit .env files

## FREE TOOLS USED
Editor: VS Code or any free editor
Testing: Vitest + Playwright
DB GUI: DBeaver (free) + MongoDB Compass (free) + Redis Insight (free)
Email testing: MailHog (local Docker container)
Deployment: Nginx + PM2 + Let's Encrypt + Docker
Monitoring: Uptime Kuma + Sentry free tier
CI: GitHub Actions (free tier)

## ENVIRONMENT QUICK REFERENCE
Local dev services (Docker):
- PostgreSQL: localhost:5432  (hrms_dev / hrms_user / hrms_dev_password)
- MongoDB:    localhost:27017  (hrms / hrms_user / hrms_dev_password)
- Redis:      localhost:6379   (password: hrms_dev_password)
- MailHog:    localhost:8025   (web UI) / localhost:1025 (SMTP)
- Redis Insight: localhost:5540

## WINDSURF RULES FILES LOCATION
- Root:           /.windsurfrules              (global rules, all files)
- Frontend:       /apps/web/.windsurfrules     (Next.js + Tailwind rules)
- Backend:        /apps/api/.windsurfrules     (Express + Prisma + Mongoose rules)
- Prisma:         /apps/api/prisma/.windsurfrules
- Mongoose:       /apps/api/models/.windsurfrules
- Packages:       /packages/.windsurfrules
