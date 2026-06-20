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
bash scripts/deploy-on-server.sh
bash scripts/server-diagnose.sh apps/backend/.env
bash scripts/verify-tenant-hosts.sh [subdomain] apps/backend/.env
bash scripts/check-workspace.sh <subdomain> apps/backend/.env
```

**First-time VPS:** `sudo bash scripts/production/bootstrap-ubuntu-vps.sh`  
**PM2 boot persistence:** `bash scripts/production/setup-pm2-startup.sh`  
**DB backups:** `bash scripts/production/backup-postgres.sh` (cron daily)

Process manager: `ecosystem.config.cjs` — single `mmsv2-backend` (SPA served by Fastify; no separate frontend PM2).

Apache-only fix:

```bash
bash scripts/apache/isolate-mms-vhost.sh apps/backend/.env
bash scripts/apache/install-mms-vhost.sh apps/backend/.env
sudo bash scripts/fix-apache-upstream.sh apps/backend/.env
```

## GitHub Actions

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | typecheck, test, lint, e2e |
| `deploy.yml` | build tarball → SSH → `deploy-on-server.sh` (after CI on main) |
| `production-apache-isolate.yml` | manual — strip MMS from foreign vhosts |

Required secrets: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY`, `MMS_APP_DOMAIN`.

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

`.cursor/rules/mms-ops.mdc`, `mms-production-ports.mdc`, `mms-security.mdc`

## Related skills

`mms-dev-setup`, `mms-backend-api`, `mms-backend-security`
