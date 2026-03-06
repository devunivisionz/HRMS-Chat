# HRMS + InHouse Chat — Principal Architecture

> **Monolithic PWA · Next.js 14 + Express.js · Poly-Database · Cross-Platform Notifications**
> Priority: HRMS Core → Chat (secondary bounded module)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Poly-Database Strategy](#2-poly-database-strategy)
3. [Feature → Database Responsibility Map](#3-feature--database-responsibility-map)
4. [Architecture Layers](#4-architecture-layers)
5. [Cross-Platform Notification System](#5-cross-platform-notification-system)
6. [Real-time & WebSocket Flow](#6-real-time--websocket-flow)
7. [HRMS Module Breakdown](#7-hrms-module-breakdown)
8. [InHouse Chat Module Breakdown](#8-inhouse-chat-module-breakdown)
9. [Database Schemas](#9-database-schemas)
10. [Folder Structure](#10-folder-structure)
11. [Full Tech Stack](#11-full-tech-stack)
12. [Security Architecture](#12-security-architecture)
13. [Deployment & Infrastructure](#13-deployment--infrastructure)
14. [Build Roadmap](#14-build-roadmap)
15. [Environment Variables](#15-environment-variables)
16. [CSS & Tailwind Rules](#16-css--tailwind-rules)
17. [Folder Structure Conventions](#17-folder-structure-conventions)
18. [Code Conventions](#18-code-conventions)
19. [Security Practices](#19-security-practices)
20. [Performance Optimization](#20-performance-optimization)
21. [Free Tools Only — Approved Toolchain](#21-free-tools-only--approved-toolchain)

---

## 1. System Overview

### Design Philosophy

This is a **single deployable monolith** — one Next.js frontend, one Express.js API server, one unified codebase. Internally, the code is organized into **bounded modules** (HRM, Chat, Auth, Notifications) that are cleanly separated. This gives you:

- ✅ Monolith simplicity — one deploy, one repo, no distributed system overhead
- ✅ Modular internals — clear boundaries, easy to reason about, testable in isolation
- ✅ Future-ready — each module can be extracted into a microservice if the team scales beyond 20

### Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BROWSER / PWA CLIENT                             │
│         Next.js 14 App Router  ·  Service Worker  ·  PWA           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │  HTTPS + WSS
┌─────────────────────▼───────────────────────────────────────────────┐
│                   API GATEWAY (Express.js)                          │
│    Supabase JWT Auth → RBAC → Rate Limit → Zod Validate → Logger   │
└──────┬──────────┬──────────┬──────────┬────────────────────────────┘
       │          │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐
  │  HRM   │ │  Chat  │ │  Auth  │ │ Notifs  │
  │Modules │ │Module  │ │Module  │ │ Module  │
  └────┬───┘ └───┬────┘ └──┬─────┘ └──┬──────┘
       │         │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐
  │Postgres│ │MongoDB │ │Supabase│ │ MongoDB │
  │(Prisma)│ │(Mongoos│ │ Auth + │ │+ BullMQ │
  │        │ │   e)   │ │Storage │ │+ Redis  │
  └────────┘ └────────┘ └────────┘ └─────────┘
```

---

## 2. Poly-Database Strategy

> **Use the best storage engine per feature domain — not one DB for everything.**

### Why Poly-Database?

| Concern | Single DB Approach | Poly-Database Approach |
|---|---|---|
| HRM data | Works fine | ✅ PostgreSQL — ACID, FK constraints, joins |
| Chat messages | Awkward schema | ✅ MongoDB — flexible docs, reactions[], threads |
| Auth + Files | Build from scratch | ✅ Supabase — zero-infra, RLS, Storage CDN |
| Ephemeral state | DB polling | ✅ Redis — TTL keys, pub/sub, no persistence needed |

---

### 🐘 PostgreSQL 16 — Primary HRM Database

**Used for:** All structured, relational HRM data

**Why:** HR workflows demand ACID transactions and relational integrity. Payroll deductions must never partially apply. Leave balance decrements must be atomic. Employee-department-manager hierarchies require foreign key constraints and complex joins.

**Client:** Prisma ORM (type-safe queries, migrations, seeding)

**Handles:**
- Employee profiles, org chart, departments
- Attendance records & timesheets
- Leave requests, approvals & balance tracking
- Payroll runs & salary structures
- Performance goals & review cycles
- Recruitment pipeline & job postings

---

### 🍃 MongoDB Atlas — Chat & Unstructured Data

**Used for:** Chat, notifications, activity feed, audit logs

**Why:** Chat messages are document-shaped with variable fields — reactions vary per message, threads are optional, attachments are arrays with different types. MongoDB's flexible schema handles this naturally. High-write, append-only patterns (feeds, logs) also suit MongoDB well. **Atlas Search** (Lucene-based) handles full-text message search with no extra infrastructure.

**Client:** Mongoose ODM (schema validation, indexes, virtual fields)

**Handles:**
- Chat messages (with embedded reactions, threads, attachments)
- Channels & DMs
- Notification inbox documents
- Activity feed / event stream
- HR action audit logs
- Performance review free-text comments

---

### ⚡ Supabase — Auth · Real-time · File Storage

**Used for:** Authentication, file storage, real-time subscriptions

**Why:** Supabase eliminates entire infrastructure categories. Auth with JWT, MFA, Row Level Security, and invite emails — zero custom build. Storage with CDN, signed URLs, and bucket policies per role — no MinIO to manage. Realtime subscriptions for typing indicators and live status updates — no custom WebSocket layer for these events.

**Handles:**
- User authentication (JWT + Refresh tokens + MFA)
- Row Level Security — employees can only see own data at DB level
- Storage buckets: payslip PDFs, employee documents, CVs, chat attachments, profile avatars
- Realtime subscriptions: typing indicators, leave status updates, notification bell
- Auth emails: welcome, password reset, invite

---

### 🔴 Redis 7 — Cache · Presence · Queue

**Used for:** Ephemeral state only — nothing that matters if lost on restart

**Why:** Online/offline presence doesn't need DB persistence — TTL keys that expire when socket disconnects are perfect. Rate limiting counters, API response caching, and BullMQ job queues (backed by Redis) for reliable async job delivery.

**Handles:**
- Socket presence tracking (TTL keys per user)
- Rate limiting counters (per IP + per user)
- API response cache (leave balances, org chart)
- BullMQ job queues (payroll batch, email delivery, push notifications)
- Typing indicator pub/sub channels

---

## 3. Feature → Database Responsibility Map

| Feature / Module | Primary DB | Secondary | Rationale |
|---|---|---|---|
| ⭐ Employee Profiles | 🐘 PostgreSQL | ⚡ Supabase Auth | Relational: dept FK, manager FK, enum statuses, joins |
| ⭐ Attendance | 🐘 PostgreSQL | 🔴 Redis cache | Date-range aggregations, SUM(hours), daily uniqueness |
| ⭐ Leave Management | 🐘 PostgreSQL | 🍃 Mongo (feed) | ACID balance deduction; approval state machine |
| ⭐ Payroll | 🐘 PostgreSQL | ⚡ Supabase Storage | Financial ACID transactions; PDFs in Storage buckets |
| Performance Reviews | 🐘 PostgreSQL | 🍃 Mongo (comments) | Structured ratings in PG; free-text comments in Mongo |
| Recruitment | 🐘 PostgreSQL | ⚡ Supabase Storage | Pipeline stages relational; CVs/resumes in buckets |
| Chat Messages | 🍃 MongoDB | ⚡ Supabase RT | Flexible doc schema; reactions[], threads; Atlas Search |
| Chat Channels | 🍃 MongoDB | 🔴 Redis (rooms) | Channel docs + member arrays; active rooms in Redis |
| File Attachments | ⚡ Supabase Storage | 🍃 Mongo (metadata) | Binary in buckets; file metadata in message doc |
| Notifications | 🍃 MongoDB | 🔴 Redis (queue) | Per-user notification docs; BullMQ delivery queue |
| Activity Feed | 🍃 MongoDB | — | Append-only event stream; flexible payload per type |
| Auth & Sessions | ⚡ Supabase Auth | 🔴 Redis (session) | Supabase JWT lifecycle; Redis for fast session lookup |
| Online Presence | 🔴 Redis TTL | — | Ephemeral — expires on socket disconnect |
| Audit Logs | 🍃 MongoDB | — | Append-only, flexible payload, time-range queries |
| Push Subscriptions | 🍃 MongoDB | — | Per-user, per-device subscription objects |

> ⭐ = HRMS Priority features

---

## 4. Architecture Layers

### Layer 1 — Client (Next.js 14 PWA)

```
┌─────────────────────────────────────────────────────────┐
│  (hrms)/ route group          (chat)/ route group       │
│  ├── dashboard/               └── chat/[channelId]/     │
│  ├── employees/                                         │
│  ├── attendance/              (auth)/ route group       │
│  ├── leaves/                  ├── login/                │
│  ├── payroll/                 └── callback/             │
│  └── performance/                                       │
├─────────────────────────────────────────────────────────┤
│  Supabase Auth Provider  ·  TanStack Query  ·  Zustand  │
│  Socket.io client hook   ·  Supabase Realtime hook      │
│  Service Worker          ·  Push Notification handler   │
└─────────────────────────────────────────────────────────┘
```

**Key responsibilities:**
- App Router file-based routing, split into `(hrms)`, `(chat)`, `(auth)` route groups
- `@supabase/auth-helpers-nextjs` for server-side session management
- `useSocket()` hook — Socket.io connection for chat real-time
- `usePresence()` hook — Supabase Realtime for typing indicators, status
- Service Worker registers and handles `push` events for cross-platform notifications
- PWA manifest with `display: standalone` for iOS Home Screen support

---

### Layer 2 — API Gateway (Express.js Middleware Pipeline)

Every inbound request passes through this pipeline in order:

```
Request
  │
  ▼
1. Supabase JWT Middleware     → verify token, attach req.user
  │
  ▼
2. RBAC Guard                  → check role permission for route
  │
  ▼
3. Redis Rate Limiter          → per-IP + per-user limits
  │
  ▼
4. Zod Schema Validation       → validate body/params/query
  │
  ▼
5. Route Handler               → calls Service class
  │
  ▼
6. MongoDB Audit Logger        → log HR actions (middleware)
  │
  ▼
Response
```

**RBAC Roles:**

| Role | Access Level |
|---|---|
| `ADMIN` | Full system access — all modules, all employees |
| `HR` | All HRM modules read/write; cannot access other HR's payroll config |
| `MANAGER` | Own team's data only — attendance, leaves, reviews |
| `EMPLOYEE` | Own records only — own attendance, own leaves, own payslips |

---

### Layer 3 — Business Logic (Bounded Service Modules)

Each module is a self-contained folder with its own routes, service class, and Zod schemas. Modules never import from each other — they communicate via events or the Notification Service.

```
modules/
├── employees/       → Prisma (PostgreSQL)
├── attendance/      → Prisma (PostgreSQL) + Redis cache
├── leaves/          → Prisma (PostgreSQL) + Mongoose (feed event)
├── payroll/         → Prisma (PostgreSQL) + Supabase Storage + BullMQ
├── performance/     → Prisma (PostgreSQL) + Mongoose (comments)
├── recruitment/     → Prisma (PostgreSQL) + Supabase Storage
├── chat/            → Mongoose (MongoDB) + Socket.io gateway
├── notifications/   → Mongoose (MongoDB) + BullMQ + web-push
├── files/           → Supabase Storage client
└── auth/            → Supabase Admin SDK
```

---

### Layer 4 — Data Layer

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │  MongoDB     │  │  Supabase    │  │   Redis 7    │
│              │  │  Atlas       │  │              │  │              │
│ Prisma ORM   │  │ Mongoose ODM │  │ Auth + RLS   │  │ ioredis      │
│              │  │              │  │ Storage CDN  │  │ BullMQ       │
│ HRM tables   │  │ Chat docs    │  │ Realtime     │  │ Presence TTL │
│ ACID txns    │  │ Notif inbox  │  │ Invite email │  │ Rate limits  │
│ Migrations   │  │ Audit logs   │  │ Signed URLs  │  │ Job queues   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 5. Cross-Platform Notification System

> Notifications must work on **Web Desktop**, **Android PWA**, **iOS PWA (Home Screen)**, and **Email**.

### Notification Architecture

```
Event fires anywhere in the system
(leave approved / @mention / payslip ready / attendance alert)
              │
              ▼
    ┌─────────────────────┐
    │  Notification        │
    │  Service             │
    │  (Express module)    │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  1. Persist to MongoDB                              │
    │     notifications collection (per-user document)   │
    └──────┬──────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  2. Fire Supabase Realtime event                    │
    │     → updates in-app notification bell instantly    │
    └──────┬──────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  3. Enqueue BullMQ jobs                             │
    └──────┬────────────────────┬───────────────────────┘
           │                    │
    ┌──────▼──────┐    ┌────────▼──────┐
    │ web-push    │    │  Nodemailer   │
    │   worker    │    │  + React Email│
    │             │    │   worker      │
    └──────┬──────┘    └───────────────┘
           │
    ┌──────▼───────────────────────────────────────────────┐
    │  Service Worker receives push event                  │
    │  → self.registration.showNotification(...)           │
    └──────────────────────────────────────────────────────┘
```

---

### Platform-by-Platform Breakdown

#### 🖥️ Web Desktop (Chrome, Firefox, Edge)

- **Mechanism:** Web Push API + VAPID keys
- **Flow:** User grants permission → browser creates `PushSubscription` → stored in MongoDB per user+device → `web-push` npm package sends push from Express → browser wakes Service Worker → OS-level notification shown
- **Works when:** Tab is open, tab is in background, browser is running (tab closed)
- **Package:** `web-push` on server, `PushManager` API in Service Worker

```javascript
// Server — send push notification
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@company.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

await webpush.sendNotification(
  subscription,           // PushSubscription from MongoDB
  JSON.stringify({
    title: 'Leave Approved',
    body: 'Your leave request has been approved.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    url: '/leaves'
  })
);
```

```javascript
// Service Worker — receive and show push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

#### 📱 Android PWA

- **Mechanism:** Same Web Push API as desktop — Android Chrome fully supports it
- **Requirement:** PWA installed (Add to Home Screen) OR just visiting the site
- **Flow:** Identical to desktop push flow — same VAPID keys, same Service Worker
- **Works when:** PWA is in background, screen is locked (Android delivers OS push)
- **No extra code needed** — the same web-push implementation covers Android automatically

---

#### 🍎 iOS PWA (Safari 16.4+)

- **Mechanism:** Web Push API — supported from iOS 16.4+, **only when added to Home Screen**
- **Critical requirements:**
  1. PWA must be installed to Home Screen (`display: standalone` in manifest)
  2. `Notification.requestPermission()` must be called inside a **user gesture** (button click)
  3. iOS ignores permission prompts not triggered by user interaction
- **Manifest requirements:**

```json
{
  "name": "CompanyHR",
  "short_name": "HR",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "background_color": "#06080f",
  "theme_color": "#06080f"
}
```

- **Permission request — must be on button click:**

```javascript
// NotificationPermissionButton.tsx
const requestPermission = async () => {
  // Must be inside onClick — iOS blocks auto-prompts
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const subscription = await registerPushSubscription();
    await savePushSubscription(subscription); // POST to Express → MongoDB
  }
};
```

- **iOS limitation:** Push only delivers when device is online. Background wake-up is limited compared to native apps — acceptable for internal 20-person tool.

---

#### 📧 Email Notifications

- **Mechanism:** Nodemailer + SMTP + React Email templates + BullMQ queue
- **Triggered by:** Leave approved/rejected, payslip generated, new hire onboarding, attendance alerts, @mention digest

```
BullMQ email worker → Nodemailer → SMTP server → Employee inbox
```

**React Email templates (examples):**
- `LeaveApprovalEmail` — shows leave dates, approver, remaining balance
- `PayslipReadyEmail` — download link (Supabase signed URL, 24hr expiry)
- `WelcomeEmail` — onboarding steps, first login link
- `MentionDigestEmail` — batched @mentions if user is offline >30 min

---

#### 🔔 In-App Real-time (Always-on when tab is open)

Two parallel channels:

| Channel | Technology | Use case |
|---|---|---|
| Instant messages | Socket.io | New chat message, typing indicator |
| Status updates | Supabase Realtime | Leave status changed, notification bell count |

```javascript
// useNotifications.ts hook
const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notification_events',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    incrementBadgeCount();
    showToast(payload.new);
  })
  .subscribe();
```

---

### Push Subscription Storage (MongoDB)

```javascript
// models/PushSubscription.ts
const PushSubscriptionSchema = new Schema({
  userId:       { type: String, required: true, index: true },
  subscription: { type: Object, required: true }, // Full PushSubscription object
  platform:     { type: String, enum: ['web', 'android', 'ios'] },
  userAgent:    { type: String },
  createdAt:    { type: Date, default: Date.now },
  lastUsed:     { type: Date, default: Date.now }
});

// Compound index: one user can have multiple devices
PushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });
```

---

### Notification Types & Routing

| Event | In-App | Push | Email |
|---|---|---|---|
| Leave approved/rejected | ✅ | ✅ | ✅ |
| Payslip generated | ✅ | ✅ | ✅ (with link) |
| @mention in chat | ✅ | ✅ | ✅ (digest, if offline) |
| New DM received | ✅ | ✅ | ❌ |
| Attendance reminder | ✅ | ✅ | ❌ |
| Leave request submitted (to manager) | ✅ | ✅ | ✅ |
| Performance review due | ✅ | ✅ | ✅ |
| New employee onboarded | ✅ (HR/Admin) | ❌ | ✅ (welcome) |

---

### Notification Preference Schema (PostgreSQL)

```sql
-- Users control their notification preferences
CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID REFERENCES employees(id),
  type            VARCHAR(50) NOT NULL,   -- 'leave_approved', 'mention', etc.
  in_app          BOOLEAN DEFAULT true,
  push            BOOLEAN DEFAULT true,
  email           BOOLEAN DEFAULT true,
  email_digest    BOOLEAN DEFAULT false,  -- batch into digest instead of instant
  UNIQUE(employee_id, type)
);
```

---

## 6. Real-time & WebSocket Flow

### Chat Real-time Flow (Socket.io)

```
User A types message
      │
      ▼
Socket.io client emits  →  chat:message:send
      │
      ▼
Express Socket.io gateway
  ├── Validates JWT on socket handshake
  ├── Checks user is member of channel
  ├── Persists message to MongoDB
  ├── Updates Redis channel room
  ├── Emits  chat:message:new  to room members
  └── Triggers Notification Service
        ├── Check @mentions → push notification via web-push
        └── Persist to MongoDB notifications collection

All room members receive  chat:message:new  instantly
```

### Presence Flow (Redis TTL)

```
User connects via WebSocket
  → SET presence:userId "online" EX 30   (30 second TTL)
  → Socket heartbeat every 20s refreshes TTL

User disconnects or tab closes
  → TTL expires naturally → key deleted
  → Supabase Realtime broadcasts presence:offline to channel members
```

---

## 7. HRMS Module Breakdown

### 👤 Employee Management
- **DB:** PostgreSQL (Prisma)
- Employee profile: personal info, emergency contacts, documents
- Org chart: recursive manager-employee tree (PostgreSQL recursive CTE)
- Departments & designations management
- Document uploads → Supabase Storage (`employees` bucket, private)
- Onboarding checklist state
- Offboarding workflow with data archival

### ⏰ Attendance & Time Tracking
- **DB:** PostgreSQL (Prisma) + Redis (cache)
- Clock-in / Clock-out with timestamp
- Daily attendance status: Present / Absent / Half-day / WFH / On-Leave
- Overtime calculation per company policy
- Monthly timesheet view with export (CSV)
- Attendance regularization request (employee submits, manager approves)
- Leave balance auto-updates when leaves are linked to attendance

### 🏖️ Leave Management
- **DB:** PostgreSQL (Prisma) + MongoDB (activity feed event)
- Leave types: Annual, Sick, Casual, Maternity/Paternity, Comp-off, Unpaid
- Leave request → Manager approval → HR visibility
- Leave balance tracking per employee per leave type per year
- Auto-deduction from balance on approval (ACID transaction)
- Leave calendar view (team calendar for managers)
- Holiday master list management

### 💰 Payroll Processing
- **DB:** PostgreSQL (Prisma) + Supabase Storage (PDFs) + BullMQ (jobs)
- Salary structure: Basic, HRA, DA, Allowances, custom components
- Deductions: PF, ESI, TDS, Professional Tax, Advance recovery
- Monthly payroll run with lock (immutable after lock)
- Payslip PDF generation via Puppeteer → upload to Supabase Storage → signed URL in email
- Payroll report export (Excel via SheetJS)

### 📋 Recruitment (ATS Lite)
- **DB:** PostgreSQL (Prisma) + Supabase Storage (CVs)
- Job posting creation and publish/unpublish
- Applicant tracking: Applied → Screening → Interview → Offer → Joined
- CV/resume upload → Supabase Storage (`recruitment` bucket)
- Offer letter generation (PDF) → Supabase Storage → email

### ⭐ Performance Reviews
- **DB:** PostgreSQL (ratings/goals) + MongoDB (free-text comments)
- Goal setting per employee per quarter
- Manager ratings: 1–5 scale per goal
- 360-degree feedback (peer reviews)
- Free-text review comments stored as MongoDB documents (flexible length, rich text)
- Performance history timeline

### 📊 HR Analytics Dashboard
- **DB:** PostgreSQL (aggregations) + MongoDB (audit log queries)
- Headcount over time
- Attrition rate
- Attendance trends (heatmap)
- Leave utilization by department
- Payroll cost breakdown

---

## 8. InHouse Chat Module Breakdown

> **For 20 internal users only. Priority is secondary to HRM.**

### 💬 Chat Features
- **DB:** MongoDB Atlas (messages, channels) + Supabase Storage (files) + Redis (presence)

| Feature | Implementation |
|---|---|
| Channels | Public & private channels, `#general` pre-created |
| Direct Messages | 1:1 DMs between any two employees |
| Group DMs | Multi-person DMs (no channel) |
| Message history | Infinite scroll, paginated cursor queries |
| Reactions | Emoji reactions embedded in message document |
| Threaded replies | `parentId` field in message doc |
| Message editing | Soft edit — stores `editedAt` timestamp + edit history array |
| Message deletion | Soft delete — `deletedAt` field, content replaced with "Message deleted" |
| File sharing | Upload to Supabase Storage → preview inline for images |
| @mentions | Parsed on save, triggers notification per mentioned user |
| Link previews | Open Graph metadata fetched server-side |
| Message search | MongoDB Atlas Search (Lucene) — full-text across channels user has access to |
| Typing indicators | Redis pub/sub → Socket.io broadcast → Supabase Realtime |
| Online presence | Redis TTL keys → shown as green dot in member list |
| Read receipts | Per-channel last-read cursor stored in MongoDB |
| Pinned messages | Array of pinned message IDs on channel document |

---

## 9. Database Schemas

### PostgreSQL — Core HRM Tables (Prisma Schema)

```prisma
// prisma/schema.prisma

model Employee {
  id            String       @id @default(uuid())
  empCode       String       @unique
  fullName      String
  email         String       @unique
  phone         String?
  departmentId  String
  department    Department   @relation(fields: [departmentId], references: [id])
  managerId     String?
  manager       Employee?    @relation("EmployeeManager", fields: [managerId], references: [id])
  reports       Employee[]   @relation("EmployeeManager")
  designation   String
  joiningDate   DateTime
  status        EmployeeStatus @default(ACTIVE)
  salaryId      String?
  attendance    Attendance[]
  leaveRequests LeaveRequest[]
  payrollRuns   PayrollRun[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Attendance {
  id          String           @id @default(uuid())
  employeeId  String
  employee    Employee         @relation(fields: [employeeId], references: [id])
  date        DateTime         @db.Date
  clockIn     DateTime?
  clockOut    DateTime?
  totalHours  Decimal?         @db.Decimal(5,2)
  status      AttendanceStatus @default(PRESENT)
  createdAt   DateTime         @default(now())

  @@unique([employeeId, date])
}

model LeaveRequest {
  id           String        @id @default(uuid())
  employeeId   String
  employee     Employee      @relation(fields: [employeeId], references: [id])
  leaveTypeId  String
  leaveType    LeaveType     @relation(fields: [leaveTypeId], references: [id])
  fromDate     DateTime      @db.Date
  toDate       DateTime      @db.Date
  days         Decimal       @db.Decimal(4,1)
  reason       String?
  status       LeaveStatus   @default(PENDING)
  approvedById String?
  approvedAt   DateTime?
  createdAt    DateTime      @default(now())
}

model PayrollRun {
  id            String        @id @default(uuid())
  employeeId    String
  employee      Employee      @relation(fields: [employeeId], references: [id])
  monthYear     DateTime      @db.Date
  basicSalary   Decimal       @db.Decimal(12,2)
  allowances    Json
  deductions    Json
  grossPay      Decimal       @db.Decimal(12,2)
  netPay        Decimal       @db.Decimal(12,2)
  payslipUrl    String?       // Supabase Storage signed URL
  isLocked      Boolean       @default(false)
  processedAt   DateTime?
  createdAt     DateTime      @default(now())

  @@unique([employeeId, monthYear])
}

enum EmployeeStatus  { ACTIVE INACTIVE ON_NOTICE TERMINATED }
enum AttendanceStatus { PRESENT ABSENT HALF_DAY WFH ON_LEAVE }
enum LeaveStatus     { PENDING APPROVED REJECTED CANCELLED }
```

---

### MongoDB — Chat Collections (Mongoose)

```typescript
// models/Message.ts
const MessageSchema = new Schema({
  channelId:   { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
  senderId:    { type: String, required: true, index: true }, // employee UUID from PG
  content:     { type: String, default: '' },
  contentType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  parentId:    { type: Schema.Types.ObjectId, ref: 'Message', default: null }, // thread parent
  attachments: [{
    url:      String,   // Supabase Storage URL
    name:     String,
    size:     Number,
    mimeType: String
  }],
  reactions: [{
    emoji:  String,
    userIds: [String]  // employees who reacted
  }],
  mentions:    [{ type: String }],   // employee UUIDs mentioned
  editHistory: [{ content: String, editedAt: Date }],
  editedAt:    { type: Date, default: null },
  deletedAt:   { type: Date, default: null },
  createdAt:   { type: Date, default: Date.now, index: true }
});

// Atlas Search index on content field
MessageSchema.index({ content: 'text' }); // fallback; Atlas Search preferred

// models/Channel.ts
const ChannelSchema = new Schema({
  name:        { type: String, required: true },
  type:        { type: String, enum: ['channel', 'dm', 'group_dm'], required: true },
  isPrivate:   { type: Boolean, default: false },
  createdBy:   { type: String, required: true },
  memberIds:   [{ type: String }],  // employee UUIDs
  pinnedIds:   [{ type: Schema.Types.ObjectId }],
  topic:       { type: String, default: '' },
  lastMessageAt: { type: Date, index: true },
  createdAt:   { type: Date, default: Date.now }
});

// models/Notification.ts
const NotificationSchema = new Schema({
  userId:    { type: String, required: true, index: true },
  type:      { type: String, required: true },  // 'mention', 'leave_approved', etc.
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  url:       { type: String },  // deep link URL
  isRead:    { type: Boolean, default: false, index: true },
  meta:      { type: Schema.Types.Mixed }, // flexible payload per type
  createdAt: { type: Date, default: Date.now, index: true }
});

// models/AuditLog.ts
const AuditLogSchema = new Schema({
  actorId:   { type: String, required: true },
  action:    { type: String, required: true },  // 'PAYROLL_RUN', 'LEAVE_APPROVED', etc.
  targetId:  { type: String },
  targetType:{ type: String },
  payload:   { type: Schema.Types.Mixed },
  ip:        { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
});
```

---

## 10. Folder Structure

```
hrms-app/                               # Turborepo root
├── apps/
│   ├── web/                            # Next.js 14 PWA
│   │   ├── app/
│   │   │   ├── (hrms)/                 # HRM route group
│   │   │   │   ├── dashboard/
│   │   │   │   ├── employees/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── attendance/
│   │   │   │   ├── leaves/
│   │   │   │   ├── payroll/
│   │   │   │   ├── recruitment/
│   │   │   │   └── performance/
│   │   │   ├── (chat)/                 # Chat route group
│   │   │   │   └── chat/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [channelId]/page.tsx
│   │   │   └── (auth)/
│   │   │       ├── login/page.tsx
│   │   │       └── callback/page.tsx
│   │   ├── components/
│   │   │   ├── hrm/                    # HRM-specific components
│   │   │   ├── chat/                   # Chat-specific components
│   │   │   └── ui/                     # shadcn/ui shared components
│   │   ├── hooks/
│   │   │   ├── useSocket.ts            # Socket.io connection
│   │   │   ├── usePresence.ts          # Supabase Realtime presence
│   │   │   ├── useNotifications.ts     # Supabase RT notification bell
│   │   │   └── usePushSubscription.ts  # Web Push registration
│   │   ├── lib/
│   │   │   ├── supabase.ts             # Supabase browser client
│   │   │   ├── supabase-server.ts      # Supabase server client (SSR)
│   │   │   ├── api.ts                  # API client (axios/fetch wrapper)
│   │   │   └── queryClient.ts          # TanStack Query config
│   │   └── public/
│   │       ├── manifest.json           # PWA manifest
│   │       ├── sw.js                   # Service Worker (push handler)
│   │       └── icons/                  # PWA icons (192, 512, maskable)
│   │
│   └── api/                            # Express.js API server
│       ├── src/
│       │   ├── modules/
│       │   │   ├── employees/
│       │   │   │   ├── employee.routes.ts
│       │   │   │   ├── employee.service.ts    # → Prisma
│       │   │   │   └── employee.schema.ts     # Zod schemas
│       │   │   ├── attendance/                # → Prisma + Redis
│       │   │   ├── leaves/                    # → Prisma + Mongo feed
│       │   │   ├── payroll/                   # → Prisma + Supabase Storage + BullMQ
│       │   │   ├── performance/               # → Prisma + Mongoose
│       │   │   ├── recruitment/               # → Prisma + Supabase Storage
│       │   │   ├── chat/
│       │   │   │   ├── chat.routes.ts
│       │   │   │   ├── chat.service.ts        # → Mongoose
│       │   │   │   └── chat.gateway.ts        # Socket.io namespace
│       │   │   ├── notifications/
│       │   │   │   ├── notification.service.ts
│       │   │   │   ├── push.worker.ts         # BullMQ web-push worker
│       │   │   │   └── email.worker.ts        # BullMQ email worker
│       │   │   └── auth/                      # → Supabase Admin SDK
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts          # Supabase JWT verify
│       │   │   ├── rbac.middleware.ts           # Role check
│       │   │   ├── validate.middleware.ts       # Zod validation
│       │   │   ├── rateLimit.middleware.ts      # Redis rate limiter
│       │   │   └── audit.middleware.ts          # Mongo audit log
│       │   ├── lib/
│       │   │   ├── prisma.ts                   # Prisma client singleton
│       │   │   ├── mongoose.ts                 # Mongoose connection
│       │   │   ├── supabase-admin.ts            # Supabase admin client
│       │   │   ├── redis.ts                    # ioredis client
│       │   │   └── bull.ts                     # BullMQ queues
│       │   └── index.ts                        # Express + Socket.io server
│       ├── models/                             # Mongoose schemas
│       │   ├── Message.ts
│       │   ├── Channel.ts
│       │   ├── Notification.ts
│       │   ├── PushSubscription.ts
│       │   └── AuditLog.ts
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
│
├── packages/
│   ├── types/                          # Shared TypeScript types (web + api)
│   │   └── src/index.ts
│   └── email-templates/                # React Email templates
│       ├── LeaveApprovalEmail.tsx
│       ├── PayslipReadyEmail.tsx
│       ├── WelcomeEmail.tsx
│       └── MentionDigestEmail.tsx
│
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 11. Full Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14 (App Router) | SSR + CSR hybrid, file-based routing, PWA shell |
| React | 18 | UI library |
| TypeScript | 5 | Type safety across the monorepo |
| Tailwind CSS | 3 | Utility-first styling |
| shadcn/ui | latest | Accessible UI components (Radix-based) |
| TanStack Query | 5 | Server state management, caching, background refetch |
| Zustand | 4 | Local UI state (modals, sidebar, etc.) |
| Socket.io-client | 4 | Real-time chat WebSocket connection |
| @supabase/supabase-js | 2 | Auth, Realtime, Storage client |
| next-pwa | latest | Service Worker, PWA manifest, offline |
| React Hook Form + Zod | latest | Form handling + validation |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Express.js | 5 | REST API server |
| TypeScript | 5 | Type safety |
| Socket.io | 4 | WebSocket server for chat |
| Prisma | 5 | PostgreSQL ORM — type-safe queries + migrations |
| Mongoose | 8 | MongoDB ODM — schema validation + indexes |
| @supabase/supabase-js | 2 | Supabase Admin SDK (auth, storage) |
| ioredis | 5 | Redis client |
| BullMQ | 5 | Job queue (backed by Redis) |
| web-push | 3 | VAPID Web Push API for cross-platform push |
| Zod | 3 | Schema validation (shared with frontend) |
| Helmet | 7 | HTTP security headers |
| express-rate-limit | 7 | API rate limiting |
| Winston | 3 | Structured logging |
| Morgan | 1 | HTTP access logging |
| Nodemailer | 6 | Email sending via SMTP |
| Puppeteer | latest | Payslip + offer letter PDF generation |

### Databases

| Database | Purpose | Client |
|---|---|---|
| PostgreSQL 16 | All HRM relational data | Prisma ORM |
| MongoDB Atlas | Chat, notifications, feeds, audit logs | Mongoose ODM |
| Supabase | Auth + Storage + Realtime | @supabase/supabase-js |
| Redis 7 | Cache, presence, queues | ioredis + BullMQ |

### Infrastructure

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Local dev containers (PG, Mongo, Redis) |
| Turborepo | Monorepo build orchestration |
| pnpm | Package manager with workspace support |
| Nginx | Reverse proxy + SSL termination |
| PM2 | Express process manager in production |
| Let's Encrypt | SSL certificate |

### Packages (shared)

| Package | Purpose |
|---|---|
| `packages/types` | Shared TypeScript interfaces (Employee, Message, etc.) |
| `packages/email-templates` | React Email templates shared between workers |

---

## 12. Security Architecture

### Authentication Flow

```
User submits credentials
      │
      ▼
Supabase Auth verifies → issues JWT + Refresh Token
      │
      ▼
JWT stored in httpOnly cookie (Next.js middleware)
      │
      ▼
Every API request: Supabase JWT middleware verifies token
      │
      ▼
req.user = { id, email, role } attached to all downstream handlers
      │
      ▼
RBAC middleware checks role permission for the specific route
      │
      ▼
Supabase RLS enforces data isolation at database level (second layer)
```

### Security Checklist

| Area | Measures |
|---|---|
| **Passwords** | Supabase handles bcrypt hashing; no raw passwords in our code |
| **JWT** | Short-lived access tokens (1hr) + refresh token rotation |
| **HTTPS** | Nginx enforces HTTPS; HSTS header set via Helmet |
| **CORS** | Whitelist of internal IPs only; no public origins |
| **SQL Injection** | Prisma parameterized queries — impossible by design |
| **NoSQL Injection** | Mongoose schema validation strips unexpected fields |
| **XSS** | React escapes output by default; Content-Security-Policy header |
| **File Uploads** | MIME type validation + size limits before Supabase upload |
| **Payslip Access** | Private Supabase bucket — signed URLs expire in 1 hour |
| **Audit Trail** | Every HR action (payroll run, leave approve, data edit) logged to MongoDB |
| **Rate Limiting** | Redis-backed limits: 100 req/min general, 20 req/min auth endpoints |
| **MFA** | Supabase built-in TOTP MFA for ADMIN and HR roles |

---

## 13. Deployment & Infrastructure

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api]

  api:
    build: ./apps/api
    ports: ["4000:4000"]
    depends_on: [postgres, mongo, redis]
    environment:
      DATABASE_URL: postgresql://hrms:secret@postgres:5432/hrms
      MONGODB_URI: mongodb://mongo:27017/hrms
      REDIS_URL: redis://redis:6379

  postgres:
    image: postgres:16-alpine
    volumes: [pg_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: hrms
      POSTGRES_USER: hrms
      POSTGRES_PASSWORD: secret

  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes: [redis_data:/data]

volumes:
  pg_data:
  mongo_data:
  redis_data:
```

### Production Architecture

```
Internet
    │
    ▼
Nginx (reverse proxy + SSL via Let's Encrypt)
    ├── / → Next.js (port 3000) — managed by PM2
    └── /api → Express.js (port 4000) — managed by PM2
         │
         ├── PostgreSQL (managed or self-hosted)
         ├── MongoDB Atlas (managed cloud)
         ├── Supabase (managed cloud)
         └── Redis (self-hosted or Redis Cloud)
```

### Supabase Storage Buckets

| Bucket | Access | Contents |
|---|---|---|
| `employee-docs` | Private (HR/Admin only) | ID proofs, contracts, certificates |
| `payslips` | Private (owner + HR) | Monthly payslip PDFs |
| `recruitment` | Private (HR/Admin) | CVs, resumes, offer letters |
| `chat-attachments` | Private (channel members) | Chat file uploads |
| `avatars` | Public (read) | Profile photos |

---

## 14. Build Roadmap

### Phase 1 — Foundation (Week 1–2)

- [ ] Turborepo + pnpm monorepo setup
- [ ] Docker Compose with PostgreSQL, MongoDB, Redis
- [ ] Supabase project — Auth + Storage buckets configured
- [ ] Prisma schema for all HRM tables + initial migration
- [ ] Mongoose models for Chat, Notifications, AuditLog
- [ ] Express.js boilerplate with Supabase JWT middleware
- [ ] Next.js App Router shell with Supabase Auth integration
- [ ] RBAC middleware + role definitions
- [ ] Shared `packages/types` with TypeScript interfaces

### Phase 2 — Core HRM (Week 3–6) ⭐ Priority

- [ ] Employee CRUD API + frontend (list, create, edit, view)
- [ ] Department & org chart management
- [ ] Attendance module: clock-in/out, timesheet view, monthly report
- [ ] Leave types management + leave request workflow
- [ ] Leave approval flow (manager → HR visibility)
- [ ] Leave balance tracking with ACID deduction
- [ ] Supabase RLS policies for all HRM data
- [ ] Redis caching for leave balances + org chart
- [ ] HR Analytics dashboard (headcount, attendance trends)

### Phase 3 — Advanced HRM + Notifications (Week 7–9)

- [ ] Payroll structure configuration (salary components)
- [ ] Monthly payroll run with lock mechanism
- [ ] Puppeteer payslip PDF → Supabase Storage → signed URL
- [ ] BullMQ queues: payroll batch + email worker
- [ ] React Email templates: payslip, leave approval, welcome
- [ ] Web Push VAPID setup + `web-push` npm package
- [ ] Service Worker: `push` event handler + `notificationclick`
- [ ] iOS PWA manifest + user-gesture permission flow
- [ ] MongoDB PushSubscription storage (multi-device)
- [ ] Recruitment ATS (job postings, pipeline, CVs)
- [ ] Performance review module
- [ ] PWA manifest + offline Service Worker

### Phase 4 — InHouse Chat (Week 10–12)

- [ ] Socket.io server setup + JWT handshake auth
- [ ] Redis presence TTL keys + heartbeat
- [ ] MongoDB Channel + Message models + indexes
- [ ] Channels: create, list, join, leave
- [ ] Real-time message send/receive via Socket.io
- [ ] DMs and group DMs
- [ ] File attachments → Supabase Storage → inline preview
- [ ] Reactions + threaded replies
- [ ] @mention parsing → notification trigger
- [ ] MongoDB Atlas Search index for message full-text search
- [ ] Supabase Realtime: typing indicators
- [ ] Push notifications for @mentions and DMs
- [ ] Chat UI integrated into HRM shell

---

## 15. Environment Variables

```bash
# apps/api/.env

# PostgreSQL
DATABASE_URL="postgresql://hrms:password@localhost:5432/hrms"

# MongoDB
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/hrms"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"   # server-side only

# Redis
REDIS_URL="redis://localhost:6379"

# Web Push (VAPID)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:admin@yourcompany.com"

# Email (SMTP)
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourcompany.com"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="HR System <noreply@yourcompany.com>"

# App
PORT="4000"
NODE_ENV="production"
FRONTEND_URL="https://hr.yourcompany.com"
JWT_SECRET="your-jwt-secret"   # for internal tokens if any

# apps/web/.env.local

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="https://hr.yourcompany.com/api"
NEXT_PUBLIC_SOCKET_URL="https://hr.yourcompany.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"   # needed for PushManager.subscribe()
```

> ⚠️ Never commit `.env` files. Use `.env.example` templates in the repo and inject secrets via your deployment platform (Railway, Render, VPS environment variables).

---

## Architecture Decision Log

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Frontend framework | Next.js 14 | Remix, Vite+React | App Router SSR + PWA support + ecosystem |
| API architecture | Monolith | Microservices | 20 users — monolith simplicity wins, no distributed overhead |
| HRM database | PostgreSQL | MySQL, SQLite | ACID, complex joins, JSON columns, recursive CTEs for org tree |
| Chat database | MongoDB | PostgreSQL JSONB | Native document model for message reactions/threads; Atlas Search |
| Auth | Supabase Auth | NextAuth, custom JWT | Zero-infra, RLS, MFA, invite emails built-in |
| File storage | Supabase Storage | MinIO, AWS S3 | Managed, CDN, signed URLs, integrates with Auth RLS |
| Real-time | Socket.io + Supabase RT | Pusher, Ably | Socket.io for chat (custom logic); Supabase RT for simpler status events |
| Push notifications | web-push (VAPID) | Firebase FCM | No Google dependency, works natively on all platforms including iOS 16.4+ |
| Job queue | BullMQ | Agenda, node-cron | Redis-backed, reliable, retries, delayed jobs for payroll |
| CSS | Tailwind + shadcn | CSS Modules, MUI | Utility-first speed + accessible headless components |

---

## 16. CSS & Tailwind Rules

> These rules are **mandatory** for every developer on the project. Consistency matters more than personal preference.

### 16.1 Core Principles

- **Tailwind utility classes are the only styling method.** No raw CSS files except `globals.css` for CSS variables and base resets.
- **No inline `style={{}}` props** unless a value is truly dynamic and cannot be expressed as a Tailwind class (e.g. a user-supplied hex color).
- **No CSS Modules.** No `.module.css` files. No `styled-components`. No `emotion`.
- **No `!important`** — ever. If you need `!important`, your specificity is wrong.
- **shadcn/ui is the component library.** Customize via `cn()` utility and Tailwind variants, never by overriding its internal CSS.

---

### 16.2 Class Ordering Convention

Always write Tailwind classes in this order (enforced by Prettier + `prettier-plugin-tailwindcss`):

```
1. Layout        → flex, grid, block, hidden, overflow
2. Position      → relative, absolute, fixed, sticky, inset, top, z
3. Box Model     → w, h, min-w, max-w, p, m, border, rounded
4. Typography    → font, text, leading, tracking, truncate
5. Visual        → bg, text (color), shadow, opacity, ring
6. Transitions   → transition, duration, ease, animate
7. Responsive    → sm:, md:, lg:, xl: prefixes last
8. State         → hover:, focus:, active:, disabled:, dark: last
```

**Example — correct ordering:**
```tsx
// ✅ Correct
<button className="flex items-center gap-2 relative w-full px-4 py-2 rounded-md text-sm font-medium bg-primary text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">

// ❌ Wrong — random order
<button className="hover:bg-primary/90 text-white px-4 flex bg-primary rounded-md disabled:opacity-50 py-2 text-sm">
```

Install `prettier-plugin-tailwindcss` to auto-sort:
```bash
pnpm add -D prettier-plugin-tailwindcss
```

---

### 16.3 Design Tokens — CSS Variables in `globals.css`

All colors, radii, spacing, and shadows must be defined as CSS variables and referenced as Tailwind tokens. **Never hardcode hex values in className strings.**

```css
/* apps/web/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --background:       0 0% 100%;
    --foreground:       222 47% 11%;
    --primary:          221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary:        210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted:            210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent:           210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive:      0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border:           214 32% 91%;
    --input:            214 32% 91%;
    --ring:             221 83% 53%;
    --radius:           0.5rem;

    /* App-specific tokens */
    --sidebar-width:    260px;
    --header-height:    64px;
    --chat-sidebar:     280px;
  }

  .dark {
    --background:       222 47% 11%;
    --foreground:       210 40% 98%;
    --primary:          217 91% 60%;
    /* ... dark variants */
  }
}
```

```js
// tailwind.config.js — wire up CSS variables as Tailwind tokens
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        border: 'hsl(var(--border))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    }
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

### 16.4 Component Variants with `cva`

Use `class-variance-authority` (cva) for components with multiple visual variants. Never duplicate class strings with ternaries.

```tsx
// ✅ Correct — use cva for variants
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground',
        secondary:   'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline:     'border border-input bg-background text-foreground',
        success:     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ❌ Wrong — ternary soup
<div className={`inline-flex rounded-full px-2.5 ${variant === 'success' ? 'bg-green-100 text-green-800' : variant === 'destructive' ? 'bg-red-100 text-red-800' : 'bg-primary text-white'}`} />
```

---

### 16.5 Responsive Design Rules

- **Mobile-first always.** Write base classes for mobile, add `sm:`, `md:`, `lg:` for larger screens.
- **Breakpoint usage:**
  - `sm` (640px) — small tablets, large phones landscape
  - `md` (768px) — tablets
  - `lg` (1024px) — laptops, default desktop layout
  - `xl` (1280px) — wide screens
- **Test on 375px, 768px, 1280px** — the three key breakpoints for this app.
- The HRMS sidebar collapses to a drawer on `< lg`. Chat panel collapses on `< md`.

```tsx
// ✅ Mobile-first responsive layout
<div className="flex flex-col lg:flex-row gap-4">
  <aside className="w-full lg:w-64 shrink-0">...</aside>
  <main className="flex-1 min-w-0">...</main>
</div>
```

---

### 16.6 Dark Mode

- Use `dark:` variant for all color-bearing classes.
- **Never hardcode light-only colors.** Every `bg-`, `text-`, `border-` class must have a `dark:` counterpart, or use a CSS variable token that handles both.
- Dark mode is toggled via `class` strategy (set `dark` class on `<html>`):

```js
// tailwind.config.js
module.exports = { darkMode: 'class', ... }
```

---

### 16.7 What's Forbidden

| Forbidden | Use Instead |
|---|---|
| `style={{ color: '#336791' }}` | `className="text-primary"` (or define token) |
| Arbitrary values `w-[347px]` | Use spacing scale; define token if truly needed |
| Excessive arbitrary values | If you use `[]` more than twice for same value → define a token |
| `@apply` in component files | Use `cn()` + `cva()` instead |
| `@apply` for anything except base resets in `globals.css` | Avoid — kills Tailwind's purpose |
| `z-[9999]` | Use defined z-index scale: `z-10`, `z-20`, `z-30`, `z-50` |
| Hardcoded breakpoints `min-w-[768px]` | Use `md:` prefix |

---

## 17. Folder Structure Conventions

> These conventions are enforced via ESLint import rules and PR review. No exceptions without team discussion.

### 17.1 Naming Rules

| Type | Convention | Example |
|---|---|---|
| Folders | `kebab-case` | `leave-management/`, `chat-gateway/` |
| React components | `PascalCase.tsx` | `EmployeeCard.tsx`, `LeaveRequestModal.tsx` |
| Hooks | `camelCase` prefixed with `use` | `useLeaveBalance.ts`, `useSocketChat.ts` |
| Utilities / helpers | `camelCase.ts` | `formatCurrency.ts`, `parseDate.ts` |
| Constants | `SCREAMING_SNAKE_CASE` in `constants.ts` | `MAX_FILE_SIZE_MB`, `LEAVE_TYPES` |
| Types / interfaces | `PascalCase` | `type Employee`, `interface LeaveRequest` |
| Zod schemas | `camelCase` + `Schema` suffix | `employeeSchema`, `leaveRequestSchema` |
| API route files | `kebab-case.routes.ts` | `employee.routes.ts` |
| Service files | `kebab-case.service.ts` | `payroll.service.ts` |
| Test files | same name + `.test.ts` | `payroll.service.test.ts` |
| Environment files | `.env`, `.env.local`, `.env.example` | Never `.env.prod` committed |

---

### 17.2 Component File Structure

Every non-trivial component lives in its own folder:

```
components/hrm/EmployeeCard/
├── EmployeeCard.tsx          # Main component
├── EmployeeCard.test.tsx     # Unit tests
└── index.ts                  # Re-export: export { EmployeeCard } from './EmployeeCard'
```

**Single-file components** (simple, < 80 lines) can live flat:
```
components/ui/
├── Badge.tsx
├── Spinner.tsx
└── Avatar.tsx
```

---

### 17.3 Import Order Convention

Enforced by ESLint `import/order` plugin:

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 3. Internal packages (monorepo)
import type { Employee } from '@hrms/types';

// 4. Absolute imports (configured aliases)
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

// 5. Relative imports
import { EmployeeAvatar } from './EmployeeAvatar';

// 6. Types (last)
import type { EmployeeCardProps } from './types';
```

Configure path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@hrms/types": ["../../packages/types/src"]
    }
  }
}
```

---

### 17.4 Module Boundary Rules

> **Modules never import from sibling modules.** They communicate via:
> 1. The shared `packages/types` package for type definitions
> 2. Events emitted to the Notification Service
> 3. Shared utilities in `lib/`

```typescript
// ✅ Correct — import from lib or types
import { prisma } from '@/lib/prisma';
import type { Employee } from '@hrms/types';

// ❌ Wrong — leave module importing from payroll module
import { calculateDeduction } from '../payroll/payroll.service';

// ✅ Correct — if payroll needs leave data, query DB directly
const leaveBalance = await prisma.leaveBalance.findFirst({ where: { employeeId } });
```

---

### 17.5 Page Component Rules (Next.js App Router)

```
app/(hrms)/leaves/
├── page.tsx              # Server Component — data fetching, layout
├── loading.tsx           # Skeleton loader (shown during navigation)
├── error.tsx             # Error boundary for this route
└── _components/          # Components private to this page (prefixed with _)
    ├── LeaveTable.tsx
    ├── LeaveRequestForm.tsx
    └── LeaveBalanceCard.tsx
```

- `page.tsx` must be a **Server Component** by default. Add `'use client'` only when you need interactivity.
- Client components go in `_components/` — only Client Components have `'use client'` directive.
- Data fetching belongs in Server Components or `useQuery` hooks — never in `useEffect`.

---

## 18. Code Conventions

### 18.1 TypeScript Rules

- **`strict: true` always.** No `any`. Use `unknown` if the type is genuinely unknown, then narrow it.
- **No type assertions (`as SomeType`)** unless you're at a system boundary (e.g. Mongoose document typing). Add a comment explaining why.
- **Prefer `type` over `interface`** for data shapes. Use `interface` only when you need declaration merging or `extends`.
- **All function parameters and return types must be explicitly typed** — no implicit `any` from missing types.
- **Zod schemas generate TypeScript types** — don't duplicate:

```typescript
// ✅ Single source of truth
import { z } from 'zod';

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  fromDate:    z.string().datetime(),
  toDate:      z.string().datetime(),
  reason:      z.string().max(500).optional(),
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
// Do NOT separately define: interface LeaveRequestInput { ... }
```

---

### 18.2 React Component Rules

```tsx
// ✅ Correct component structure
import { cn } from '@/lib/utils';
import type { Employee } from '@hrms/types';

// 1. Props type — always explicit
interface EmployeeCardProps {
  employee: Employee;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

// 2. Component — arrow function, named export (not default)
export function EmployeeCard({
  employee,
  isSelected = false,
  onSelect,
  className,
}: EmployeeCardProps) {
  // 3. Hooks at top
  const [isExpanded, setIsExpanded] = useState(false);

  // 4. Derived values
  const initials = employee.fullName.split(' ').map(n => n[0]).join('');

  // 5. Event handlers — named, not inline
  const handleClick = () => onSelect(employee.id);

  // 6. Early returns for loading/error states
  if (!employee) return null;

  // 7. JSX
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
        'transition-colors hover:bg-muted',
        isSelected && 'border-primary bg-primary/5',
        className
      )}
      onClick={handleClick}
    >
      ...
    </div>
  );
}

// ❌ Wrong patterns
export default function EmployeeCard(props: any) { ... }  // no any, no default export for components
const EmployeeCard = (props) => { ... }                   // untyped props
```

**Rules:**
- Named exports only for components. `default export` only for Next.js page/layout files (required by framework).
- One component per file. No multi-component files.
- No anonymous arrow functions in JSX props for non-trivial handlers — extract to named handler.
- Keep components under **150 lines**. If longer, split into sub-components.

---

### 18.3 API Route & Service Rules

```typescript
// ✅ Correct Express route structure
// modules/leaves/leave.routes.ts

import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { leaveRequestSchema } from './leave.schema';
import { LeaveService } from './leave.service';

const router = Router();
const leaveService = new LeaveService();

// Always: authenticate → rbac → validate → handler
router.post(
  '/',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(leaveRequestSchema),
  async (req, res, next) => {
    try {
      const leave = await leaveService.createLeaveRequest(req.user.id, req.body);
      res.status(201).json({ success: true, data: leave });
    } catch (error) {
      next(error); // Always forward to error middleware — never res.status(500) inline
    }
  }
);

export { router as leaveRouter };
```

```typescript
// ✅ Correct Service structure
// modules/leaves/leave.service.ts

export class LeaveService {
  // Constructor injection for testability
  constructor(
    private prisma = prismaClient,
    private redis = redisClient
  ) {}

  async createLeaveRequest(employeeId: string, input: LeaveRequestInput) {
    // Use transactions for multi-step operations
    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findFirstOrThrow({
        where: { employeeId, leaveTypeId: input.leaveTypeId }
      });

      if (balance.remaining < input.days) {
        throw new AppError('INSUFFICIENT_LEAVE_BALANCE', 400);
      }

      const request = await tx.leaveRequest.create({ data: { employeeId, ...input } });

      // Invalidate Redis cache
      await this.redis.del(`leave:balance:${employeeId}`);

      return request;
    });
  }
}
```

---

### 18.4 Error Handling Convention

**Custom error class — use everywhere:**
```typescript
// lib/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,      // Machine-readable: 'INSUFFICIENT_LEAVE_BALANCE'
    public statusCode: number, // HTTP status
    message?: string           // Human-readable (optional, defaults to code)
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}
```

**Global error middleware — one place handles all:**
```typescript
// middleware/error.middleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message }
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ENTRY', message: 'Record already exists' }
      });
    }
  }

  // Unknown errors — log and return generic message
  logger.error({ err, url: req.url, method: req.method });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}
```

---

### 18.5 API Response Shape

**Always use this consistent shape. Never deviate.**

```typescript
// Success
{ "success": true,  "data": { ... } }
{ "success": true,  "data": [ ... ], "meta": { "total": 100, "page": 1, "limit": 20 } }

// Error
{ "success": false, "error": { "code": "LEAVE_NOT_FOUND", "message": "Leave request not found" } }
```

---

### 18.6 Git & Commit Convention

**Branch naming:**
```
feat/leave-approval-workflow
fix/payroll-rounding-bug
chore/update-prisma-schema
refactor/attendance-service
docs/update-readme
```

**Commit messages (Conventional Commits):**
```
feat(leaves): add leave cancellation by employee
fix(payroll): correct overtime calculation for partial months
chore(deps): update prisma to 5.8.0
refactor(chat): extract message parsing to utility function
test(attendance): add unit tests for overtime service
docs(arch): add notification platform breakdown
```

**PR rules:**
- One concern per PR. No "misc fixes + new feature" combined.
- All PRs require: passing lint + type-check + tests.
- No direct commits to `main`. Branch → PR → squash merge.

---

### 18.7 Comment Rules

```typescript
// ✅ Comment WHY, not WHAT — the code shows what
// Must recalculate total after Redis cache invalidation because
// concurrent payroll runs can update allowances between reads
const total = await this.recalculateTotals(employeeId);

// ❌ Wrong — explaining what the code obviously does
// Loop through employees
for (const employee of employees) { ... }

// ✅ Use JSDoc for all exported functions and types
/**
 * Calculates net pay after all deductions.
 * Throws AppError if payroll is already locked for the month.
 */
export async function calculateNetPay(employeeId: string, month: Date): Promise<NetPay>

// TODO format — must include owner and ticket
// TODO(@yourname): Replace with Atlas Search once index is built — HRMS-142
```

---

## 19. Security Practices

> These are non-negotiable rules. Security issues in HR systems expose salary data, personal information, and authentication credentials.

### 19.1 Authentication & Session Rules

```typescript
// ✅ Always verify JWT server-side on every protected request
// middleware/auth.middleware.ts
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies['sb-access-token']
    ?? req.headers.authorization?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: { code: 'INVALID_TOKEN' } });

  req.user = { id: user.id, email: user.email!, role: user.user_metadata.role };
  next();
}

// ❌ Never trust client-sent role claims
// req.user.role = req.body.role   ← NEVER DO THIS
```

**Rules:**
- JWTs are validated against **Supabase's public key** on every request — never decoded without verification.
- Role is stored in **Supabase `user_metadata`** (set server-side by HR Admin only) — never in a request body or query param.
- `httpOnly: true` on auth cookies — JavaScript cannot read them (XSS protection).
- `secure: true` in production — cookies only sent over HTTPS.
- `sameSite: 'lax'` — CSRF protection.

---

### 19.2 Authorization — Row Level Security (Supabase RLS)

Every table in Supabase must have RLS enabled. Never query without a policy:

```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- EMPLOYEE: can only see own record
CREATE POLICY "employee_own_record" ON employees
  FOR SELECT USING (auth.uid() = id);

-- MANAGER: can see their direct reports
CREATE POLICY "manager_sees_reports" ON employees
  FOR SELECT USING (
    manager_id = auth.uid()
    OR auth.uid() IN (
      SELECT id FROM employees WHERE role = 'ADMIN' OR role = 'HR'
    )
  );

-- Payslips — only HR and the owner
CREATE POLICY "payslip_access" ON payroll_runs
  FOR SELECT USING (
    employee_id = auth.uid()
    OR auth.jwt()->>'role' IN ('HR', 'ADMIN')
  );
```

---

### 19.3 Input Validation Rules

```typescript
// ✅ Validate EVERY external input with Zod — no exceptions
// Never trust: req.body, req.params, req.query, req.headers (custom ones)

export const employeeCreateSchema = z.object({
  fullName:     z.string().min(2).max(100).trim(),
  email:        z.string().email().toLowerCase(),
  departmentId: z.string().uuid(),
  joiningDate:  z.string().datetime({ offset: true }),
  salary:       z.number().positive().max(10_000_000), // reasonable upper bound
});

// ❌ Never use data directly from req.body
const employee = await prisma.employee.create({ data: req.body }); // DANGEROUS
```

**Sanitization rules:**
- Trim all string inputs.
- Lowercase emails always.
- `salary`, `days`, `hours` must be positive numbers with upper bounds.
- UUIDs must pass `z.string().uuid()` — prevents path traversal in URL params.
- File uploads: validate MIME type **server-side** (not just extension) using `file-type` npm package.

---

### 19.4 File Upload Security

```typescript
import { fileTypeFromBuffer } from 'file-type'; // detects real MIME from bytes

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function validateUpload(buffer: Buffer, originalName: string) {
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new AppError('FILE_TOO_LARGE', 400, 'Max file size is 10MB');
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
    throw new AppError('INVALID_FILE_TYPE', 400, 'File type not allowed');
  }

  // Sanitize filename — no path traversal
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return { buffer, mimeType: detected.mime, safeName };
}
```

---

### 19.5 Secrets Management Rules

- **Zero secrets in code.** Not even in comments. Not even "test" credentials.
- `.env` files are **gitignored** — only `.env.example` (with placeholder values) is committed.
- **VAPID private key, Supabase service role key, DB passwords** — never in frontend `.env.local` (they get bundled). Only `NEXT_PUBLIC_` variables are safe for frontend.
- Rotate secrets immediately if accidentally committed — don't just delete the commit.
- Use a **secrets scanner** in CI (free: `gitleaks` or GitHub's built-in secret scanning).

```bash
# .env.example — committed to repo (no real values)
DATABASE_URL="postgresql://user:password@localhost:5432/hrms"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
VAPID_PRIVATE_KEY="your-vapid-private-key-here"
```

---

### 19.6 Rate Limiting Rules

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API — 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redis }),
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

// Auth endpoints — 5 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new RedisStore({ client: redis }),
  skipSuccessfulRequests: true, // only count failed attempts
});

// File uploads — 20 per hour per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id ?? req.ip, // per user, not per IP
  store: new RedisStore({ client: redis }),
});
```

---

### 19.7 MongoDB Injection Prevention

```typescript
// ✅ Mongoose schemas reject unexpected fields — injection-safe by default
// But explicitly sanitize any dynamic query input:

import { isValidObjectId } from 'mongoose';

// Always validate ObjectId params
export async function getMessage(id: string) {
  if (!isValidObjectId(id)) {
    throw new AppError('INVALID_ID', 400);
  }
  return Message.findById(id);
}

// Never interpolate user input into query operators
// ❌ Wrong
await Message.find({ content: req.query.search }); // could be { $gt: '' }

// ✅ Correct — use $text search or explicit string type
await Message.find({ $text: { $search: String(req.query.search) } });
```

---

### 19.8 Audit Logging — What Must Be Logged

Every HR action that touches sensitive data must be logged to MongoDB `audit_logs`:

```typescript
// These actions MUST be logged:
const AUDITABLE_ACTIONS = [
  'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_TERMINATED',
  'PAYROLL_RUN_CREATED', 'PAYROLL_RUN_LOCKED',
  'LEAVE_APPROVED', 'LEAVE_REJECTED',
  'SALARY_UPDATED',
  'ROLE_CHANGED',
  'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED',
  'LOGIN_SUCCESS', 'LOGIN_FAILED',
  'PASSWORD_RESET',
  'BULK_EXPORT',     // HR exports employee data
];
```

---

## 20. Performance Optimization

> All optimizations use **free, open-source tools only**.

### 20.1 Next.js Frontend Performance

**Image optimization:**
```tsx
// ✅ Always use next/image — automatic WebP, lazy loading, sizing
import Image from 'next/image';

<Image
  src={employee.avatarUrl}
  alt={employee.fullName}
  width={40}
  height={40}
  className="rounded-full"
  loading="lazy"       // default for below-fold
  priority={false}     // set true only for above-fold hero images
/>

// ❌ Never use raw <img> for app images
<img src={employee.avatarUrl} />
```

**Code splitting rules:**
```tsx
// ✅ Lazy-load heavy components — charts, modals, rich text editors
import dynamic from 'next/dynamic';

const PayrollChart     = dynamic(() => import('@/components/hrm/PayrollChart'), { ssr: false });
const LeaveCalendar    = dynamic(() => import('@/components/hrm/LeaveCalendar'), { ssr: false });
const RichTextEditor   = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });
const PdfViewer        = dynamic(() => import('@/components/ui/PdfViewer'),      { ssr: false });
```

**Server Components — default to server, opt into client only when needed:**
```tsx
// ✅ Default — Server Component (no 'use client')
// Fetches data on server, no JS bundle cost
export default async function LeavePage() {
  const leaves = await getLeaveRequests(); // server-side fetch
  return <LeaveTable leaves={leaves} />;
}

// Only add 'use client' for components that need:
// - useState, useEffect, useRef
// - Event listeners (onClick, onChange)
// - Browser APIs (localStorage, navigator)
// - Socket.io or Supabase Realtime subscriptions
```

---

### 20.2 Data Fetching & Caching Strategy

```typescript
// TanStack Query — stale times per data type
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 min default
      gcTime:    10 * 60 * 1000,     // 10 min in cache
      retry: 1,
      refetchOnWindowFocus: false,   // HRM data doesn't need aggressive refetch
    }
  }
});

// Per-query stale times
useQuery({
  queryKey: ['employees'],
  queryFn: fetchEmployees,
  staleTime: 10 * 60 * 1000,   // employees list — 10 min (changes rarely)
});

useQuery({
  queryKey: ['attendance', 'today'],
  queryFn: fetchTodayAttendance,
  staleTime: 30 * 1000,          // today's attendance — 30 sec (changes often)
  refetchInterval: 60 * 1000,    // auto-refresh every minute
});

useQuery({
  queryKey: ['leave-balance', employeeId],
  queryFn: () => fetchLeaveBalance(employeeId),
  staleTime: 5 * 60 * 1000,    // leave balance — 5 min
});
```

**Redis cache on API side:**
```typescript
// Cache pattern: check Redis → miss → query DB → store in Redis
export async function getLeaveBalance(employeeId: string) {
  const cacheKey = `leave:balance:${employeeId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const balance = await prisma.leaveBalance.findMany({
    where: { employeeId }
  });

  await redis.setex(cacheKey, 300, JSON.stringify(balance)); // 5 min TTL
  return balance;
}

// Always invalidate on mutation
async function approveLeave(leaveId: string) {
  // ... update DB
  await redis.del(`leave:balance:${employeeId}`);  // bust cache
}
```

---

### 20.3 PostgreSQL Query Optimization

```typescript
// ✅ Always select only needed fields — never SELECT *
const employees = await prisma.employee.findMany({
  select: {
    id: true,
    fullName: true,
    email: true,
    designation: true,
    department: { select: { name: true } },
  },
  // ❌ Avoid: findMany() with no select — fetches all columns including large fields
});

// ✅ Use pagination — never return unbounded lists
const employees = await prisma.employee.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { fullName: 'asc' },
});

// ✅ Indexes — add to schema for all filtered/sorted columns
model Attendance {
  // ...
  @@index([employeeId, date])    // most common query pattern
  @@index([date])                // for HR daily views
}

model LeaveRequest {
  // ...
  @@index([employeeId, status])  // employee's pending leaves
  @@index([approvedById])        // manager's queue
}
```

---

### 20.4 MongoDB Query Optimization

```typescript
// ✅ Always add indexes for query patterns — defined in Mongoose schema
MessageSchema.index({ channelId: 1, createdAt: -1 }); // channel history (most common)
MessageSchema.index({ senderId: 1, createdAt: -1 });   // user's messages
MessageSchema.index({ mentions: 1 });                   // mention lookup
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // unread inbox

// ✅ Cursor-based pagination for chat history (not offset)
export async function getMessages(channelId: string, before?: string, limit = 30) {
  const query: FilterQuery<IMessage> = { channelId, deletedAt: null };

  if (before) {
    query._id = { $lt: new Types.ObjectId(before) }; // cursor: messages before this ID
  }

  return Message.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .select('senderId content attachments reactions createdAt editedAt parentId')
    .lean();  // .lean() returns plain objects — 2-3x faster than full Mongoose documents
}

// ✅ Use .lean() for read-only queries — skip Mongoose document overhead
const logs = await AuditLog.find({ actorId }).sort({ createdAt: -1 }).limit(50).lean();
```

---

### 20.5 Bundle Size Rules

Run `next build` and check the bundle analyzer output regularly:

```bash
# Free bundle analyzer
pnpm add -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({ /* your config */ });

# Run analysis
ANALYZE=true pnpm build
```

**Bundle size targets:**
- First load JS for any route: **< 150KB** gzipped
- Shared chunks (layout, common): **< 80KB** gzipped
- Individual page chunks: **< 50KB** gzipped

**Common culprits and fixes:**

| Problem | Fix |
|---|---|
| `import _ from 'lodash'` | `import debounce from 'lodash/debounce'` — named imports only |
| `import * as icons from 'lucide-react'` | `import { Search, Plus } from 'lucide-react'` — tree-shaken |
| `import { format } from 'date-fns'` | Already tree-shaken ✅ |
| Chart library loaded on all pages | `dynamic(() => import('recharts'), { ssr: false })` |
| PDF viewer on all pages | `dynamic(() => import('@/components/PdfViewer'), { ssr: false })` |
| Socket.io client on server bundle | Only import in `'use client'` components |

---

### 20.6 API Performance Rules

```typescript
// ✅ Use Promise.all for independent async operations — don't await sequentially
// ❌ Wrong — sequential (slow)
const employee   = await getEmployee(id);
const attendance = await getAttendance(id);
const leaves     = await getLeaveBalance(id);

// ✅ Correct — parallel (fast)
const [employee, attendance, leaves] = await Promise.all([
  getEmployee(id),
  getAttendance(id),
  getLeaveBalance(id),
]);

// ✅ Compress API responses
import compression from 'compression';
app.use(compression()); // gzip all responses > 1KB automatically

// ✅ Use HTTP keep-alive (default in Node 18+, verify it's not disabled)

// ✅ Paginate everything — no endpoint returns more than 100 records
// ✅ Add response time logging to catch slow queries
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 500) logger.warn({ msg: 'Slow request', url: req.url, ms });
  });
  next();
});
```

---

### 20.7 Service Worker & PWA Performance

```javascript
// public/sw.js — Workbox caching strategy per asset type
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Static assets (fonts, icons) — CacheFirst, long TTL
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 })]
  })
);

// API responses — NetworkFirst (fresh data preferred, fallback to cache)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 5 })]
  })
);

// Next.js pages — StaleWhileRevalidate (instant load + background refresh)
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'pages' })
);
```

---

### 20.8 WebSocket Performance (Chat)

```typescript
// ✅ Namespace isolation — HRM and Chat on separate namespaces
const chatNS = io.of('/chat');      // only chat users connect here
const hrmsNS = io.of('/hrms');      // for HRM real-time (future use)

// ✅ Room-based broadcasting — never broadcast to all connected sockets
chatNS.to(channelId).emit('message:new', message);  // only channel members
// ❌ chatNS.emit('message:new', ...) — sends to ALL 20 users

// ✅ Throttle typing indicators — don't emit on every keystroke
// Client-side throttle
const emitTyping = useCallback(
  throttle(() => socket.emit('typing:start', { channelId }), 2000),
  [channelId]
);

// ✅ Debounce typing stop
const stopTyping = useCallback(
  debounce(() => socket.emit('typing:stop', { channelId }), 3000),
  [channelId]
);

// ✅ Compress Socket.io payloads
const io = new Server(server, {
  perMessageDeflate: true,    // compress WebSocket messages
  httpCompression: true,
});
```

---

## 21. Free Tools Only — Approved Toolchain

> The entire development, testing, and deployment stack uses **zero paid tools**. Every item below is free and open-source or has a free tier sufficient for a 20-person internal app.

### Development

| Tool | Free Tier / License | Purpose |
|---|---|---|
| VS Code | Free (MIT) | Code editor |
| ESLint | Free (MIT) | JavaScript/TypeScript linting |
| Prettier | Free (MIT) | Code formatting |
| `prettier-plugin-tailwindcss` | Free (MIT) | Tailwind class auto-sorting |
| TypeScript | Free (Apache 2.0) | Type checking |
| Vitest | Free (MIT) | Unit + integration tests |
| Playwright | Free (Apache 2.0) | E2E testing |
| Docker Desktop | Free for personal/small teams | Local containerization |
| TablePlus | Free tier (limited tabs) | DB GUI — or use free DBeaver |
| DBeaver | Free (Apache 2.0) | Full-featured DB GUI (PostgreSQL + MongoDB) |
| MongoDB Compass | Free (SSPL) | MongoDB GUI |
| Redis Insight | Free | Redis GUI |

### Database (Free Tiers)

| Service | Free Tier |
|---|---|
| **Supabase** | Free tier: 500MB DB, 1GB storage, 50MB file uploads, 2GB bandwidth, Auth included |
| **MongoDB Atlas** | Free tier (M0): 512MB storage, shared cluster, Atlas Search included |
| **PostgreSQL** | Self-hosted via Docker — fully free |
| **Redis** | Self-hosted via Docker — fully free |

> For production with 20 users: Supabase free tier is sufficient. MongoDB Atlas M0 free tier is sufficient for chat at 20 users. PostgreSQL and Redis self-hosted on your VPS.

### CI/CD & Deployment (Free)

| Tool | Free Tier | Purpose |
|---|---|---|
| **GitHub Actions** | 2,000 min/month free | CI pipeline: lint → typecheck → test → build |
| **Railway** | $5/month credit (often enough) or self-host | App deployment |
| **Render** | Free tier (with sleep) or paid $7/mo | Alternative deployment |
| **VPS (Hetzner/DigitalOcean)** | ~$5-6/month | Self-host everything — best for production |
| **Nginx** | Free (BSD) | Reverse proxy + SSL |
| **Let's Encrypt + Certbot** | Free | SSL certificates |
| **PM2** | Free (AGPL) | Node.js process manager |

### Monitoring & Observability (Free)

| Tool | Free Tier | Purpose |
|---|---|---|
| **Uptime Kuma** | Free (self-hosted) | Uptime monitoring + alerts |
| **Grafana + Prometheus** | Free (self-hosted) | Metrics dashboards |
| **Winston** | Free (MIT) | Structured application logging |
| **Morgan** | Free (MIT) | HTTP access logging |
| **Sentry** | Free tier: 5K errors/month | Error tracking |
| **Betterstack Logtail** | Free tier: 1GB/month | Log aggregation |

### Testing

| Tool | Free | Purpose |
|---|---|---|
| **Vitest** | Free | Unit tests (fast, Jest-compatible) |
| **Supertest** | Free | Express API integration tests |
| **Playwright** | Free | E2E browser tests |
| **MSW (Mock Service Worker)** | Free | API mocking in tests |
| `@faker-js/faker` | Free | Realistic test data generation |
| **Prisma seed** | Free (built-in) | DB seed data for tests |

### Recommended `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: 8 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Format check
        run: pnpm format:check

      - name: Unit tests
        run: pnpm test --run
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/hrms_test
          MONGODB_URI:  mongodb://localhost:27017/hrms_test
          REDIS_URL:    redis://localhost:6379

    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: test, POSTGRES_PASSWORD: test, POSTGRES_DB: hrms_test }
        ports: ['5432:5432']
      mongo:
        image: mongo:7
        ports: ['27017:27017']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']

  build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

### Secret Scanning (Free)

```bash
# Install gitleaks — prevents secrets from being committed
brew install gitleaks  # macOS
# or download binary from github.com/gitleaks/gitleaks

# Add as pre-commit hook
# .gitleaks.toml (project root)
[extend]
useDefault = true

# Run manually
gitleaks detect --source . --verbose
```

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
gitleaks protect --staged -v
pnpm lint-staged
```

---

*HRMS + InHouse Chat · Principal Architecture v4 · Poly-Database · Cross-Platform Notifications*
*Next.js 14 + Express.js Monolith · PostgreSQL + MongoDB + Supabase + Redis · Free Toolchain*
