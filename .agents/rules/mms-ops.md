---
trigger: model_decision
---

# MMS Operations

## Prerequisites

- Node.js **26+** (see root `package.json` `engines`)
- pnpm **11.8+** (`packageManager` field — `corepack enable`)

## Commands (from repo root)

```bash
pnpm install          # install all workspaces
pnpm dev              # frontend + backend via turbo
pnpm build            # build shared → apps
pnpm typecheck        # tsc all packages
pnpm test             # Vitest — shared, backend, frontend
```

CI runs typecheck + lint + test — see **`mms-ci.md`**.

Per-app:

```bash
cd apps/frontend && pnpm lint && pnpm typecheck && pnpm test
cd apps/backend && pnpm dev && pnpm typecheck && pnpm test && pnpm lint
```

Helper scripts:

```bash
./restart_servers.sh              # Postgres + restart + health check
./restart_servers.sh status       # check :3000 / :5173
./scripts/stop_servers.sh          # stop dev servers
```

## Environment

| Variable | App | Required |
|----------|-----|----------|
| `VITE_API_URL` | frontend | dev default via Vite proxy `/api` → `:3000` |
| `JWT_SECRET` | backend | **yes** — server refuses start without it |
| `DATABASE_URL` | backend | default `postgresql://postgres:postgres@localhost:5432/mms` |
| `PORT` | backend | **Hetzner:** `5002` only — **never** `3000`/`3001` (`mms-production-ports.md`). **Local dev:** `3000` / `MMS_BACKEND_PORT` |
| `ALLOWED_ORIGIN` | backend | production CORS (must match frontend origin with `credentials: true`) |
| `NODE_ENV` | backend | `production` tightens CORS |
| `LOG_LEVEL` | backend | optional — Fastify logger level |
| `SEED_DEV_PASSWORD` | backend | optional — dev password for full seed users |

Create `apps/backend/.env` locally — never commit real secrets. See root and per-app `.env.example`.

## Database

- PostgreSQL — **not** SQLite (ignore stale `DATABASE_PATH` in Dockerfile until fixed).
- Drizzle DDL migrations in `migrations_drizzle/` — **journal entry required** in `meta/_journal.json`.
- Data migrations `001–003` run on startup in `initDb()`.
- Empty DB → legacy full seed from `seeds.json`; **new tenant onboard** uses `minimalSeeds.ts`.

## Session / cookies (dev)

- Auth uses httpOnly cookies `mms_access` / `mms_refresh` — frontend must use `credentials: 'include'` (`apiClient`).
- Vite proxy forwards cookies and `x-forwarded-host` for tenant resolution.
- Test tenant API with host header: `demo.localhost` (not bare `localhost`).

## Docker (backend)

`apps/backend/Dockerfile` is **outdated** (SQLite, npm-only) — tracked in `mms-migration-status.md`. Before production:

- pnpm workspace build (shared → backend)
- `DATABASE_URL` pointing at PostgreSQL service
- Remove stale `DATABASE_PATH` / SQLite references
- Match Node 26 + pnpm 11 from CI (`mms-ci.md`)

## API health

| Endpoint | Purpose |
|----------|---------|
| `GET http://localhost:3000/health` | Liveness — process up |
| `GET http://localhost:3000/ready` | Readiness — PostgreSQL ping; returns `503` if DB down |

Deploy should curl `/ready` after PM2 restart (`mms-observability.md`).

## Production deploy (Hetzner)

Port policy → **`mms-production-ports.md`** (forbidden: `:3000`, `:3001`; canonical: `:5002`).

- Fastify + SPA on **`PORT=5002`** — Apache `ProxyPass` → `http://127.0.0.1:5002/` (`scripts/fix-apache-upstream.sh`)
- Reverse proxy terminates TLS; sets `x-forwarded-host` for tenant resolution
- `ALLOWED_ORIGIN`, `JWT_SECRET`, `DATABASE_URL` from secrets manager — never in image layers
- Security headers at proxy — `mms-security.md`
