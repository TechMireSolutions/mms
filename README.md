# Madrasa Management System (MMS)

Enterprise-grade, multi-tenant administrative and educational management platform built for modern madrasas, schools, and educational institutions.

---

## 🌟 Key Capabilities

- **Multi-Tenant Architecture & Isolation**: Strict workspace boundary isolation using PostgreSQL Row-Level Security (RLS), tenant context transactions, and role-based access control (RBAC).
- **Core Domain Modules**:
  - **Students & Contacts**: Centralized contact management, student profiles, guardian relationships, and custom demographic fields.
  - **Teachers & Staff**: Faculty assignment, specialization tracking, workload overview, and credentials.
  - **Enrollments & Academic Sessions**: Academic year lifecycle, class sections, course allocations, and batch promotions.
  - **Attendance & Tracking**: Daily and session-level attendance recording, automated deficit alerts, and aggregation reports.
  - **Examinations & Question Bank**: Assessment scheduling, multi-tier grading schemes, report card generation, and curriculum question repositories.
  - **Hasanat & Tarbiyah (Discipline/Merits)**: Conduct logs, recognition points, behavioral metrics, and parent notifications.
  - **Finance & Accounting**: Fee schedule configuration, invoice generation, payment reconciliations, and double-entry general ledger.
  - **Omnichannel Messaging**: Integrated SMS and WhatsApp campaign delivery, dynamic template tokens, batch broadcasting, and delivery audit logs.
  - **Reports & Analytics**: Real-time KPI dashboards, dynamic custom reports, and asynchronous PDF / Excel exports.
- **Three-Tier Module UX Contract**: Standardized design language across modules separating operations into **Work** (directory, command centre, metrics, detail drawer, trash), **Reports** (analytics, charts, exports), and **Setup** (field builder, module preferences).
- **Comprehensive Localization (i18n) & BiDi**: Native support for **English (en)**, **Arabic (ar)**, **Urdu (ur)**, and **Persian/Farsi (fa)** with bidirectional (RTL/LTR) layout adaptation.
- **Background Worker & Jobs Engine**: BullMQ and Redis-backed task execution for heavy data exports, imports, bulk updates, and report generation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Monorepo Engine** | [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/) workspaces |
| **Frontend App** (`apps/frontend`) | [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [TanStack Query v5](https://tanstack.com/query), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/) |
| **Backend API** (`apps/backend`) | [Fastify 5](https://fastify.dev/), [TypeScript](https://www.typescriptlang.org/), [Drizzle ORM](https://orm.drizzle.team/), [PostgreSQL](https://www.postgresql.org/) (with RLS), [BullMQ](https://bullmq.io/), [Redis](https://redis.io/) |
| **Shared Core** (`packages/shared`) | `@mms/shared` — Strict Zod DTO contracts, domain types, universal utilities, and centralized translation catalogs |
| **Testing & Quality** | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/), [ESLint](https://eslint.org/), strict TypeScript |

---

## 📁 Repository Structure

```text
mms/
├── apps/
│   ├── frontend/             # React 19 + Vite client application
│   │   ├── src/
│   │   │   ├── components/   # Shared UI components & design system primitives
│   │   │   ├── lib/          # API client, query factories, i18n runtime
│   │   │   ├── platform/     # Platform administration & super-admin pages
│   │   │   └── tenant/       # Tenant domain features & module views
│   │   └── package.json
│   └── backend/              # Fastify 5 REST API & WebSocket server
│       ├── src/
│       │   ├── db/           # Drizzle schema definitions & SQL migrations
│       │   ├── middleware/   # Tenant isolation, auth guards, rate limiting
│       │   ├── routes/       # REST API endpoints & ts-rest contracts
│       │   ├── services/     # Domain business logic & external integrations
│       │   └── worker/       # BullMQ background job processor
│       └── package.json
├── packages/
│   └── shared/               # Universal package shared across frontend & backend
│       ├── src/
│       │   ├── schemas/      # Zod validation schemas & write DTOs
│       │   ├── types/        # TypeScript interfaces & domain models
│       │   ├── translations/ # Language packs (en, ar, ur, fa)
│       │   └── utils/        # Pure formatting & conversion utilities
│       └── package.json
├── .agent/                   # AI Agent guidance, workflows, and skills
└── package.json              # Monorepo root configuration & task scripts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes and services are available on your system:

- **Node.js**: `>= 24.14.0`
- **pnpm**: `>= 11.15.1`
- **PostgreSQL**: `>= 15.0`
- **Redis**: `>= 7.0` (for background queues)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd mms
pnpm install
```

### 2. Configure Environment Variables

Create `.env` files in both the backend and frontend directories:

#### Backend (`apps/backend/.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mms_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secure-jwt-secret
COOKIE_SECRET=your-cookie-signing-secret
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (`apps/frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### 3. Initialize Database & Run Migrations

```bash
# Run database migrations
pnpm --filter mms-backend db:migrate

# (Optional) Seed development database
pnpm --filter mms-backend db:reset
```

### 4. Start Development Servers

Run both the frontend and backend servers concurrently:

```bash
pnpm dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:3000`
- **API Health Check**: `http://localhost:3000/health`

---

## 📜 Available Scripts

Run these commands from the root directory:

| Command | Description |
|---|---|
| `pnpm dev` | Start development servers for frontend and backend in watch mode |
| `pnpm build` | Compile and bundle all workspaces (`@mms/shared`, `backend`, `frontend`) |
| `pnpm typecheck` | Run TypeScript strict typecheck across all workspaces |
| `pnpm lint` | Lint all packages with ESLint |
| `pnpm test` | Run unit and integration tests using Vitest |
| `pnpm test:e2e` | Execute end-to-end browser tests with Playwright |
| `pnpm check:i18n` | Verify translation key completeness across all supported locales |

---

## 🛡️ Architecture & Engineering Guidelines

1. **Validation Single Source of Truth**: All mutations must validate against strict Zod schemas defined in `@mms/shared`.
2. **Tenant Isolation**: Backend operations must enforce tenant RLS context (`SET LOCAL app.current_tenant`) within transactions.
3. **Optimistic Updates & Server Authority**: All REST entities synchronize via TanStack Query v5 with query options factories.
4. **BiDi & Semantic Layouts**: Follow CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) to guarantee flawless RTL (Arabic/Urdu/Persian) and LTR (English) rendering.
5. **No Direct Cross-Feature Couplings**: Frontend domain features communicate via shared `@mms/shared` contracts or `@/tenant/hooks/collections/*` facades.

---

## 📄 License

Proprietary and confidential. All rights reserved.
