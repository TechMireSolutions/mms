# MMS — Madrasa Management System

<div align="center">

![MMS Banner](https://raw.githubusercontent.com/TechMireSolutions/mms/main/docs/assets/banner.png)

**Enterprise-Grade, Multi-Tenant Educational ERP & Madrasa Management Platform**

[![Node.js](https://img.shields.io/badge/node-%3E%3D24.14.0-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.15.1-F69220?style=flat-square&logo=pnpm)](https://pnpm.io)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify)](https://fastify.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Module Ecosystem](#-module-ecosystem)
- [Core Architectural Invariants](#-core-architectural-invariants)
- [Monorepo Structure](#-monorepo-structure)
- [System Requirements](#-system-requirements)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Database & Migrations](#-database--migrations)
- [Security & Tenant Isolation](#-security--tenant-isolation)
- [Internationalization (i18n) & RTL](#-internationalization-i18n--rtl)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Deployment & Ops](#-production-deployment--ops)
- [Agent & Developer Standards](#-agent--developer-standards)
- [License](#-license)

---

## 🌟 Overview

**MMS (Madrasa Management System)** is a mission-critical, enterprise-grade educational ERP tailored for madrasas, Islamic academies, and modern educational institutions. Built as a high-performance monorepo, MMS unifies academic tracking, financial accounting, dynamic evaluations, communication campaigns, and tenant governance into a cohesive, secure platform.

### Key Capabilities

- 🏢 **Strict Multi-Tenancy**: Engine-enforced Row-Level Security (RLS) via PostgreSQL policies guarantees total data isolation between institutions.
- 📐 **Universal Three-Tier Module Design**: Every domain module provides consistent **Work** (directory, command centre, detail drawer, trash), **Reports** (aggregates, KPI charts, PDF/Excel exports), and **Setup** (field builder, tab preferences, defaults) workflows.
- 👥 **Canonical Contacts Engine**: Unified contact repository linking students, guardians, faculty, and administrative users with zero duplicate profiles.
- ⚖️ **Double-Entry Financial Accounting**: Full-fledged general ledger, chart of accounts, customizable fee structures, invoices, and payment tracking.
- 💬 **Omnichannel Messaging**: Automated WhatsApp and SMS campaigns with dynamic template variable tokenization, fallback delivery, and live logs.
- 🌍 **Quad-Language Internationalization (i18n)**: Native Bidirectional (BiDi) UI with full RTL/LTR support for **English**, **Arabic (العربية)**, **Urdu (اردو)**, and **Persian/Farsi (فارسی)**.
- 🔒 **Zero-Trust Validation & Encrypted Backups**: Strict Zod write DTOs, HTTP-only cookie authentication, and client-side encrypted workspace backup/restore pipelines.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Client (React 19 SPA / Vite 8 / Tailwind v4)"] --> |HTTP / WebSocket (Cookie Auth)| Gateway["Fastify 5 API Gateway (:3000 Dev / :5002 Prod)"]
    Gateway --> Middleware["Tenant / Platform Auth & RLS Context"]
    Middleware --> |SET LOCAL app.current_tenant| Drizzle["Drizzle ORM (PostgreSQL 16 3NF/BCNF)"]
    Gateway --> Worker["Background Task & Queue Worker (Redis / BullMQ)"]
    Gateway --> WS["Real-time WebSocket Hub (/api/ws)"]
    Shared["@mms/shared (Zod SSOT, Write DTOs, i18n Packs, Types)"] -.-> Client
    Shared -.-> Gateway
```

| Layer | Technologies & Libraries | Architectural Highlights |
|---|---|---|
| **Frontend Application** | React 19, Vite 8, TypeScript, Tailwind CSS v4, Radix UI Primitives, TanStack Query v5, Framer Motion, Recharts, Lucide Icons | Three-tier module layout, cookie-based session SPA, optimistic UI updates, responsive desktop & mobile card views, WCAG 2.1 AA accessibility. |
| **Backend API Gateway** | Fastify 5, Node.js (>=24.14), TypeScript, Drizzle ORM, PostgreSQL 16+, Redis 7+, Fastify Helmet, Fastify Rate Limit | Strictly normalized 3NF/BCNF relational schema, Row-Level Security (`SET LOCAL app.current_tenant`), parameterized SQL, streaming exports. |
| **Shared Core (`@mms/shared`)** | Strict ESM TypeScript Package | Single Source of Truth (SSOT) for domain types, `.strict()` Zod schemas, translation dictionaries, money and date formatters. |
| **Platform Management** | Dedicated Platform Console (`/platform/*`) | Super-admin tenant provisioning, custom domain routing, workspace gates, system telemetry, and tenant suspension/recovery. |
| **Testing & CI** | Vitest, MSW, Playwright, axe-core | Unit tests for shared utilities and query hooks, integration tests, E2E browser smoke tests, accessibility assertions. |

---

## 📦 Module Ecosystem

MMS ships with 18+ integrated tenant feature modules and a central platform console:

### 🎓 Academic & Student Operations
- **`students`**: Student directory, enrollment lifecycle, guardian linkage, admissions, and soft-delete trash recovery.
- **`contacts`**: Canonical contact records, identity resolution, phone normalization (E.164), duplicate detection, and WhatsApp verification.
- **`teachers`**: Faculty management, qualifications, subject assignments, workload balancing, and profile cards.
- **`sessions`**: Academic years, terms, class schedules, timetable generation, and course catalogs.
- **`enrollments`**: Section allocations, batch enrollments, status transitions (Active, On Hold, Graduated, Transferred).
- **`attendance`**: Daily and class-level attendance logging, punch clocks, absence notifications, and monthly summaries.
- **`examinations`**: Exam scheduling, grading scales, rubrics, question bank integration, and printable report cards.
- **`question-bank`**: Question repository categorized by subject, difficulty, and Bloom's taxonomy with auto-paper generator.
- **`hasanat`**: Character building, Islamic merit/discipline points tracking, conduct evaluation, and badge issuance.

### 💳 Finance & Operations
- **`finance`**: Invoicing, payment receipts, partial payments, automated late fees, discounts, and payment gateway logs.
- **`accounting`**: Double-entry bookkeeping, chart of accounts, journal entries, fiscal year closing, and balance sheets.
- **`obligations`**: Recurring institutional commitments, vendor payments, utility schedules, and compliance obligations.
- **`messaging`**: SMS & WhatsApp broadcast campaigns, dynamic token replacement (`{{student_name}}`, `{{balance}}`), and delivery receipts.
- **`dashboard`**: Executive command centre, dynamic customizable KPI widgets, real-time analytics series, and quick actions.
- **`reports`**: Universal `CustomReportBuilder`, cross-module aggregates, saved filters, Recharts visualizations, and PDF/Excel/Print exports.

### ⚙️ Administration & Platform Governance
- **`settings`**: Institution branding (palette derivation, dark/light theme), localization, date/time formatters, backup/wipe-restore, and AI/LLM settings.
- **`users`**: Tenant user management, granular RBAC permissions, role definitions, and access logs.
- **`profile`**: User account credentials, multi-factor settings, and language preferences.
- **`platform`** (Super-Admin): Apex tenant management, domain/subdomain mapping, global metrics, and system-wide audits.

---

## 🏛️ Core Architectural Invariants

1. **Three-Tier Universal Module Layout**: Every feature follows a standardized structural paradigm:
   - **Work Tier**: Main directory, metrics banner, search & multi-field filter bar, view toggles (`table` | `cards`), bulk action drawer, detail slide-over sheet, and soft-delete trash bin.
   - **Reports Tier**: Real-time KPI summaries, aggregated distribution charts (Recharts), and standard export toolbars.
   - **Setup Tier**: Dynamic Field Builder (add custom fields without SQL migrations), tab visibility preferences, column preferences, and default values.
2. **Canonical Contacts Relationship**: Individuals (students, parents, teachers, staff) are linked through canonical `contacts` rows. Profile and communication details reside on the contact; write operations strip hydrated contact fields before persistence.
3. **Data Integrity & Normalization**: Strictly normalized 3NF/BCNF relational design. Semi-structured domain fields (e.g., untyped JSON blobs or EAV tables) are prohibited for core domain entities.
4. **Boundary Isolation**: Frontend features must not cross-import from peer feature directories. All shared logic is routed through `@mms/shared`, `lib/`, or UI primitives (`components/ui/`).

---

## 📁 Monorepo Structure

```text
mms/
├── apps/
│   ├── frontend/             # React 19 + Vite 8 SPA Client
│   │   ├── src/
│   │   │   ├── components/   # Shared UI primitives (Radix UI, Tailwind tokens)
│   │   │   ├── hooks/        # Core application hooks
│   │   │   ├── lib/          # Query factories, apiClient, formatters, i18n loader
│   │   │   ├── platform/     # Super-admin console UI and routes
│   │   │   ├── providers/    # QueryClient, Theme, Direction (RTL/LTR), Auth providers
│   │   │   └── tenant/       # Tenant portal (18+ feature modules & pages)
│   │   └── package.json
│   └── backend/              # Fastify 5 REST & WebSocket Server
│       ├── src/
│       │   ├── config/       # Environment parsing, security, and port configs
│       │   ├── db/           # Drizzle schema (3NF/BCNF), migrations, and seeds
│       │   ├── middleware/   # Tenant isolation, RLS injection, RBAC, CSRF
│       │   ├── routes/       # REST endpoints grouped by domain (tenant & platform)
│       │   ├── services/     # Domain services, repository gateway, WhatsApp integrations
│       │   └── worker.ts     # Background job queue worker (BullMQ/Redis)
│       └── package.json
├── packages/
│   └── shared/               # @mms/shared (SSOT for frontend & backend)
│       ├── src/
│       │   ├── translations/ # Typed dictionaries: English (en), Arabic (ar), Urdu (ur), Persian (fa)
│       │   ├── schemas/      # Zero-trust Zod write DTOs (.strict())
│       │   ├── constants/    # System manifests, field registries, defaults
│       │   └── utils/        # Money, date, phone (E.164), and crypto helpers
│       └── package.json
├── e2e/                      # Playwright E2E browser & smoke test suites
├── docs/                     # Architectural summaries, blueprints, and guides
├── scripts/                  # Deployment, host isolation, and i18n validation scripts
├── .agent/                   # Autonomous agent rules, workflows, and skills matrix
├── restart_servers.sh        # Canonical local development screen runner
├── docker-compose.yml        # PostgreSQL & Redis development/production containers
├── turbo.json                # Turborepo task pipeline configuration
└── pnpm-workspace.yaml       # Workspace definitions & catalog versions
```

---

## ⚙️ System Requirements

Ensure the following runtimes and tools are installed:

- **Node.js**: `^24.14.0` (enforced via `.nvmrc` and root `package.json`)
- **pnpm**: `11.15.1` (enforced via `packageManager`)
- **PostgreSQL**: `16+`
- **Redis**: `7+` (optional for simple dev, required for background queue processing)
- **GNU screen**: (optional, recommended for persistent local dev sessions on macOS/Linux)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/TechMireSolutions/mms.git
cd mms
pnpm install
```

### 2. Launch Local Database & Redis (Docker)

```bash
docker compose up postgres redis -d
```

### 3. Setup Environment Files

```bash
# Backend configuration
cp apps/backend/.env.example apps/backend/.env

# Frontend configuration
cp apps/frontend/.env.example apps/frontend/.env
```

### 4. Apply Database Migrations & Seeds

```bash
pnpm --filter mms-backend db:migrate
```

### 5. Start Development Servers

Run the standard dev runner (starts GNU screen session with backend `:3000`, worker, and frontend `:5173`):

```bash
./restart_servers.sh
```

*Alternatively, run in the foreground via Turborepo:*
```bash
pnpm dev
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Screen Status / Logs**: `./restart_servers.sh status`

---

## 🔐 Environment Configuration

### Backend (`apps/backend/.env`)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/mms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 📜 Available Scripts

Execute commands from the monorepo root:

| Command | Description |
|---|---|
| `pnpm dev` | Starts frontend and backend services concurrently via Turborepo |
| `pnpm build` | Builds all packages (`@mms/shared`, `mms-frontend`, `mms-backend`) |
| `pnpm typecheck` | Runs strict TypeScript compiler checks across all workspaces |
| `pnpm test` | Runs unit and integration test suites via Vitest |
| `pnpm lint` | Runs ESLint and strict boundary import checks |
| `pnpm test:e2e` | Executes Playwright end-to-end browser test suites |
| `pnpm check:i18n` | Validates parity across English, Arabic, Urdu, and Persian translations |
| `./restart_servers.sh` | Starts dev stack in detached GNU screen (survives agent exit) |
| `./restart_servers.sh status` | Checks port status, health endpoints, and dev logs |
| `./restart_servers.sh stop` | Gracefully terminates dev servers and frees ports |
| `pnpm --filter mms-backend db:migrate` | Applies pending Drizzle migrations |
| `pnpm --filter mms-backend db:reset` | Drops, re-migrates, and seeds PostgreSQL database |

---

## 🗄️ Database & Migrations

MMS utilizes **Drizzle ORM** over PostgreSQL with strict 3NF/BCNF normalization:

- **Row-Level Security**: Every tenant table is secured with `FORCE ROW LEVEL SECURITY`. Transactions execute under the tenant context (`SET LOCAL app.current_tenant`).
- **Forward-Only DDL**: Migrations are strictly forward-only and stored in `apps/backend/src/db/migrations_drizzle`. Direct `drizzle-kit push` against production databases is strictly prohibited.

```bash
# Generate a new migration after editing schema files
pnpm --filter mms-backend drizzle-kit generate

# Run pending migrations
pnpm --filter mms-backend db:migrate
```

---

## 🛡️ Security & Tenant Isolation

1. **Zero-Trust Input Parsing**: All inbound requests are validated against shared Zod write DTOs (`@mms/shared`) before reaching service layers.
2. **Database Engine RLS**:
   ```sql
   SET LOCAL app.current_tenant = '<tenant_id>';
   ```
   Cross-tenant data access is blocked by PostgreSQL query planner policies.
3. **Cookie-Based SPA Authentication**: Session tokens are transmitted via `HttpOnly`, `SameSite=Lax`, and `Secure` cookies with CSRF/Origin validation.
4. **Header Hardening & Throttling**: Fastify Helmet configures strict CSP, HSTS, and X-Content-Type headers; rate limiting protects against brute-force attacks.

---

## 🌐 Internationalization (i18n) & RTL

MMS provides enterprise-grade BiDi localization across 4 languages:

| Code | Language | Script Direction | Status |
|---|---|---|---|
| `en` | **English** | LTR (Left-to-Right) | Canonical Source of Truth |
| `ar` | **العربية (Arabic)** | RTL (Right-to-Left) | 100% Key Parity |
| `ur` | **اردو (Urdu)** | RTL (Right-to-Left) | 100% Key Parity |
| `fa` | **فارسی (Persian / Farsi)** | RTL (Right-to-Left) | 100% Key Parity |

Translation keys are strictly typed in `packages/shared/src/translations/`. Key synchronization is verified via:
```bash
pnpm check:i18n
```

---

## 🧪 Testing & Quality Assurance

MMS enforces testing across all layers:

- **Unit & Hook Tests**: Vitest test runners in `packages/shared` and `apps/frontend`.
- **API Tests**: Backend route and RLS isolation tests via Fastify `app.inject()`.
- **E2E & Smoke Tests**: Playwright browser tests verifying responsive layouts (375px, 768px, 1440px), FormModal workflows, and RTL mirroring.
- **Accessibility Checks**: Automated axe-core audits ensuring WCAG 2.1 AA compliance for color contrast, keyboard navigation, and ARIA roles.

```bash
# Run all unit tests
pnpm test

# Run E2E suites
pnpm test:e2e
```

---

## 🚢 Production Deployment & Ops

### Architecture Overview
In production environments (e.g., Hetzner Linux VPS / Ubuntu):
- **Backend API**: Runs on port `5002` managed by PM2 or systemd.
- **Reverse Proxy**: Apache or Nginx handles SSL termination, static asset caching, and reverse proxying (`ProxyPass` to `127.0.0.1:5002`).
- **Background Worker**: Managed separately via `pnpm --filter mms-backend worker:start`.

```bash
# Containerized production stack
docker compose up -d --build
```

### Production Checklist
- [x] Configure production `DATABASE_URL`, `REDIS_URL`, and high-entropy `JWT_SECRET`.
- [x] Configure Apache / Nginx virtual host proxying with `X-Forwarded-For` and `X-Forwarded-Proto`.
- [x] Run database migrations (`pnpm --filter mms-backend db:migrate`).
- [x] Verify tenant host resolution via `scripts/verify-tenant-hosts.sh`.

---

## 🤖 Agent & Developer Standards

This repository is optimized for autonomous AI coding agents (Cursor, Antigravity, Claude Code) and human engineering teams:

- **Agent Guides & Rules**: Found in `.agent/rules/` and `.cursor/rules/`, synchronized via `bash .agent/scripts/sync-all.sh`.
- **Universal Standards**: Defined in `mms-core.md`, `mms-module-architecture.md`, and `mms-form-architecture.md`.
- **DRY Boundary**: No cross-feature imports. Shared domain logic resides in `@mms/shared`; shared UI primitives reside in `apps/frontend/src/components/ui/`.

---

## 📄 License

Copyright © 2026 TechMire Solutions. All rights reserved.  
This software is proprietary and confidential. Unauthorized copying, transfer, or distribution of this code, via any medium, is strictly prohibited.
