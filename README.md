# MMS — Madrasa Management System

pnpm workspace monorepo: React frontend, Fastify backend, shared types package, PostgreSQL database.

## Layout

```text
.
├── apps/
│   ├── frontend/          # React 19 + Vite (port 5173)
│   └── backend/           # Fastify 5 + Drizzle + PostgreSQL (port 3000)
├── packages/
│   └── shared/            # @mms/shared — types, settings defaults, utilities
├── package.json           # Root scripts (turbo)
├── pnpm-workspace.yaml
├── turbo.json
└── restart_servers.sh     # Kill stale ports, start backend + frontend
```

## Prerequisites

- **Node.js** 22+
- **pnpm** 11.x (`corepack enable` or `npm i -g pnpm`)
- **PostgreSQL** 15+ (local install or Docker)

## Environment

| Variable | App | Notes |
|----------|-----|-------|
| `PORT` | backend | **Production (Hetzner):** `5002` (Apache upstream). **Local dev:** `3000` or `MMS_BACKEND_PORT` |
| `VITE_API_URL` | frontend | Dev default: Vite proxies `/api` → `http://localhost:3000` |
| `JWT_SECRET` | backend | **Required** — server refuses to start without it |
| `DATABASE_URL` | backend | Default: `postgresql://postgres:postgres@localhost:5432/mms` |
| `ALLOWED_ORIGIN` | backend | Production CORS origin |
| `NODE_ENV` | backend | `production` tightens CORS |

Example backend `.env` (`apps/backend/.env`):

```env
JWT_SECRET=change-me-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mms
```

## Commands (repo root)

```bash
pnpm install      # install all workspaces
pnpm dev          # frontend + backend via turbo
pnpm build        # build @mms/shared, then apps
pnpm typecheck    # TypeScript check all packages
```

Per-app:

```bash
cd apps/frontend && pnpm lint
cd apps/backend && pnpm dev
```

Quick restart (PostgreSQL Docker, kills stale ports, health checks, logs to `.logs/`):

```bash
./restart_servers.sh           # full restart (recommended)
./restart_servers.sh --quick   # faster, no health wait
./scripts/stop_servers.sh      # stop background servers
```

## Local development

1. Start PostgreSQL and create database `mms` (or match `DATABASE_URL`).
2. Set `JWT_SECRET` in `apps/backend/.env`.
3. From repo root: `pnpm install && pnpm dev` (or `./restart_servers.sh`).
4. Open `http://localhost:5173` — API at `http://localhost:3000` (`GET /health`).

Migrations and seeds run on backend startup when the database is empty.

## Production build

```bash
pnpm build
```

- Shared package: `packages/shared/dist`
- Backend: `apps/backend/dist` → `node dist/index.js`
- Frontend: `apps/frontend/dist` (static assets for any static host)

## Docker (backend)

Build from the **repository root** (not `apps/backend`):

```bash
docker build -f apps/backend/Dockerfile -t mms-backend .
docker run -p 3000:3000 \
  -e JWT_SECRET=change-me \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/mms \
  mms-backend
```

PostgreSQL must be reachable at `DATABASE_URL`. The image exposes port **3000** by default; set `-e PORT=5002` and `-p 5002:5002` to match Hetzner.

## Production (Hetzner)

Fastify listens on **`PORT=5002`** (see `scripts/lib/deploy-ports.sh`). Apache `ProxyPass` must target `http://127.0.0.1:5002/`. Deploy scripts (`deploy-recover-backend.sh`, `fix-apache-upstream.sh`, `deploy-verify.sh`) use this default when `PORT` is unset in `apps/backend/.env`.

```bash
# On server after deploy issues:
bash scripts/server-diagnose.sh apps/backend/.env
bash scripts/fix-apache-upstream.sh apps/backend/.env
```
