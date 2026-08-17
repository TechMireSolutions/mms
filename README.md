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
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Monorepo Structure](#-monorepo-structure)
- [System Requirements](#-system-requirements)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Database & Migrations](#-database--migrations)
- [Security & Tenant Isolation](#-security--tenant-isolation)
- [Internationalization (i18n) & RTL](#-internationalization-i18n--rtl)
- [Docker & Production Deployment](#-docker--production-deployment)
- [Agent & Developer Standards](#-agent--developer-standards)
- [License](#-license)

---

## 🌟 Overview

**MMS (Madrasa Management System)** is an advanced, high-performance monorepo platform designed to streamline administrative, academic, financial, and communication operations for madrasas and Islamic educational institutions worldwide.

Built with strict multi-tenancy, Row-Level Security (RLS), full RTL/LTR internationalization (English, Arabic, Urdu, Persian/Farsi), and real-time synchronization, MMS delivers an uncompromising, responsive user experience backed by a resilient, scalable Fastify + PostgreSQL backend.

---

## ✨ Key Features

### 🎓 Academic & Student Lifecycle
- **Unified Contact Architecture**: Canonical `contacts` system linking students, guardians, and staff with zero data redundancy.
- **Enrollments & Class Sessions**: Dynamic session tracking, section assignments, and attendance logs.
- **Examinations & Question Bank**: Comprehensive exam scheduling, grading rubrics, report card generation, and reusable question banks.
- **Hasanat & Discipline**: Merit and behavioral tracking for holistic student progress monitoring.

### 💰 Finance & Double-Entry Accounting
- **Invoices & Payment Processing**: Automated invoice generation, partial payments, discounts, and recurring fee structures.
- **Chart of Accounts & Ledger**: Double-entry bookkeeping with strict financial integrity and balance auditing.
- **Financial Analytics**: Real-time revenue reports, outstanding fee tracking, and fiscal period reconciliation.

### 📢 Omnichannel Communications
- **WhatsApp & SMS Campaigns**: Automated alerts, payment reminders, and broadcast messaging with tokenized dynamic variables.
- **Live Message Logs & Delivery Tracking**: Real-time queue status, delivery confirmation, and provider failover.

### 🛠️ Extensibility & Data Governance
- **Three-Tier Universal Module Layout**: Consistent **Work** (command centre/directory/drawer), **Reports** (analytics/exports), and **Setup** (preferences/fields) architecture across all modules.
- **Dynamic Field Builder**: Add custom schema fields, validate inputs, and customize table columns per tenant without database migrations.
- **Encrypted Backup & Wipe-Restore**: Client-side encrypted workspace backup generation and atomic restore mechanisms.
- **Export Engine**: Universal PDF, Excel (`.xlsx`), and print export pipeline with background job queuing.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client["Client (Browser / Mobile PWA)"] --> |HTTP / WebSocket (Cookie SPA)| Gateway["Fastify API Gateway (:3000 / :5002)"]
    Gateway --> Auth["Tenant / Platform Auth Middleware"]
    Auth --> |RLS SET LOCAL app.current_tenant| Drizzle["Drizzle ORM (PostgreSQL 16)"]
    Gateway --> Worker["Background Task Worker (BullMQ / Redis)"]
    Gateway --> WS["WebSocket Hub (/api/ws)"]
    Shared["@mms/shared (Zod SSOT, Types, i18n, DTOs)"] -.-> Client
    Shared -.-> Gateway
```

| Layer | Technology | Highlights |
|---|---|---|
| **Frontend** | React 19, Vite 8, TypeScript | Tailwind CSS v4, Radix UI Primitives, TanStack Query v5, Framer Motion, Lucide Icons, Recharts |
| **Backend** | Fastify 5, Node.js (>=24), TypeScript | Drizzle ORM, PostgreSQL (3NF/BCNF + RLS), Redis 7, WebSockets, JWT, Fastify Helmet/CORS |
| **Shared Package** | `@mms/shared` (Strict ESM) | Single Source of Truth (SSOT) for Zod schemas, write DTOs, i18n translations, date/money utils |
| **Monorepo Tools** | Turborepo, pnpm Workspaces | Instant cached pipeline execution, shared catalog dependencies |
| **Testing & CI** | Vitest, Playwright, axe-core | Fast unit tests, comprehensive E2E browser smoke specs, WCAG accessibility validation |

---

## 📁 Monorepo Structure

```text
mms/
├── apps/
│   ├── frontend/             # React 19 + Vite SPA (Client Application)
│   │   ├── src/
│   │   │   ├── components/   # Shared UI primitives (Radix + Tailwind)
│   │   │   ├── lib/          # Global client utilities, Query factories, apiClient
│   │   │   ├── platform/     # Super-admin & platform management UI
│   │   │   └── tenant/       # Tenant portal (18+ academic, financial & messaging modules)
│   │   └── package.json
│   └── backend/              # Fastify 5 REST & WebSocket API
│       ├── src/
│       │   ├── db/           # Drizzle schema (3NF/BCNF), migrations, seed scripts
│       │   ├── middleware/   # Tenant isolation, RLS injection, RBAC auth
│       │   ├── routes/       # REST endpoints (grouped by domain)
│       │   ├── services/     # Business logic & repository gateway
│       │   └── worker.ts     # Asynchronous background job queue worker
│       └── package.json
├── packages/
│   └── shared/               # @mms/shared — SSOT types, Zod schemas, i18n dictionaries
│       ├── src/
│       │   ├── translations/ # English (en), Arabic (ar), Urdu (ur), Persian (fa)
│       │   ├── schemas/      # Zero-trust Zod write DTOs (.strict())
│       │   └── utils/        # Date, currency, phone number (E.164) formatters
│       └── package.json
├── e2e/                      # Playwright end-to-end test suites
├── docs/                     # Architectural documentation, guides, and specifications
├── scripts/                  # Workspace management & compatibility utilities
├── .agent/                   # Agent rules, workflows, and skills matrix
├── docker-compose.yml        # Local PostgreSQL & Redis infrastructure
├── turbo.json                # Turborepo task pipeline configuration
└── pnpm-workspace.yaml       # Workspace package definitions & catalog dependencies
```

---

## ⚙️ System Requirements

Ensure your development environment meets the following specifications:

- **Node.js**: `^24.14.0` (as defined in `.nvmrc` and root `package.json`)
- **pnpm**: `11.15.1` (enforced via `packageManager`)
- **PostgreSQL**: `16+`
- **Redis**: `7+` (optional for local dev, required for background queues in production)

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/TechMireSolutions/mms.git
cd mms
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Database & Infrastructure (via Docker)
```bash
docker compose up postgres redis -d
```

### 4. Configure Environment Variables
Copy the example environment files for both apps:
```bash
# Backend configuration
cp apps/backend/.env.example apps/backend/.env

# Frontend configuration
cp apps/frontend/.env.example apps/frontend/.env
```

### 5. Run Database Migrations & Seeds
```bash
# Execute schema migration and seed demo data
pnpm --filter mms-backend db:migrate
```

### 6. Start Development Servers
```bash
# Run both Frontend (Vite) and Backend (Fastify) concurrently
pnpm dev
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000) (Dev) / [http://localhost:5002](http://localhost:5002) (Prod)
- **API Health Endpoint**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

*(Optional) If using screen session manager on Linux/macOS:*
```bash
./restart_servers.sh
```

---

## 🔐 Environment Configuration

### Backend (`apps/backend/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/mms
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-mms-jwt-token-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`apps/frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

## 📜 Available Scripts

Run commands from the monorepo root using `pnpm`:

| Command | Action |
|---|---|
| `pnpm dev` | Starts frontend and backend in watch mode via Turborepo |
| `pnpm build` | Builds all packages (`@mms/shared`, `mms-frontend`, `mms-backend`) |
| `pnpm typecheck` | Runs TypeScript compiler checks across all workspaces |
| `pnpm test` | Runs unit and integration tests via Vitest |
| `pnpm lint` | Runs ESLint and strict import boundary verification |
| `pnpm test:e2e` | Executes Playwright end-to-end browser smoke test suites |
| `pnpm --filter mms-backend db:migrate` | Applies pending Drizzle database migrations |
| `pnpm --filter mms-backend db:reset` | Resets and re-seeds the PostgreSQL database |

---

## 🗄️ Database & Migrations

MMS uses **PostgreSQL** paired with **Drizzle ORM** adhering to strict 3NF/BCNF normalization:

- **Strict Typing**: Zero untyped `jsonb()` or EAV antipatterns for core domain entities.
- **Forward-Only Migrations**: All schema modifications are tracked through versioned migration files in `apps/backend/src/db/migrations`.
- **Tenant Isolation with RLS**: Tenant boundaries are enforced at the database engine level via PostgreSQL Row-Level Security policies (`FORCE ROW LEVEL SECURITY`).

```bash
# Generate a new migration after updating Drizzle schema
pnpm --filter mms-backend drizzle-kit generate

# Apply migrations
pnpm --filter mms-backend db:migrate
```

---

## 🛡️ Security & Tenant Isolation

1. **Zero-Trust Input Validation**: All incoming requests are strictly parsed and validated against shared Zod DTOs (`@mms/shared`) before processing.
2. **PostgreSQL RLS Enforcement**: Every tenant transaction injects session context:
   ```sql
   SET LOCAL app.current_tenant = '<tenant-id>';
   ```
   Ensuring cross-tenant data leakage is mathematically impossible at the database engine level.
3. **Cookie-Based SPA Auth**: Secure `HttpOnly`, `SameSite=Lax`, and `Secure` session cookies with CSRF/Origin validation.
4. **Header Hardening**: Fastify Helmet configured with strict CSP, CORS whitelisting, and per-route rate limiting.

---

## 🌐 Internationalization (i18n) & RTL

MMS natively supports 4 languages with full Bidirectional (BiDi) layout mirroring:

- **English (`en`)**: LTR (Base source of truth)
- **Arabic (`ar`)**: RTL
- **Urdu (`ur`)**: RTL
- **Persian / Farsi (`fa`)**: RTL

All translation keys are strongly typed and centralized in `packages/shared/src/translations/`.

---

## 🐳 Docker & Production Deployment

A production-ready `docker-compose.yml` is provided for containerized deployments:

```bash
# Build and run the entire stack in production mode
docker compose up -d --build
```

### Production Checklist
- [x] Configure production `JWT_SECRET` and secure database credentials.
- [x] Ensure reverse proxy (Nginx / Apache) forwards headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
- [x] Verify background worker is running for message dispatch and scheduled jobs (`node dist/worker.js`).

---

## 🤖 Agent & Developer Standards

This repository is optimized for autonomous agents (Cursor, Antigravity, Claude Code) and human engineers alike:

- **Rules & Standards**: Documented in `.agent/rules/` and synchronized with `.cursor/rules/` via `.agent/scripts/sync-all.sh`.
- **Module Architecture**: Every domain module implements the Three-Tier Architecture (**Work**, **Reports**, **Setup**).
- **Import Boundaries**: Feature modules must never import from peer features directly; shared logic must be extracted to `components/ui/`, `lib/`, or `@mms/shared`.

---

## 📄 License

Copyright © 2026 TechMire Solutions. All rights reserved.  
This software is proprietary and confidential. Unauthorized copying, transfer, or distribution of this file, via any medium, is strictly prohibited.
