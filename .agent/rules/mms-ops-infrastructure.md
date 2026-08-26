---
trigger: model_decision
---

# MMS Operations & Infrastructure

**Workflow skills:** local install/run → `mms-dev-setup` · production Hetzner/Apache → `mms-ops-deploy` · VPS casing/LF/PM2 → `mms-linux-compatibility`.

Canonical operational and deployment standards for the Madrasa Management System (MMS) monorepo.

## 1. Prerequisites & Environment Setup
- **Node.js**: Match root `package.json` `engines.node` exactly in CI/Docker (Node >= 24) — do not restate pin numbers here; bumps → **`mms-dependencies.md`** / skill `mms-dependency-upgrade`.
  - **Native Configuration**: Use `--env-file=.env` flag or `process.loadEnvFile()` natively. The `dotenv` package is banned.
  - **TypeScript Script Execution**: Use `--experimental-strip-types` for development scripts and lightweight CLI tools to execute `.ts` files directly without an upfront compile step.
- **pnpm**: Match root `packageManager` via Corepack (`corepack enable`). Docker/CI must use that exact pnpm version.

### Workspace Commands (from repo root)
```bash
pnpm install          # Install all dependencies across workspaces
pnpm dev              # Start frontend + backend concurrently via Turbo
pnpm build            # Build shared package and applications
pnpm typecheck        # Run typechecking across the entire monorepo
pnpm test             # Run Vitest / node:test suites for all workspaces
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

### Graceful Process Lifecycle
Catch termination signals and drain connections cleanly:
```ts
const shutdown = async () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

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
The GitHub Actions workflow (`.github/workflows/ci.yml`) runs parallel jobs on push/PR to `main`:
1. **typecheck-lint** — install → typecheck → FE/BE lint
2. **unit** — install → Postgres → `pnpm test`
3. **e2e** — install → Postgres → Playwright chromium → responsive shell + authenticated specs
4. **build-dist** (main push only, after 1–3) — production `pnpm build` + upload `mms-dist` artifact (tarball + sha256)

`deploy.yml` triggers on CI success for `main` (`workflow_run`) or manual dispatch: downloads the CI artifact (or builds on dispatch), SCPs to the VPS, runs `scripts/deploy-on-server.sh` pinned to `DEPLOY_SHA` (= CI `head_sha`). Schema DDL runs on backend startup via `initDb` / Drizzle migrate — no separate deploy migrate step. Rollback: `bash scripts/deploy-rollback.sh` (uses `.deploy-releases/`).

CI Node/pnpm images must match root `engines` / `packageManager` exactly — upgrade workflow → **`mms-dependencies.md`**. Never commit `.env` or secrets in artifacts.
Run responsive Playwright specs as **separate** CI steps (no bare `--` before the path) — `mms-testing-observability.md` / `mms-ui-ux-design.md` §7.
Retain Playwright **trace/video on failure** for responsive (and a11y smoke) specs as CI artifacts — do not discard failure diagnostics.
Supply-chain: Dependabot/Renovate + dependency-review → **`mms-dependencies.md`**.

### Turbo cache
Treat `turbo.json` inputs/outputs as sensitive — change only with intentional cache invalidation.

### Health Checks (SSOT)
- **Liveness**: `GET /health` → 200 (server up; unauthenticated; used by `AuthContext.checkAppState()`).
- **Readiness**: `GET /ready` → 200 on DB ping, `503` if PostgreSQL is down.
- PM2 deployments must curl `/ready` post-restart.

### Deploy Guidelines
- Merge configs using `scripts/merge-backend-env.sh` (always sets `PORT=5002`).
- Configure Apache upstreams via `scripts/fix-apache-upstream.sh` to forward to `:5002` (skipped when Apache fingerprint unchanged unless `MMS_FORCE_APACHE=1`).
- Skip prod `pnpm install` when `pnpm-lock.yaml` hash matches `.deploy-lock-hash` unless `MMS_FORCE_PNPM_INSTALL=1`.
- Run health checks locally on the production host using `curl http://127.0.0.1:5002/health`.
