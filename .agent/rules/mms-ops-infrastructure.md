---
trigger: model_decision
description: Local dev setup, environment variables, Docker, backend ports, health endpoints, Linux compatibility, and CI expectations.
---

# MMS Operations & Infrastructure

**Workflow skills:** local install/run → `mms-dev-setup` · production Hetzner/Apache → `mms-ops-deploy` · VPS casing/LF/PM2 → `mms-linux-compatibility`.

Canonical operational and deployment standards for the Madrasa Management System (MMS) monorepo.

## 1. Prerequisites & Environment Setup
- **Node.js**: Match root `package.json` `engines.node` exactly in CI/Docker (Node >= 24.14.0) — bumps → **`mms-dependencies.md`** / skill `mms-dependency-upgrade`.
  - **Native Configuration**: Use `--env-file=.env` flag or `process.loadEnvFile()` natively. The `dotenv` package is banned.
  - **TypeScript Script Execution**: Use `--experimental-strip-types` for development scripts and lightweight CLI tools to execute `.ts` files directly without an upfront compile step (standard in TypeScript 7.0 / Node 24).
- **pnpm**: Match root `packageManager` via Corepack (`pnpm@11.15.1`, `corepack enable`). Docker/CI must use that exact pnpm version.
- **Turborepo**: Turbo v2 (`^2.10.9`) orchestrates workspace caching and concurrent pipelines.
- **Database**: PostgreSQL 16 for primary data layer and CI integration services.

### Workspace Commands (from repo root)
```bash
pnpm install          # Install all dependencies across workspaces
pnpm dev              # Start frontend + backend concurrently via Turbo
pnpm build            # Build shared package and applications
pnpm typecheck        # Run typechecking across the entire monorepo (TypeScript 7.0)
pnpm test             # Run Vitest 4 suites for all workspaces (root turbo task)
```

### Local Dev Helper Scripts
```bash
./restart_servers.sh              # Start dev servers in GNU screen (PostgreSQL + health check)
./restart_servers.sh status       # Check status of screen session
./restart_servers.sh stop         # Stop screen session and running servers
./restart_servers.sh --foreground # Run servers in foreground (blocking)
```

---

## 2. Environment Variables & Ports Configuration

### Local vs Production Ports
- **Production Backend**: **`5002`** (`MMS_PRODUCTION_BACKEND_PORT` / `MMS_PROD_BACKEND_PORT` in deploy scripts).
- **Local Dev Backend**: `3000` (`MMS_DEV_BACKEND_PORT` in `@mms/shared`; optional env override `MMS_BACKEND_PORT` in `restart_servers.sh`).
- **Local Dev Frontend**: `5173` (Vite dev server).

> [!CRITICAL]
> Under `NODE_ENV=production`, binding to ports `3000` or `3001` is strictly forbidden. The server **must exit** if these ports are set.

### Local Subdomain Resolution
- Local tenant subdomains (e.g. `dar-ul-quran.localhost:5173`) are proxied through Vite's dev server configuration.
- The dev server configuration maps requests to the backend (`127.0.0.1:3000`) while preserving host headers via proxy rules (forwarding through the `X-Forwarded-Host` header). `AsyncLocalStorage` (backed by Node 24 `AsyncContextFrame`) parses this header to resolve tenant contexts in dev mode.

### Environment Schema
| Variable | App | Purpose / Requirements |
|----------|-----|------------------------|
| `VITE_API_URL` | Frontend | API URL; proxies `/api` to `:3000` in dev. |
| `DATABASE_URL` | Backend | PostgreSQL connection string. Required. |
| `JWT_SECRET` | Backend | Authentication token signature secret. Required. |
| `PORT` | Backend | Port binding (`5002` in production; `3000` or custom in dev). |
| `ALLOWED_ORIGIN` | Backend | Production CORS host. Must explicitly match frontend. |
| `MMS_APP_DOMAIN` | Backend | Apex + `*.` tenant host resolution (production). |
| `PLATFORM_APP_URL` | Backend | Apex origin for platform email links / CORS pairing with `ALLOWED_ORIGIN`. |
| `PLATFORM_ALLOW_ENV_BOOTSTRAP` | Backend | When `true`, seed super-user from `PLATFORM_ADMIN_EMAIL` + password env — otherwise first-run UI (`mms-auth-security.md`). |
| `PLATFORM_ALLOW_REMOTE_MIGRATE_RESTART` | Backend | When `true`, apex `super_user` may `POST /api/platform/admin/system/migrate-and-restart` (password + confirm). Default off. |
| `NODE_ENV` | Backend | Run environment (`production` restricts CORS / cookie options). |

**Client bundle hygiene:** Only `VITE_*` (and Vite-injected `import.meta.env`) may ship in the frontend bundle. **Ban** leaking `JWT_SECRET`, `DATABASE_URL`, or other server secrets into FE code / Vite `define` — bumps/env layout → `mms-dependencies.md` when touching tooling.

- **Graceful Shutdown:** Catch `SIGTERM`/`SIGINT`, flip `/ready` to 503, wait `SHUTDOWN_DRAIN_DELAY_MS` to drain ingress traffic, call `server.close()`, pause BullMQ workers, close DB pools, and unref a fallback timeout (drain delay + 10s) before forced exit — details §4 Health Checks.

### Data wipe / purge (do not invent new wipe APIs)
- **Tenant workspace delete**: `deleteWorkspace` → `purgeTenantDataBySubdomain` then remove workspace row (platform workspaces API).
- **Platform full reset**: `POST /api/platform/settings/reset-database` — apex + `authenticatePlatform` + `requireSuperUser` + password confirm → `resetAndReseedDatabase()`; clears platform session cookie. Not a tenant-scoped op.
- **Auth artifacts**: scheduler / `purgeExpiredAuthArtifacts` — TTL cleanup only (`mms-auth-security.md`).
- Ban ad-hoc `DROP SCHEMA` / FE-driven full DB wipes outside these paths.

---

## 3. Linux & Ubuntu VPS Compatibility
To ensure seamless deployments on Ubuntu systems:
- **Case-Sensitive Imports**: Every import path must match the exact directory and file casing on disk. Verify using `pnpm typecheck`.
- **Line Endings (LF)**: Shell scripts (`.sh` files) must use Unix-style LF (`\n`). Enforce via `.gitattributes` / editor settings — **do not** change the user's global `git config` from agents.
- **Path & Core Imports Formatting**: Always use forward slashes `/` or `node:path` utilities (`join`, `resolve`). Never hardcode backslashes `\`. Always prefix core module imports with `node:` (`node:fs/promises`, `node:crypto`, `node:path`).
- **Non-Root Execution**: PM2 and Node processes must run under a non-privileged system user (`node`, `www-data`, or the deploy user).
- **Permission Model Hardening**: Take advantage of the Node 24 `--permission` model to restrict unauthorized filesystem or process operations in high-risk environments (e.g., `--permission --allow-fs-read=/var/www/mmsv2/data`).
- **Structured Logging to stdout**: Use high-throughput loggers (Pino) to emit JSON logs directly to `stdout`. Let PM2 / systemd / container orchestrators handle log rotation and shipping instead of writing directly to log files within the application process.
- **Write Limits**: Limit write access exclusively to `/var/www/mmsv2/data`. Keep all application source files read-only.

---

## 4. CI/CD & Deploy Procedures
The GitHub Actions workflow (`.github/workflows/ci.yml`) runs a parallelized Directed Acyclic Graph (DAG) on push/PR to `main`:
1. **changes** — path filter (`dorny/paths-filter`) detecting backend DB, schema, and repository modifications
2. **lint-and-typecheck** — install → concurrent `pnpm typecheck` & `pnpm lint` across workspaces
3. **test-frontend** & **test-frontend-coverage** — 2-way parallel sharded frontend suite generating blob reports, merged by `test-frontend-coverage` to enforce unified coverage thresholds
4. **test-backend-unit** — install → fast mocked in-memory backend and `@mms/shared` unit suites with coverage gate
5. **test-backend-db** — conditionally triggered on schema/migration/backend DB modifications; spins up PostgreSQL 16, runs Drizzle migrations, and executes `vitest.db.config.ts`
6. **ci-gate** — unified branch protection status check aggregating all test/lint jobs with safe skip handling for bypassed DB runs
7. **e2e** & **merge-reports** — parallel Playwright sharded integration suite
8. **build-dist** — runs after `ci-gate` to produce production `mms-dist` tarball artifact for deployment

`deploy.yml` triggers on CI success for `main` (`workflow_run`) or manual dispatch: downloads the CI artifact (or builds on dispatch), SCPs to the VPS, runs `scripts/deploy-on-server.sh` pinned to `DEPLOY_SHA` (= CI `head_sha`). Schema DDL runs on backend startup via `initDb` / Drizzle migrate — no separate deploy migrate step. Rollback: `bash scripts/deploy-rollback.sh` (uses `.deploy-releases/`).

CI Node/pnpm images must match root `engines` / `packageManager` exactly — upgrade workflow → **`mms-dependencies.md`**. Never commit `.env` or secrets in artifacts.
Run responsive Playwright specs as **separate** CI steps (no bare `--` before the path) — `mms-testing-observability.md` / `mms-ui-ux-design.md` §4.
Retain Playwright **trace/video on failure** for responsive (and a11y smoke) specs as CI artifacts — do not discard failure diagnostics.
Supply-chain: Dependabot/Renovate + dependency-review → **`mms-dependencies.md`**.

### Turbo cache
Treat `turbo.json` inputs/outputs as sensitive — change only with intentional cache invalidation.

### Health Checks (SSOT)
- **Graceful Shutdown (two-phase)**: On SIGTERM/SIGINT the process flips `/ready` to 503 and WAITS `SHUTDOWN_DRAIN_DELAY_MS` (default 5s) BEFORE closing the socket, so whatever routes traffic can take the instance out of rotation while in-flight requests still complete (`lib/lifecycle.ts`). `/health` (liveness) keeps returning 200 while draining — a liveness failure would trigger a restart. Size the drain against the ROUTER's health-check interval, not docker-compose's healthcheck (that only reports container state). Behind Apache + a single pm2 instance nothing re-checks, so `SHUTDOWN_DRAIN_DELAY_MS=0` is appropriate there. The force-exit ceiling is derived from the drain delay plus 10s — keep it that way, or adding a drain wait makes shutdown MORE likely to be force-killed, not less.
- **Reverse-Proxy Keep-Alive Alignment (502 Bad Gateway Prevention)**: Fastify's `keepAliveTimeout` (65,000ms) and `headersTimeout` (66,000ms) must exceed the upstream reverse proxy's (Apache/Nginx) keep-alive timeout (e.g. 60,000ms) to prevent race conditions where Node closes an idle connection right as the proxy dispatches a request.
- **Operational Metrics**: `GET /metrics` (Prometheus text format) is off unless `METRICS_ENABLED=true`, and requires `Authorization: Bearer $METRICS_TOKEN` when that is set — the payload reveals pool sizes and the full route inventory. HTTP metrics label on the ROUTE PATTERN and status CLASS only; labelling the raw URL would mint a time series per id (`lib/metrics.ts`).
- **Liveness**: `GET /health` → 200 (server up; unauthenticated; used by `AuthContext.checkAppState()`).
- **Readiness**: `GET /ready` → 200 on DB ping, `503` if PostgreSQL is down.
- PM2 deployments must curl `/ready` post-restart.

### Deploy Guidelines
- Merge configs using `scripts/merge-backend-env.sh` (always sets `PORT=5002`).
- Configure Apache upstreams via `scripts/fix-apache-upstream.sh` to forward to `:5002` (skipped when Apache fingerprint unchanged unless `MMS_FORCE_APACHE=1`).
- Skip prod `pnpm install` when `pnpm-lock.yaml` hash matches `.deploy-lock-hash` unless `MMS_FORCE_PNPM_INSTALL=1`.
- Run health checks locally on the production host using `curl http://127.0.0.1:5002/health`.

---

## 5. Audit Operations, Statement Auditing & Storage Tiering
- **Database Statement Auditing (`pgAudit`)**: Install `pgaudit` extension on the PostgreSQL host (`postgresql-16-pgaudit`), configure `shared_preload_libraries = 'pgaudit'` in `postgresql.conf`, and enable statement auditing (`pgaudit.log = 'write, ddl, role'`). Essential for capturing out-of-band direct database console access, DBA queries, and schema DDL that bypass the Fastify application layer.
- **Scheduled Verification Jobs**: Register a scheduled background cron/timer executing automated chain and Merkle root verification (`runAuditVerificationJob`). Persist results in `audit_verification_runs` and emit immediate P1 security alerts on hash breaks, missing sequence numbers, or timestamp regressions.
- **WORM Immutable Cold Storage**: Cold audit archives (91+ days) must be exported to WORM-locked (Write Once Read Many) object storage (S3 Object Lock or MinIO in Compliance/Governance mode). Enforce retention locks matching statutory floors (HIPAA 6 years, SOX 7 years, PCI-DSS 1 year). Carry the shard chain hash / Merkle root alongside each Parquet/ORC batch so detached archives remain verifiable.
- **Partition Lifecycle Automation**: Maintain monthly partitions (`PARTITION BY RANGE (transaction_timestamp)`) via automated scripts that pre-create future partitions and detach partitions >30 days old to the warm tier without table locks or `DELETE` contention.

