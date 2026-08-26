---
name: mms-dev-setup
description: Sets up and runs the MMS monorepo (pnpm matching packageManager, Node per engines >=24.14, PostgreSQL, backend :3000, frontend :5173, typecheck, lint, tests). Use when installing dependencies, starting dev servers, fixing env issues, or onboarding to the project.
---

# MMS Dev Setup

## Quick start

Requires Node matching root `engines` (`>=24.14.0`) and pnpm from `packageManager` (`corepack enable`).

```bash
# From repo root
pnpm install
./restart_servers.sh              # start dev (GNU screen — default, survives agent exit)
./restart_servers.sh status       # screen session + ports + health
./restart_servers.sh stop         # stop screen + servers
./restart_servers.sh --foreground # run in this terminal (Ctrl+C stops)
./restart_servers.sh --quick      # skip Vite cache clear / shorter wait
```

`./restart_servers.sh` is the **only** dev-server entry point (screen by default). `pnpm dev` is for manual foreground turbo use.

## Modern Node 24 Tooling

For new development scripts and CLI tools, use Node 24 features:
- **`--env-file=.env` / `process.loadEnvFile()`**: Use native configuration. Do not use the `dotenv` package.
- **Native Networking**: Use native `fetch()`, `FormData`, and global `WebSocket` instead of `axios`, `node-fetch`, or `ws`.
- **Native Globbing**: Use `import { glob } from 'node:fs/promises'` instead of `glob` or `fast-glob`.
- **URL Matching**: Leverage `URLPattern` API rather than custom regex or `path-to-regexp`.
- **Explicit Resource Management**: Use `using` / `await using` for automatic cleanup of db connections and open files when leaving scope.
- **One-Shot Hashing**: Use `crypto.hash()` from `node:crypto` instead of `createHash().update().digest()` chains.
- **Request Tracking**: Use `AsyncLocalStorage` via `AsyncContextFrame` for faster context propagation.
- **Structured Logging**: Emit structured JSON logs to `stdout` (e.g., using Pino) instead of writing directly to log files.
- **Native Testing**: Use `node:test` and `node:assert/strict`. The runner automatically awaits subtests.
- **`--experimental-strip-types`**: Execute `.ts` files directly without an upfront compile step.
- **`--permission`**: Enforce strict permission controls when writing new background workers (e.g., `--allow-fs-read`).
- **Graceful Process Lifecycle**: Catch termination signals (`SIGTERM`, `SIGINT`) and drain connections cleanly before exit.

## Verify environment

```bash
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
curl http://localhost:3000/health
curl http://localhost:3000/ready    # 503 if PostgreSQL down
```

## Required env (backend)

Create `apps/backend/.env` (never commit):

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | **Required** — server exits without it (e.g. `dev-local-change-me`) |
| `DATABASE_URL` | Default `postgresql://postgres:postgres@localhost:5432/mms` |
| `PLATFORM_ADMIN_EMAIL` | First platform super-user (apex only) — seeded when no platform users exist |
| `PLATFORM_ADMIN_PASSWORD` | Platform super-user password (`SEED_DEV_PASSWORD` fallback) |

**Apex (`http://localhost:5173/`):** platform sign-in for super-users who can create madrasas. **Tenant subdomains** use separate madrasa auth (`/api/auth/login`).

Frontend uses Vite proxy `/api` → `:3000` with `credentials: 'include'` for cookie auth.

## PostgreSQL

PostgreSQL is used as the relational database. Ensure a PostgreSQL instance is running and reachable via `DATABASE_URL`.

- Empty DB seeds minimal defaults via `minimalSeeds.ts` (using `getMinimalCollectionsForSeed()` and `getMinimalObjects()`)
- Legacy `seeds.json` is not used for automatic empty-DB seeding

## Drizzle migration gotcha

Adding `migrations_drizzle/*.sql` without a **`meta/_journal.json`** entry → migration never runs → startup errors (e.g. missing `auth_artifacts` table).

## Quality gates

```bash
pnpm typecheck              # all packages (builds @mms/shared first)
pnpm test                   # shared + backend (node:test) + frontend (Vitest)
cd apps/frontend && pnpm lint && pnpm typecheck
cd apps/backend && pnpm typecheck && pnpm test && pnpm lint
```

### Troubleshooting

| Symptom | Check |
|---------|--------|
| `/ready` → 503 | PostgreSQL up; `DATABASE_URL` |
| Missing table / auth_artifacts | Drizzle journal entry present |
| JWT_SECRET exit | Backend `.env` required secrets |
| Port conflict | Stop prior `restart_servers.sh` session |

## Layout

```
apps/frontend/   React 19 + Vite (:5173)
apps/backend/    Fastify 5 + PostgreSQL (:3000)
packages/shared/ @mms/shared
```

## Rules reference

`.cursor/rules/mms-ops-infrastructure.mdc`, `mms-core.mdc`, `mms-api-interface.mdc`, `mms-completion-review.mdc`

## Related skills

`mms-dependency-upgrade` (catalogs / Dependabot / Compiler — not day-to-day install), `mms-backend-api`, `mms-backend-security`, `mms-data-sync`, `mms-linux-compatibility`

## Done

Env verified + `/health` + `/ready` green. After code changes, follow `mms-completion-review.mdc`. Never commit `.env`.
