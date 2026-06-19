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

- **Node.js** 26+ (`engines` in root `package.json`)
- **pnpm** 11.8+ (`corepack enable` uses `packageManager` from root `package.json`)
- **PostgreSQL** 15+ (local install or Docker)

## Tech stack (current)

| Layer | Version |
|-------|---------|
| Node.js | 26 |
| pnpm | 11.8 |
| Turbo | 2.9 |
| TypeScript | 6 |
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 4 |
| TanStack Query | 5 |
| Fastify | 5 |
| Drizzle ORM | 0.45 |
| PostgreSQL | 17 (CI) |
| Vitest | 4 |
| Playwright | 1.61 |
| Zod | 4 |

Run `pnpm outdated -r` from the repo root to check for newer releases.

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

Quick restart (PostgreSQL Docker, GNU screen, health checks):

```bash
./restart_servers.sh              # start (recommended)
./restart_servers.sh status       # screen + ports
./restart_servers.sh stop         # stop everything
./restart_servers.sh --foreground # run in this terminal
```

## Local development

1. Start PostgreSQL and create database `mms` (or match `DATABASE_URL`).
2. Set `JWT_SECRET` in `apps/backend/.env`.
3. From repo root: `pnpm install && ./restart_servers.sh`.
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

## Production (Ubuntu VPS / Hetzner)

Fastify serves **API + SPA** on **`PORT=5002`**. Apache terminates TLS and proxies to `http://127.0.0.1:5002/`.

### First-time server setup

```bash
# On a fresh Ubuntu 22.04/24.04 VPS (as sudo-capable user):
sudo bash scripts/production/bootstrap-ubuntu-vps.sh

# After cloning repo to /var/www/mmsv2 and creating apps/backend/.env:
cd /var/www/mmsv2
pnpm install && pnpm build
bash scripts/production/setup-pm2-startup.sh   # PM2 + boot persistence
bash scripts/apply-production-host-isolation.sh apps/backend/.env

# Daily PostgreSQL backups (cron example):
# 0 3 * * * /var/www/mmsv2/scripts/production/backup-postgres.sh
```

Required `apps/backend/.env` on server: `JWT_SECRET`, `DATABASE_URL`, `PORT=5002`, `NODE_ENV=production`, `MMS_APP_DOMAIN`.

GitHub Actions (`deploy.yml`) deploys after CI on `main`. Set secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY`, `MMS_APP_DOMAIN`.

### Troubleshooting

```bash
bash scripts/server-diagnose.sh apps/backend/.env
bash scripts/fix-apache-upstream.sh apps/backend/.env
curl -fsS http://127.0.0.1:5002/ready   # must be 200 + database connected
```
