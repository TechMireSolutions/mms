---
name: mms-dev-setup
description: Sets up and runs the MMS monorepo (pnpm, Node 26+, PostgreSQL, backend :3000, frontend :5173, typecheck, lint, tests). Use when installing dependencies, starting dev servers, fixing env issues, or onboarding to the project.
---

# MMS Dev Setup

## Quick start

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
pnpm test                   # shared + backend + frontend Vitest
cd apps/frontend && pnpm lint && pnpm typecheck
cd apps/backend && pnpm typecheck && pnpm test && pnpm lint
```

## Layout

```
apps/frontend/   React 19 + Vite (:5173)
apps/backend/    Fastify 5 + PostgreSQL (:3000)
packages/shared/ @mms/shared
```

## Rules reference

`.cursor/rules/mms-ops-infrastructure.mdc`, `mms-core.mdc`, `mms-api-interface.mdc`

## Related skills

`mms-backend-api`, `mms-backend-security`, `mms-data-sync`
