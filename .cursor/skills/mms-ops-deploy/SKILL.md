---
name: mms-ops-deploy
description: MMS production deploy on Hetzner — Apache vhost isolation, PORT=5002, MMS_APP_DOMAIN, GitHub Actions, PM2, merge-backend-env. Use when fixing production server, deploy failures, wrong domain routing, or Apache ProxyPass.
---

# MMS Ops & Production Deploy

## Domains

| Host | Role |
|------|------|
| `MMS_APP_DOMAIN` (e.g. `mmsv2.aabtaab.com`) | Platform apex — onboarding, platform auth |
| `{slug}.MMS_APP_DOMAIN` | Tenant madrasa workspaces |
| Other vhosts (`aabtaab.com`, etc.) | **Must not** proxy to MMS |

Set full hostname in GitHub secret **`MMS_APP_DOMAIN`** — not the root domain alone.

**Tenant subdomains need three layers:**

| Layer | Requirement |
|-------|-------------|
| DNS | `A` or `CNAME` for apex **and** `*.MMS_APP_DOMAIN` → server IP |
| TLS | Wildcard cert covering `*.MMS_APP_DOMAIN` (HTTP-01 certbot cannot issue wildcards — use DNS challenge) |
| Apache | `mmsv2.conf` with `ServerAlias *.MMS_APP_DOMAIN` → `:5002` |

Symptom → likely cause:

| Symptom | Fix |
|---------|-----|
| Browser “can’t find server” / NXDOMAIN | Add `*.your-platform.example.com` DNS |
| SSL certificate error on `{slug}.…` | Issue wildcard cert (DNS challenge) |
| Wrong site or 404 on subdomain | Re-run `apply-production-host-isolation.sh` |
| Page loads but “Workspace not found” | Madrasa not in DB — check registry; slug must match |
| Tenant login 403 | Open tenant URL on `{slug}.MMS_APP_DOMAIN`, not apex |

## Ports (`mms-production-ports`)

| Context | Port |
|---------|------|
| Production backend | **5002** (Apache → `127.0.0.1:5002`) |
| Local dev backend | 3000 |
| Forbidden on prod | 3000, 3001 |

## Server scripts (`/var/www/mmsv2`)

```bash
bash scripts/merge-backend-env.sh apps/backend/.env
bash scripts/apply-production-host-isolation.sh apps/backend/.env
bash scripts/deploy-on-server.sh          # expects DEPLOY_SHA + /tmp/mms-dist.tar.gz
bash scripts/deploy-rollback.sh [sha|list]
bash scripts/server-diagnose.sh apps/backend/.env
bash scripts/verify-tenant-hosts.sh [subdomain] apps/backend/.env
bash scripts/check-workspace.sh <subdomain> apps/backend/.env
```

**First-time VPS:** `sudo bash scripts/production/bootstrap-ubuntu-vps.sh` (Node **24**, pnpm **11.15.1** — match `engines` / `packageManager`)  
**PM2 boot persistence:** `bash scripts/production/setup-pm2-startup.sh`  
**DB backups:** `bash scripts/production/backup-postgres.sh` (cron daily)

Process manager: `ecosystem.config.cjs` — single `mmsv2-backend` (SPA served by Fastify; no separate frontend PM2).  
`scripts/deploy-recover-frontend.sh` is **legacy** (vite preview) — do not use in normal deploys.

**Schema migrations:** run on backend startup (`initDb` / Drizzle) — not a separate deploy step.

Apache-only fix:

```bash
bash scripts/apache/isolate-mms-vhost.sh apps/backend/.env
bash scripts/apache/install-mms-vhost.sh apps/backend/.env
sudo bash scripts/fix-apache-upstream.sh apps/backend/.env
# Or force on next deploy: MMS_FORCE_APACHE=1
```

## GitHub Actions

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Parallel typecheck/lint ∥ unit ∥ e2e; on main push also `build-dist` → `mms-dist` artifact |
| `deploy.yml` | Download CI artifact (or build on `workflow_dispatch`) → SCP → `deploy-on-server.sh` at `DEPLOY_SHA` |
| `production-apache-isolate.yml` | manual — strip MMS from foreign vhosts |

Required secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY`, `MMS_APP_DOMAIN`.

**Do not set `MMS_API_URL`.** The platform is served at `https://${MMS_APP_DOMAIN}` (apex + `*.${MMS_APP_DOMAIN}` tenants). A legacy `MMS_API_URL` secret (e.g. `mmsv2-api.…`) caused deploy health checks to fail; deploy scripts strip it from server `.env` on merge.

### Deploy optimisations (server)

| Flag / file | Behaviour |
|-------------|-----------|
| `DEPLOY_SHA` | Detached checkout of CI-validated commit |
| `.deploy-lock-hash` | Skip `pnpm install --prod` when lockfile unchanged (`MMS_FORCE_PNPM_INSTALL=1` to force) |
| `.deploy-apache-fingerprint` | Skip Apache isolate/install/fix when unchanged (`MMS_FORCE_APACHE=1` to force) |
| `.deploy-releases/` | Last N tarballs for `deploy-rollback.sh` |
| `MMS_DEPLOY_SKIP_PUBLIC_VERIFY=1` | Server verify stays local; public gate in `deploy.yml` |

## Verify production

```bash
curl -fsS "https://${MMS_APP_DOMAIN}/health"
curl -fsS "https://${MMS_APP_DOMAIN}/ready"
curl -fsS "https://${MMS_APP_DOMAIN}/api/public/deployment-config"
curl -fsS "https://${MMS_APP_DOMAIN}/api/platform/auth/setup/status"  # not 403
bash scripts/verify-tenant-hosts.sh dar-ul-quran apps/backend/.env   # on server
curl -fsS "https://dar-ul-quran.${MMS_APP_DOMAIN}/health"            # replace slug
```

## Rules

`mms-ops-infrastructure.mdc`, `mms-auth-security.mdc` (Cursor mirrors use `.mdc` — sync docs only; agent canon is `.md`)

## Related skills

`mms-dev-setup`, `mms-backend-api`, `mms-backend-security`
