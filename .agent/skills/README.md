# MMS Project Skills

Agent skills for Cursor, Antigravity, and Claude Code. Cursor/Claude discover these from `description` frontmatter; Antigravity reads `.agent/skills/` (symlink → `.agents/skills/`).

**Antigravity:** start with [antigravity-workspace](antigravity-workspace/SKILL.md). Manifest: [.agents/skills-manifest.json](../.agents/skills-manifest.json)

## Skills index

| Skill | Use when |
|-------|----------|
| [antigravity-workspace](antigravity-workspace/SKILL.md) | Antigravity orientation, rules/skills sync |
| [mms-dev-setup](mms-dev-setup/SKILL.md) | Install, run servers, env, typecheck |
| [mms-frontend](mms-frontend/SKILL.md) | Frontend pages, hooks, apiClient, Vite, FE tests |
| [mms-module-page](mms-module-page/SKILL.md) | New module or three-tier page — `globle1.md` + `globle2.md` |
| [mms-module-work](mms-module-work/SKILL.md) | Command centre and Work tier — metrics, directory, drawer, bulk actions (`globle1.md` §2–§3) |
| [mms-module-setup](mms-module-setup/SKILL.md) | Module Setup tier — Fields, Preferences, audit, field guards (`globle2.md` §5–§7) |
| [mms-background-jobs](mms-background-jobs/SKILL.md) | Queued processing — large exports, imports, bulk ops, dedup scans, progress, artifacts (`globle2.md` §8) |
| [mms-contacts](mms-contacts/SKILL.md) | Contact CRM — **globle1 reference module** (contract, dedup, soft delete, RBAC, sync outbox) |
| [mms-fields-registry](mms-fields-registry/SKILL.md) | Custom fields, tabs, column registry |
| [mms-data-sync](mms-data-sync/SKILL.md) | db.ts, sync API (admin GET), REST vs collections, Query cache |
| [mms-auth-users](mms-auth-users/SKILL.md) | Cookies, auth artifacts, 2FA, `authenticateTenant`, users |
| [mms-shared-package](mms-shared-package/SKILL.md) | `@mms/shared` types and utils |
| [mms-backend-api](mms-backend-api/SKILL.md) | Fastify routes, middleware, Zod, migrations, inject tests |
| [mms-backend-security](mms-backend-security/SKILL.md) | Tenant isolation, RBAC, cookies, auth artifacts, rate limits |
| [mms-reports-export](mms-reports-export/SKILL.md) | Analytics, charts, PDF/Excel |
| [mms-migration-fixes](mms-migration-fixes/SKILL.md) | Known tech debt from migration-status |
| [mms-code-review](mms-code-review/SKILL.md) | PR / change review against MMS standards |
| [mms-ops-deploy](mms-ops-deploy/SKILL.md) | Hetzner deploy, Apache isolation, PORT 5002, GitHub Actions |

## Rules vs skills

| Layer | Location | Behavior |
|-------|----------|----------|
| **Rules** | `.cursor/rules/*.mdc` | Auto-applied (always or by glob) |
| **Skills** | `.cursor/skills/*/SKILL.md` | Invoked when description matches task |

Always-on rules: `antigravity-global`, `mms-core`, `mms-migration-status`, `mms-dependencies`, `mms-dry`.

Frontend work: rules `mms-frontend`, `mms-query`, `mms-hooks`, `mms-ui-*`, `mms-settings-navigation`, `mms-config` + skill **`mms-frontend`** (includes `/settings` page patterns).

## Verify setup

```bash
bash .cursor/skills/mms-dev-setup/scripts/verify-env.sh
pnpm install && pnpm typecheck && pnpm test
```

## Antigravity / Claude / Cursor mirror

| Tool | Skills path |
|------|-------------|
| Antigravity | `.agents/skills/` (canonical) |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |

Identical skill folders in all three. Workflows in `.agents/workflows/` (Claude reference: `.claude/docs/workflows/`). Rules in `.agents/rules/`, `.cursor/rules/`, `.claude/rules/`.

After editing skills or rules:

```bash
bash .agents/scripts/sync-all.sh
```
