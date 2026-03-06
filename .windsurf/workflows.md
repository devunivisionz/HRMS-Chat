# Windsurf Workflows — HRMS
# Define reusable AI workflows for common development tasks in this project.

---

name: new-hrm-module
description: Scaffold a complete new HRM module (routes + service + schema + page)
steps:
  - Read the module name from user input (e.g. "training")
  - Create apps/api/src/modules/[module]/[module].schema.ts with Zod schemas
  - Create apps/api/src/modules/[module]/[module].service.ts with class + constructor injection + Prisma
  - Create apps/api/src/modules/[module]/[module].routes.ts with authenticate → requireRole → validate → handler pattern
  - Add model to apps/api/prisma/schema.prisma following field ordering and index conventions
  - Create apps/web/app/(hrms)/[module]/page.tsx as a Server Component
  - Create apps/web/app/(hrms)/[module]/loading.tsx with Skeleton
  - Create apps/web/app/(hrms)/[module]/error.tsx
  - Create apps/web/app/(hrms)/[module]/_components/ folder
  - Add types to packages/types/src/[module].ts and export from index.ts
  - Register router in apps/api/src/index.ts

---

name: new-api-endpoint
description: Add a new endpoint to an existing module
steps:
  - Add Zod schema to [module].schema.ts
  - Add service method to [module].service.ts (use $transaction if multi-step, use Promise.all for parallel)
  - Add route to [module].routes.ts (authenticate → requireRole → validate → handler)
  - Add @@index to Prisma schema if new query pattern is introduced
  - Run pnpm db:migrate to create migration

---

name: add-notification-type
description: Add a new notification event to the system
steps:
  - Add event type string to packages/types/src/notifications.ts
  - Add handler case in apps/api/src/modules/notifications/notification.service.ts
  - Add to AUDITABLE_ACTIONS if it's an HR action
  - Add push worker case in apps/api/src/modules/notifications/push.worker.ts
  - Add email worker case + React Email template if email delivery needed
  - Add routing row to NotificationPreference type in packages/types

---

name: new-mongoose-model
description: Add a new MongoDB collection model
steps:
  - Create apps/api/models/[ModelName].ts following the model template in models/.windsurfrules
  - Define interface extending Document
  - Define schema with timestamps: true and explicit collection name
  - Add required indexes for all query patterns
  - Export with mongoose.models check for hot-reload safety
  - Add TypeScript type to packages/types if used by frontend

---

name: fix-performance-issue
description: Investigate and fix a slow query or slow page
steps:
  - Check if query uses .select() (no SELECT *)
  - Check if query uses take/skip pagination (no unbounded lists)
  - Check if @@index exists for the WHERE + ORDER BY columns
  - Check if Redis cache can be applied (check Redis cache pattern in .windsurfrules)
  - For Mongoose: check .lean() is used on read-only queries
  - For frontend: check if component should be Server Component
  - For frontend: check if heavy component should use dynamic() lazy loading
  - Check TanStack Query staleTime is appropriate for this data type
