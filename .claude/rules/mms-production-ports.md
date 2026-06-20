---
description: Production listen ports — Hetzner must not use dev ports 3000/3001
paths:
  - "scripts/**/*.sh"
  - "scripts/apache/**"
  - "apps/backend/src/index.ts"
  - "apps/backend/.env.example"
  - "apps/backend/Dockerfile"
  - ".github/workflows/deploy.yml"
---

# MMS Production Ports

Hetzner and any `NODE_ENV=production` host **must not** bind the backend to ports **3000** or **3001**. Those are local dev defaults (`restart_servers.sh`, Vite proxy).

## Canonical values

| Context | Port | Owner |
|---------|------|-------|
| **Production backend** | `5002` | `MMS_PRODUCTION_BACKEND_PORT` in `@mms/shared` · `MMS_PROD_BACKEND_PORT` in `scripts/lib/deploy-ports.sh` |
| **Local dev backend** | `3000` | `MMS_BACKEND_PORT` / `restart_servers.sh` |
| **Local dev frontend** | `5173` | Vite dev server |

## Rules

| Rule | Detail |
|------|--------|
| Forbidden on prod | `3000`, `3001` — server **must exit** if `NODE_ENV=production` and `PORT` is either |
| Deploy env merge | `scripts/merge-backend-env.sh` always writes `PORT=5002` |
| Apache upstream | `ProxyPass` → `http://127.0.0.1:5002/` only (`scripts/fix-apache-upstream.sh`) |
| PM2 / deploy scripts | Export `PORT=5002` before restart; run `assert_production_backend_port` |
| Docker production | `ENV PORT=5002`, `EXPOSE 5002` — never `-p 3000:3000` on Hetzner |

## Enforcement (code)

- `@mms/shared` — `resolveBackendListenPort()`, `productionPortViolation()`, `MMS_PRODUCTION_FORBIDDEN_PORTS`
- `apps/backend/src/index.ts` — calls `resolveBackendListenPort()` at startup
- `scripts/lib/deploy-ports.sh` — `assert_production_backend_port` for deploy/diagnose scripts

## Do not

- Set `PORT=3000` or `PORT=3001` in `apps/backend/.env` on the server
- Point Apache `ProxyPass` at `:3000` or `:3001`
- Document Hetzner health checks against `:3000` — use `:5002` locally on the host (`curl http://127.0.0.1:5002/health`)

Dev docs (`mms-ops.md`, `mms-dev-setup` skill) may still reference `:3000` for **local** workflows only.
