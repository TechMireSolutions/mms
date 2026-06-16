---
name: mms-dev-setup
description: Sets up and runs the MMS monorepo (pnpm, PostgreSQL, backend :3000, frontend :5173, typecheck, lint, tests). Use when installing dependencies, starting dev servers, fixing env issues, or onboarding to the project.
---

# MMS Dev Setup

## Quick start

```bash
# From repo root
pnpm install
pnpm dev                         # turbo: backend + frontend (foreground)
./restart_servers.sh             # recommended: Postgres + restart + health check
./restart_servers.sh status      # verify :3000 / :5173
./restart_servers.sh --quick     # skip cache clear / health wait
./scripts/stop_servers.sh        # stop servers started by restart script
```

Run `./restart_servers.sh` in a **dedicated terminal** if processes die when the agent shell exits.

## Verify environment

```bash
bash .cursor/skills/mms-dev-setup/scripts/verify-env.sh
curl http://localhost:3000/health
curl http://localhost:3000/ready    # 503 if PostgreSQL down
```

## Required env (backend)

Create `apps/backend/.env` (never commit):

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | **Required** — server exits without it (e.g. `dev-local-change-me`) |
| `DATABASE_URL` | Default `postgresql://postgres:postgres@localhost:5432/mms` |

Frontend uses Vite proxy `/api` → `:3000` with `credentials: 'include'` for cookie auth.

## PostgreSQL

```bash
docker start mms-postgres    # or let restart_servers.sh start it
```

- Empty DB may seed from `seeds.json` (legacy demo)
- New tenant onboard uses `minimalSeeds.ts` — not 30k-line demo data

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

`.cursor/rules/mms-ops.mdc`, `mms-core.mdc`, `mms-backend.mdc`

## Related skills

`mms-backend-api`, `mms-auth-users`, `mms-data-sync`
