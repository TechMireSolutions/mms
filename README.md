# 🕌 Madrasa Management System (MMS) — Monorepo

Welcome to the **Madrasa Management System (MMS)**, a highly robust, multi-tenant monorepo built using a modern, dependency-fresh TypeScript stack. It provides administrative, academic, financial, scheduling, and communication tools designed specifically for madrasas with high-efficiency data flows and strict tenant isolation.

---

## 🗺️ Monorepo Layout

MMS is structured as a `pnpm` workspace orchestrated by a unified Turbo build system:

```text
.
├── apps/
│   ├── frontend/          # React 19 SPA (Vite 8, Tailwind CSS v4, Radix/shadcn, TanStack Query v5)
│   └── backend/           # Fastify 5 REST API (Drizzle ORM, Node-Postgres, PM2)
├── packages/
│   └── shared/            # @mms/shared — types, validation schemas, translations, theme/branding formulas
├── scripts/               # Production deployments, shell utilities, and diagnostics
│   ├── apache/            # Apache vhost installer & host-isolation configurations
│   └── production/        # VPS bootstrapping, PM2 startup, backups, and database restores
├── docs/                  # Architectural documents & technical specifications
├── .agent/                # Antigravity agent configuration, custom rules, and workflow guides
├── .cursor/               # Cursor editor rules and workspace capabilities
├── .claude/               # Claude Code rules and settings templates
├── package.json           # Root workspace script definitions
├── pnpm-workspace.yaml    # Monorepo packages and release age constraints
├── restart_servers.sh     # Single entry point script to run and inspect dev servers
└── turbo.json             # Turborepo task pipeline definitions
```

---

## 🔒 Data Architecture & Tenant Isolation

MMS is built with a zero-trust multi-tenant architecture designed to ensure absolute data isolation between different madrasa subdomains:

*   **Strict Tenant Isolation**: Every request is intercepted by the Fastify backend to resolve the active tenant subdomain from the `Host` or `X-Forwarded-Host` header. The resolved subdomain is bound to an asynchronous execution context (`AsyncLocalStorage`).
*   **Composite Key Constraints**: All core PostgreSQL tables (such as students, contacts, sessions, and attendance records) utilize composite primary keys consisting of `(workspace_subdomain, id)`. This ensures that tenant boundaries are hard-enforced directly at the database engine level.
*   **Server-Authoritative REST & TanStack Query**: All 11 feature modules are fully migrated to a server-authoritative REST API architecture. Local storage caching is deprecated for primary records, and client-side data is dynamically cached and mutated using TanStack Query.
*   **MFA & Security Challenges**: OTP codes, 2FA tokens, and opaque refresh tokens are managed out-of-memory via a dedicated database-backed `auth_artifacts` table.

---

## 🛠️ Technology Stack

MMS targets stable, modern runtime and framework versions. Run `pnpm outdated -r` from the root to review upgrades.

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>=24.14.0` (LTS) | Server JavaScript execution environment |
| **Package Manager**| pnpm | `11.9.0` | High-performance monorepo package workspace manager |
| **Build Pipeline** | Turbo | `^2.10.3` | Monorepo build orchestrator with remote caching |
| **Language** | TypeScript | `^6.0.3` | Strict type safety, validation, and compile target |
| **Frontend SPA** | React | `^19.2.7` | UI component engine with React 19 inputs |
| **Frontend Tooling** | Vite | `^8.1.3` | Bundler and development server tool |
| **Styling** | Tailwind CSS | `^4.3.2` | Utility-first CSS engine with native CSS variables |
| **Animations** | Framer Motion | `^12.42.2` | Smooth interactive animations and transitions |
| **Query Cache** | TanStack Query | `^5.101.2` | Client data synchronizer, optimistic updates, and cache |
| **Error Reporting**| Sentry | `^10.63.0` | Client-side error tracking and logging boundaries |
| **Backend API** | Fastify | `^5.9.0` | High-throughput, low-overhead HTTP API framework |
| **Database ORM** | Drizzle ORM | `^0.45.2` | Type-safe SQL query generation and schema migrations |
| **Database** | PostgreSQL | `>=15.0` (17 in CI) | Relational multi-tenant persistent storage |
| **Test Runner** | Vitest | `^4.1.9` | ESM-first unit & integration test framework |
| **E2E Testing** | Playwright | `^1.49.0` | Cross-browser onboarding & integration end-to-end testing |
| **Validation** | Zod | `^4.4.3` | Schema validation for forms, APIs, and workspace state |

---

## ⚙️ Environment Configuration

Ensure environment settings are configured in `apps/backend/.env` and `apps/frontend/.env` (or override locally with `.env.local`).

### Backend Environment Variables (`apps/backend/.env`)

| Variable | Type | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | `postgres://postgres:postgres@localhost:5432/mms` | PostgreSQL connection string |
| `JWT_SECRET` | String | *(None)* | **Required**. Must be $\ge 32$ characters in production |
| `PORT` | Number | `3000` (Dev) / `5002` (Prod) | Fastify listener port |
| `NODE_ENV` | String | `development` | Runtime environment (`development` / `production`) |
| `MMS_APP_DOMAIN` | Hostname | `yourdomain.com` | **Required**. Apex domain to resolve tenant subdomains |
| `PLATFORM_APP_URL` | URL | `https://yourdomain.com` | Public absolute application URL used in transactional emails, links, etc. |
| `ALLOWED_ORIGIN` | URL | `http://localhost:5173` | CORS allowed origin header value |
| `MMS_UPLOADS_DIR` | Path | `apps/backend/uploads` | Asset upload location (e.g. workspace logos) |
| `PG_POOL_MAX` | Number | `20` | Maximum PostgreSQL pool connection limits |
| `LOG_LEVEL` | String | `info` | Logger verbosity (`debug`, `info`, `warn`, `error`) |
| `PLATFORM_ALLOW_ENV_BOOTSTRAP` | Boolean | `false` | Set `true` to auto-create the initial platform super-user admin on start |
| `PLATFORM_ADMIN_EMAIL` | String | *(None)* | Initial admin email address for bootstrap |
| `PLATFORM_ADMIN_PASSWORD` | String | *(None)* | Initial admin password for bootstrap |
| `PLATFORM_ADMIN_NAME` | String | `"Platform Admin"` | Initial admin name for bootstrap |

### Platform Email Integration

Emails (for login, onboarding, or reports) support two configurations. Define **one** set:

* **Resend API (Preferred)**:
  * `PLATFORM_RESEND_API_KEY`: API credential key from Resend.
  * `PLATFORM_EMAIL_FROM`: Verified sender address (e.g., `noreply@yourdomain.com`).
  * `PLATFORM_EMAIL_FROM_NAME`: Custom sender name (defaults to `"MMS Platform"`).
* **SMTP Transport (Fallback)**:
  * `PLATFORM_SMTP_HOST`: Mail server hostname (e.g., `smtp.gmail.com`).
  * `PLATFORM_SMTP_PORT`: SMTP port (usually `587` or `465`).
  * `PLATFORM_SMTP_SECURE`: Use SSL/TLS (`true`/`false`).
  * `PLATFORM_SMTP_USER`: SMTP username credentials.
  * `PLATFORM_SMTP_PASS`: SMTP password credentials.

### Frontend Environment Variables (`apps/frontend/.env` / `.env.local`)

| Variable | Type | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_APP_DOMAIN` | Hostname | `yourdomain.com` | **Required**. Apex platform domain for subdomain-based tenant routing. |
| `VITE_API_URL` | URL | `http://localhost:3000` | Optional absolute API origin when not using same-host reverse proxy. |
| `VITE_SENTRY_DSN` | URL | *(None)* | Optional Sentry browser DSN for client-side error reporting. |

---

## 🚀 Local Development

### 1. Database Setup
Start a local PostgreSQL container if you do not have PostgreSQL running natively:
```bash
docker run --name mms-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -d postgres:17
```

### 2. Configure Environment
Initialize backend configuration variables:
```bash
cp apps/backend/.env.example apps/backend/.env
```
Open `apps/backend/.env` and ensure `JWT_SECRET` is populated and `DATABASE_URL` matches your local database target.

### 3. Verification & Bootstrapping
Before running, you can verify your local environment configuration:
```bash
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
```

### 4. Running the Dev Stack

You can run the development servers in two different modes:

#### Option A: Direct Foreground Mode (Standard)
Start both frontend and backend development servers concurrently in your active terminal:
```bash
pnpm dev
```

#### Option B: GNU Screen Background Mode (Unified Control)
Run the servers as background services managed inside a screen session:
```bash
pnpm install
./restart_servers.sh          # Launches servers inside a background GNU screen session
```

##### Handy Development Commands
* **Inspect Status**: `./restart_servers.sh status` lists active ports, health checks, and running logs.
* **Stop Servers**: `./restart_servers.sh stop` terminates the screen session and releases ports.
* **Foreground Mode**: `./restart_servers.sh --foreground` runs the services directly in your active terminal.
* **Attach Screen**: `screen -r mms-dev` connects directly to the dev console. Detach with `Ctrl+A` then `D`.
* **Tail Logs**: `tail -f .logs/frontend.log .logs/backend.log .logs/worker.log` reviews realtime outputs.

*Note: Drizzle schema migrations and demo datasets seed automatically on backend start if an empty database is detected.*

### 5. Running the Background Worker

Heavy out-of-process operations (such as data exports and duplicate contact scans) require the background worker to be running. To start the polling background worker process locally:
```bash
pnpm --filter mms-backend run worker
```

---

## ⚙️ Background Jobs Architecture

CPU-bound or heavy operations (such as duplicate contact scans, CSV exports, or sync operations) run **out-of-process** from Fastify to keep the main event loop responsive.

```
                  ┌────────────────────────┐
                  │  Fastify API Process   │
                  └───────────┬────────────┘
                              │ Enqueues Job
                              ▼
                  ┌────────────────────────┐
                  │  PostgreSQL Database   │
                  │   `background_jobs`    │
                  └───────────▲────────────┘
                              │ Mutex Locks (FOR UPDATE SKIP LOCKED)
                              │ Updates Progress & Artifacts
                              ▼
                  ┌────────────────────────┐
                  │ Background Worker Loop │ (tsx watch src/worker.ts)
                  └───────────┬────────────┘
                              │ Forks Task Process
                              ▼
                    ┌──────────────────────┐
                    │  Job Runner Process  │ (src/jobRunnerProcess.ts)
                    └──────────────────────┘
```

1. **Enqueueing**: Fastify endpoints write job parameters to the `background_jobs` table.
2. **Locking**: The worker loop (`worker.ts`) polls and reserves pending jobs using PostgreSQL transactions with `FOR UPDATE SKIP LOCKED`.
3. **Execution**: The worker spawns a child process (`jobRunnerProcess.ts`) dedicated to running the job, guaranteeing memory and CPU isolation.
4. **Feedback**: The child process updates the database with its execution progress, errors, and output artifacts (such as download links).

---

## 🌐 Production (Hetzner / Ubuntu VPS)

In production, Fastify runs on **`PORT=5002`** serving the compiled SPA static assets and the REST endpoints. Apache acts as the reverse proxy terminating wildcard SSL/TLS traffic and routing requests downstream.

### Deployment Port Separation Policy
* **Development**: Ports `3000` (API) and `5173` (SPA)
* **Production**: Port `5002` (Fastify API + SPA host)
* **Forbidden Ports in Prod**: Ports `3000` and `3001` (to prevent dev overlaps)

### Fresh VPS Bootstrap Flow
On a fresh Ubuntu 22.04 or 24.04 VPS:

1. **Bootstrap Infrastructure**:
   ```bash
   sudo bash scripts/production/bootstrap-ubuntu-vps.sh
   ```
   *Installs Node.js, PM2, Apache, sets up firewall configurations, and logs folder paths.*

2. **Clone and Build**:
   Clone the repository to `/var/www/mmsv2`, create `apps/backend/.env`, and install packages:
   ```bash
   pnpm install
   pnpm build
   ```

3. **Configure Process Manager (PM2)**:
   Daemonize backend and worker processes:
   ```bash
   bash scripts/production/setup-pm2-startup.sh
   ```

4. **Lock Virtual Hosts**:
   Configure Apache virtual hosts for subdomain-based tenant routing:
   ```bash
   bash scripts/apply-production-host-isolation.sh apps/backend/.env
   ```

5. **Diagnostic Checks**:
   Check configuration mismatches or upstream issues:
   ```bash
   bash scripts/server-diagnose.sh apps/backend/.env
   bash scripts/fix-apache-upstream.sh apps/backend/.env
   curl -fsS http://127.0.0.1:5002/ready       # Should return 200 OK
   ```

### Wildcard TLS Certs & Tenant SNI Troubleshooting

If tenant subdomain URLs resolve to the incorrect default Apache vhost (falling back to default SSL sites due to SNI issues), run the wildcard TLS configuration utility:
```bash
sudo bash scripts/production/fix-tenant-tls-wildcard.sh apps/backend/.env
```
This utility automates Certbot DNS validation challenges to acquire a proper `*.MMS_APP_DOMAIN` certificate and update the host virtual hosts mapping.

### Daily Backups and Database Restores
* **Cron Daily Backups**:
  Add this to your crontab (`crontab -e`) to backup the PostgreSQL database nightly at 3:00 AM:
  ```text
  0 3 * * * /var/www/mmsv2/scripts/production/backup-postgres.sh
  ```
  Backups are saved to `.backups/postgres` with a automatic 14-day rotation window.
* **Database Restore Utility**:
  Restore the database to a specific snapshot:
  ```bash
  bash scripts/production/restore-postgres.sh /var/www/mmsv2/.backups/postgres/mms-snapshot.sql.gz
  ```
  *This command stops PM2, drops the public schema, applies the backup dump, and restarts the server process.*

---

## 🧪 Testing and Verification

MMS implements automated quality checks across the codebase workspace:

```bash
pnpm test          # Run Vitest test suites across the monorepo
pnpm lint          # Validate ESLint code rules
pnpm typecheck     # Strict TypeScript type compiler check
pnpm test:e2e      # Run Playwright end-to-end integration tests
```

### Test Scope Breakdown
* **Backend Tests** (`apps/backend/src/__tests__`): Route tests utilizing Fastify's `inject()` helper. This validates REST handlers, authentication artifacts, and tenant isolation middleware without opening network sockets.
* **Frontend Tests** (`apps/frontend/vitest.config.ts`): React components unit tests executed within `happy-dom` mock environments, utilizing mocked networks.
* **Shared Logic** (`packages/shared/src/__tests__`): Validates date/timezone utils, validation schemas, translation maps, and custom formulas.
* **End-to-End E2E Tests** (`e2e/`): Web client integration test flows run via Playwright. Run locally with `pnpm test:e2e`. The test runner automatically invokes `e2e/scripts/start-web-server.mjs` to orchestrate isolated development backend and frontend instances before running onboarding and login test suites.

---

## 🤖 AI Customization and Rules Sync

This monorepo supports developer configuration files for multiple AI coding tools. Custom instructions, project guidelines, and module capabilities are shared under a unified codebase standard:

```text
.agent/             # Antigravity capabilities (Skills, rules, and workflows)
.cursor/            # Cursor configurations (.mdc files)
.claude/            # Claude Code workspace guidelines
```

### Code Standards Synchronization
To avoid rule drift, edits to development standards, frameworks, or security rules must be synchronized across all coding tools. If you edit files within `.agent/rules`, `.cursor/rules`, or `.claude/rules`, run the sync script to propagate changes:
```bash
bash .agent/scripts/sync-all.sh
```
This utility keeps the rules, markdown patterns, and metadata attributes identical across the workspace folders.
