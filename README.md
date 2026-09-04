# Madrasa Management System (MMS)

<p align="center">
  <img src="https://raw.githubusercontent.com/TechMireSolutions/mms/main/apps/frontend/public/logo.png" alt="MMS Logo" width="96" height="96" onerror="this.style.display='none'"/>
</p>

<p align="center">
  <strong>Enterprise-Grade, Multi-Tenant Educational and Administrative Management Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D24.14.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 24+"/>
  <img src="https://img.shields.io/badge/pnpm-%3E%3D11.15.1-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 11+"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify 5"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16"/>
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.31-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4"/>
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict"/>
  <img src="https://img.shields.io/badge/Turborepo-2.10-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Turborepo"/>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Capabilities](#-key-capabilities)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Monorepo Directory Layout](#-monorepo-directory-layout)
- [Core Engineering Invariants](#-core-engineering-invariants)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-clone--install-dependencies)
  - [Environment Configuration](#2-configure-environment-variables)
  - [Database Migrations](#3-database-setup--migrations)
  - [Running Locally](#4-start-development-servers)
- [Docker & Containerized Deployment](#-docker--containerized-deployment)
- [Available Scripts](#-available-scripts)
- [Localization (i18n) & BiDi Design](#-localization-i18n--bidi-design)
- [Security & Tenant Isolation](#-security--tenant-isolation)
- [AI Agents & Pair Programming Guidelines](#-ai-agents--pair-programming-guidelines)
- [License](#-license)

---

## 📖 Overview

**Madrasa Management System (MMS)** is a cloud-native, multi-tenant administrative suite engineered specifically for Islamic educational institutions, madrasas, and modern schools. It provides end-to-end management covering student admissions, guardian relations, academic schedules, curriculum-aligned question repositories, examinations with automated grading, discipline tracking (*Hasanat/Tarbiyah*), fee invoicing with double-entry general ledger bookkeeping, omnichannel WhatsApp/SMS broadcasting, and multi-tier analytics.

MMS is architected with a zero-trust multi-tenancy model enforced directly at the database layer via PostgreSQL Row-Level Security (RLS) and transaction session boundaries, guaranteeing complete isolation between institutions.

---

## 🌟 Key Capabilities

### 1. Unified Person & Academic Management
- **Canonical Contacts Registry**: Centralized contact entity linking students, teachers, staff, and guardians, eliminating duplicate identity records.
- **Student Admissions & Profiles**: Complete demographic and family linkages, custom field extensions, and bulk class enrollment.
- **Faculty & Workload Orchestration**: Faculty specialization tracking, course assignments, and real-time workload metrics.
- **Academic Sessions & Enrollments**: Lifecycle management for academic years, class sections, promotion batches, and capacity thresholds.

### 2. Daily Operations & Academic Excellence
- **Attendance Tracking**: Real-time session and daily attendance logging (Present, Absent, Late, Excused) with automated deficit warnings and parent alerts.
- **Question Bank & Curricula**: Pedagogical question repository tagged by subject, difficulty, and citation metadata with automated test paper generation.
- **Examinations & Auto-Grading**: Flexible grading scales, scheduled assessment windows, mark sheet generation, and printable report cards.
- **Hasanat & Tarbiyah (Conduct & Merits)**: Behavior logging, character recognition badges, merit/demerit ledger, and parent notifications.

### 3. Financial Management & Accounting
- **Tuition & Fee Schedules**: Configurable recurring fee structures, sibling discounts, and automated invoice runs.
- **Invoice & Payment Processing**: Multi-channel payment recording, receipt generation, and balance adjustments.
- **Double-Entry General Ledger**: Chart of accounts, journal entries, trial balances, and audit-proof financial statements.

### 4. Omnichannel Communications & Analytics
- **Messaging Engine**: Batch SMS and WhatsApp campaigns powered by template token interpolation (`{{firstName}}`, `{{balance}}`), delivery logs, and soft-archive semantics.
- **Three-Tier Module Architecture**: Standardized layout across all features dividing workflows into **Work** (operational directory, command centre, detail drawers, trash), **Reports** (Recharts visualizer, KPIs, exports), and **Setup** (field registry, preferences).
- **Asynchronous Data Exports**: Streamed client-side and background worker-backed exports for PDF (`jspdf`) and Excel (`xlsx`).

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Layer ["Client Tier (Browser / SPA)"]
        UI["React 19 + Tailwind CSS v4"]
        TQ["TanStack Query v5 Cache"]
        BiDi["BiDi Engine (RTL / LTR)"]
        UI --> TQ
        UI --> BiDi
    end

    subgraph Gateway ["HTTP & Network Gateway"]
        APIC["apiClient (Native Fetch)"]
        WS["WebSocket Client (/api/ws)"]
        TQ --> APIC
        UI --> WS
    end

    subgraph Backend ["Backend Tier (Fastify 5 + Node.js 24)"]
        FST["Fastify Server (:3000 dev / :5002 prod)"]
        AUTH["Auth & Tenant RLS Middleware"]
        ROUTES["Domain Use Cases & REST Routes"]
        ALS["AsyncLocalStorage (Trace & Context)"]
        
        APIC --> FST
        WS --> FST
        FST --> AUTH
        AUTH --> ROUTES
        AUTH --> ALS
    end

    subgraph Data Tier ["Data & Worker Tier"]
        DRZ["Drizzle ORM Adapter"]
        PG[("PostgreSQL 16 (RLS Enforced)")]
        REDIS[("Redis 7 (Cache & BullMQ)")]
        WRK["Background Worker Process"]

        ROUTES --> DRZ
        DRZ --> PG
        ROUTES --> REDIS
        WRK --> REDIS
        WRK --> PG
    end

    subgraph Shared ["Shared Core (@mms/shared)"]
        ZOD["Strict Zod Schemas & DTOs"]
        I18N["Translation Catalogs (en, ar, ur, fa)"]
        TYPES["Domain Types & Pure Utils"]
    end

    UI -.-> Shared
    ROUTES -.-> Shared
    DRZ -.-> Shared
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Monorepo** | [Turborepo 2](https://turbo.build/) + [pnpm 11](https://pnpm.io/) | Fast, cached, multi-package builds with strict dependency catalogs |
| **Frontend Framework** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) | Concurrent rendering, route-level code splitting, sub-second HMR |
| **State & Data Fetching** | [TanStack Query v5](https://tanstack.com/query) | Server-authoritative caching, query options factories, zero ad-hoc effects |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | CSS-first `@theme` design tokens, WCAG 2.1 AA accessible primitives |
| **DOM Virtualization** | [@tanstack/react-virtual](https://tanstack.com/virtual) | Mandatory row virtualization for tables and lists $> 30$ items |
| **Animations & Icons** | [Framer Motion](https://www.framer.com/motion/) + [Lucide React](https://lucide.dev/) | Fluid micro-interactions, responsive directional mirroring |
| **Backend Framework** | [Fastify 5](https://fastify.dev/) | High-performance asynchronous HTTP engine with native schema validation |
| **Runtime Environment** | [Node.js 24](https://nodejs.org/) | Native `fetch`, `node:` imports, `using` resource cleanup, `crypto.hash` |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) | Strict 3NF/BCNF normalization, typed column projections, database-level RLS |
| **Caching & Job Queue** | [Redis 7](https://redis.io/) + [BullMQ](https://bullmq.io/) | Multi-tenant namespaced caching, asynchronous large dataset export pipelines |
| **Shared Contracts** | `@mms/shared` (`packages/shared`) | Single Source of Truth for Zod write DTOs, domain models, and i18n catalogs |
| **Testing Suite** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | Fast parallel unit/integration testing and cross-browser end-to-end specs |

---

## 📁 Monorepo Directory Layout

```text
mms/
├── apps/
│   ├── frontend/                     # React 19 Client SPA
│   │   ├── src/
│   │   │   ├── components/ui/        # Design system primitives (Button, Table, FormModal)
│   │   │   ├── lib/                  # Shared FE core (apiClient, query factories, i18n runtime)
│   │   │   ├── platform/             # Super-admin apex administration (/platform)
│   │   │   └── tenant/               # Tenant workspace domain modules
│   │   │       ├── features/         # Module implementations (contacts, students, finance, etc.)
│   │   │       └── hooks/            # Cross-feature facades (@/tenant/hooks/collections/*)
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── backend/                      # Fastify 5 REST API & WebSocket Server
│       ├── src/
│       │   ├── db/                   # Drizzle schema definitions & SQL migrations
│       │   ├── middleware/           # authenticateTenant, authenticatePlatform, RLS session
│       │   ├── routes/               # Modular route plugins & ts-rest contract handlers
│       │   ├── services/             # Domain use cases & business logic
│       │   ├── worker/               # Background task queues & export processors
│       │   └── index.ts              # Fastify application composition root
│       ├── package.json
│       └── Dockerfile
├── packages/
│   └── shared/                       # Universal Shared Package (@mms/shared)
│       ├── src/
│       │   ├── schemas/              # Strict Zod write DTOs (.strict()) & query contracts
│       │   ├── translations/         # Translation dictionaries (en, ar, ur, fa)
│       │   ├── types/                # Pure TypeScript domain types & manifests
│       │   └── utils/                # Universal helpers (formatDate, formatMoney, parsePhone)
│       └── package.json
├── .agent/                           # Antigravity agent configuration, workflows & rules
├── .cursor/                          # Cursor IDE rules (.mdc) & skills
├── .claude/                          # Claude Code rules & skills mirror
├── docker-compose.yml                # Production and local ops container stack
├── turbo.json                        # Turborepo task pipeline configuration
└── package.json                      # Root workspace configuration & scripts
```

---

## 🛡️ Core Engineering Invariants

Every contribution to MMS is strictly governed by authoritative architectural rules:

### 1. Multi-Tenant Isolation & Zero Trust
- Every tenant query executes within a database transaction scoped with `SET LOCAL app.current_tenant = :tenant_id`.
- Tenant tables enforce PostgreSQL `FORCE ROW LEVEL SECURITY`.
- The application never trusts client-supplied `workspaceSubdomain` or `userId` from request bodies.

### 2. Validation Single Source of Truth (SSOT)
- Domain write DTOs are authored once in `@mms/shared` using strict Zod schemas (`.strict()`).
- The backend validates payloads via `parseRequest` before database persistence; the frontend uses the same schemas with React Hook Form.

### 3. Universal Three-Tier Module Contract
All primary domain pages adhere strictly to the 3-tier structure:
- **Work**: Operational record directory, search/filters menu, directory view toggle (`table` | `cards`), detail profile drawer (`DetailDrawerShell`), soft-delete trash view, and bulk operations (`BulkSelectionBar`).
- **Reports**: KPI summary strip (`ModuleCommandMetricsGrid`), interactive Recharts charts, and export tools (`ExportToolbar`).
- **Setup**: Module custom fields builder and preferences draft panel gated by `canEditSetup`.

### 4. Performance & Resource Efficiency Rules
- **N+1 Elimination**: Zero database queries inside iterative loops (`for`, `map`, `Promise.all`). Iterations must be batched via Drizzle relational `with`, `inArray`, or batch `/resolve`.
- **Zero Wildcard Projections**: Strict ban on `SELECT *` or bare `db.select().from(table)`. All queries must explicitly project only required columns matching `@mms/shared` Response DTOs.
- **Mandatory Virtualization**: Any list, table, cards grid, or feed rendering more than 30 concurrent DOM items must use `@tanstack/react-virtual` (reference: `ContactsListDesktopTable.tsx`).
- **Multi-Tier Caching**: Read-heavy queries cache in Redis (`apps/backend/src/lib/redis.ts`) with explicit TTLs (60s metrics, 300s lookups/config) namespaced by tenant (`mms:{tenantId}:{module}:{resource}:{hash}`).
- **Memory & Streaming**: Zero memory buffering for large uploads or datasets (`Buffer.concat` ban). File uploads stream via `@fastify/multipart`; exports stream via `node:stream`. Datasets $> 500$ rows offload to background worker jobs.
- **Targeted Memoization**: Non-trivial calculations (`useMemo`) and callback dependencies (`useCallback`) are memoized to eliminate render churn without premature memoization on simple primitives.

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes and services are installed:

- **Node.js**: `>= 24.14.0` (LTS or current stable)
- **pnpm**: `>= 11.15.1` (enforced via `packageManager`)
- **PostgreSQL**: `>= 16.0` (with `pgcrypto` / `uuid-ossp`)
- **Redis**: `>= 7.0` (for session revoking, caching, and background queues)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/TechMireSolutions/mms.git
cd mms

# Install workspace dependencies using pnpm
pnpm install
```

### 2. Configure Environment Variables

Create `.env` files in both the backend and frontend packages using the templates below:

#### Backend (`apps/backend/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mms_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
COOKIE_SECRET=your-cookie-signing-secret-minimum-32-characters
CORS_ORIGIN=http://localhost:5173
PG_POOL_MAX=20
PG_STATEMENT_TIMEOUT_MS=30000
```

#### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### 3. Database Setup & Migrations

```bash
# Apply forward-only Drizzle database migrations
pnpm --filter mms-backend db:migrate

# (Optional) Reset and seed initial development database
pnpm --filter mms-backend db:reset
```

### 4. Start Development Servers

Run the frontend client and backend API concurrently using Turborepo:

```bash
pnpm dev
```

The services will be available at:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **API Health Check**: `http://localhost:3000/health`
- **API Readiness Check**: `http://localhost:3000/ready`

---

## 🐳 Docker & Containerized Deployment

A production-ready `docker-compose.yml` orchestrates PostgreSQL, Redis, the Fastify API server, and the BullMQ background worker.

```bash
# 1. Set required secrets in shell environment or root .env
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export REDIS_PASSWORD=$(openssl rand -hex 24)
export JWT_SECRET=$(openssl rand -hex 32)

# 2. Build and start all services in detached mode
docker compose up -d --build

# 3. View status and logs
docker compose ps
docker compose logs -f backend
```

- **Production API Port**: `5002` (Hetzner / Apache Reverse Proxy target)
- **Local Dev API Port**: `3000`

---

## 📜 Available Scripts

Run these scripts from the repository root:

| Command | Description |
|---|---|
| `pnpm dev` | Start development servers for frontend and backend in watch mode |
| `pnpm build` | Compile and bundle all workspaces (`@mms/shared`, `backend`, `frontend`) |
| `pnpm typecheck` | Run TypeScript strict compiler check across all packages |
| `pnpm lint` | Execute ESLint with project compatibility rules across all packages |
| `pnpm test` | Run Vitest unit and integration tests across all packages |
| `pnpm test:coverage` | Execute tests and generate detailed V8 coverage reports |
| `pnpm test:e2e` | Run Playwright end-to-end browser automation tests |
| `pnpm check:i18n` | Validate translation key completeness across `en`, `ar`, `ur`, and `fa` |
| `pnpm --filter mms-backend db:migrate` | Execute pending Drizzle SQL migrations against PostgreSQL |
| `pnpm --filter mms-backend worker` | Start the BullMQ background worker in watch mode |

---

## 🌍 Localization (i18n) & BiDi Design

MMS supports 4 first-class languages:

| Code | Language | Script Direction | Layout Standard |
|---|---|---|---|
| `en` | **English** | Left-to-Right (LTR) | Standard logical CSS |
| `ar` | **العربية (Arabic)** | Right-to-Left (RTL) | Native logical properties (`ms-*`, `text-start`) |
| `ur` | **اردو (Urdu)** | Right-to-Left (RTL) | Native logical properties, Nastaliq typography |
| `fa` | **فارسی (Persian/Farsi)** | Right-to-Left (RTL) | Native logical properties |

### Bidirectional Layout Rules
- **CSS Logical Properties**: Never use physical margin/padding (`ml-*`, `mr-*`, `pl-*`, `pr-*`). Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `border-s-*`, `border-e-*`, `text-start`, `text-end`).
- **Directional Icon Flipping**: Navigation and progress arrows flip automatically with `rtl:rotate-180`. Brand and non-directional symbols remain unflipped.
- **Zero Fallback English Strings**: Hardcoded UI strings are banned. All copy must resolve through `t('module.key')`. Missing translation keys are detected via `pnpm check:i18n`.

---

## 🔒 Security & Tenant Isolation

- **HTTP Security Headers**: Fastify is preconfigured with `@fastify/helmet` (CSP, HSTS, frameguard, XSS protection).
- **Cookie Policy**: Authentication cookies use `HttpOnly`, `SameSite=Strict` (or `Lax` for OAuth flows), and `Secure` in production.
- **Rate Limiting**: Tiered endpoint rate limiting using `@fastify/rate-limit` backed by Redis to prevent brute-force and DoS attacks.
- **CSRF & Origin Verification**: All state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) enforce strict Origin and Referer validation against authorized domains.
- **Audit Logging**: Sensitive record deletions, administrative role changes, and data exports generate persistent audit logs.

---

## 🤖 AI Agents & Pair Programming Guidelines

This monorepo is configured with synchronized AI pair programming rules for **Antigravity**, **Cursor**, and **Claude Code**.

- **Authoritative Rules Directory**: `.cursor/rules/*.mdc` (source of truth)
- **Agent Mirrors**: `.agent/rules/*.md` (Antigravity) and `.claude/rules/*.md` (Claude Code)
- **Synchronization**: Running `bash .agent/scripts/sync-all.sh` mirrors rule bodies, skills, and workflows across all 3 agent formats.

### 5 Always-On Rules
1. `antigravity-global`: Cognition, terse code style, security standards, and Node 24 runtime rules.
2. `mms-core`: Monorepo stack boundaries, ownership index, and edit discipline.
3. `mms-performance`: Authoritative performance, Drizzle query projection, Redis caching, and DOM virtualization rules.
4. `mms-migration-status`: Technical debt tracking and architectural anti-pattern preventions.
5. `mms-completion-review`: Mandatory post-edit verification, typecheck, lint, and defect resolution checklist.

---

## 📄 License

Proprietary and Confidential. Copyright &copy; 2026 TechMire Solutions. All rights reserved.
Unauthorized copying, modification, distribution, or commercial use of this codebase is strictly prohibited.
