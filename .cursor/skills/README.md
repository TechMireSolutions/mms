# MMS Project Skills

Agent skills for Cursor, Antigravity, and Claude Code. Cursor/Claude discover these from `description` frontmatter; Antigravity reads `.agent/skills/`.

**Antigravity:** start with [antigravity-workspace](antigravity-workspace/SKILL.md). Manifest: [.agent/skills-manifest.json](../skills-manifest.json)

## Skills index

| Skill | Use when |
|-------|----------|
| [antigravity-workspace](antigravity-workspace/SKILL.md) | Antigravity orientation, rules/skills sync |
| [mms-dev-setup](mms-dev-setup/SKILL.md) | Install, run servers, env, typecheck |
| [mms-frontend](mms-frontend/SKILL.md) | Frontend pages, hooks, apiClient, Vite, FE tests |
| [mms-module-page](mms-module-page/SKILL.md) | New module or three-tier page — `mms-module-architecture.mdc` |
| [mms-module-work](mms-module-work/SKILL.md) | Command centre and Work tier — metrics, directory, drawer, bulk actions (`mms-module-architecture.mdc` §2–§3) |
| [mms-module-setup](mms-module-setup/SKILL.md) | Module Setup tier — Fields, Preferences, audit, field guards (`mms-module-architecture.mdc` §4, `mms-fields.mdc`) |
| [mms-background-jobs](mms-background-jobs/SKILL.md) | Queued processing — large exports, imports, bulk ops, dedup scans, progress, artifacts (`mms-module-architecture.mdc` §5) |
| [mms-form-architecture](mms-form-architecture/SKILL.md) | Blueprint schemas, branded IDs, IEEE 754 math bypass, tenant RLS transaction, JSONB deep merge, React 19 inputs, S3 uploads |
| [mms-fields-registry](mms-fields-registry/SKILL.md) | Custom fields, tabs, column registry |
| [mms-data-sync](mms-data-sync/SKILL.md) | db.ts, sync API (admin GET), REST vs collections, Query cache |
| [mms-shared-package](mms-shared-package/SKILL.md) | `@mms/shared` types and utils |
| [mms-backend-api](mms-backend-api/SKILL.md) | Fastify routes, middleware, Zod, migrations, inject tests |
| [mms-backend-security](mms-backend-security/SKILL.md) | Tenant isolation, RBAC, cookies, auth artifacts, rate limits |
| [mms-reports-export](mms-reports-export/SKILL.md) | Analytics, charts, PDF/Excel |
| [mms-migration-fixes](mms-migration-fixes/SKILL.md) | Known tech debt from migration-status |
| [mms-code-review](mms-code-review/SKILL.md) | PR / change review against MMS standards |
| [mms-ops-deploy](mms-ops-deploy/SKILL.md) | Hetzner deploy, Apache isolation, PORT 5002, GitHub Actions |
| [mms-linux-compatibility](mms-linux-compatibility/SKILL.md) | Enforce and check Linux/Ubuntu VPS compatibility (casing, line endings, permissions, PM2) |

## Rules vs skills

| Layer | Location | Behavior |
|-------|----------|----------|
| **Rules** | `.cursor/rules/*.md` | Auto-applied (always or by glob) |
| **Skills** | `.cursor/skills/*/SKILL.md` | Invoked when description matches task |

Always-on rules: `antigravity-global`, `mms-core`, `mms-migration-status`, `mms-dependencies`, `mms-dry`, `mms-completion-review`.

Frontend work: rules `mms-api-interface`, `mms-data-layer`, `mms-hooks`, `mms-ui-ux-design`, `mms-settings-i18n` + skill **`mms-frontend`** (includes `/settings` page patterns).

## Verify setup

```bash
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
pnpm install && pnpm typecheck && pnpm test
```

## Antigravity / Claude / Cursor mirror

| Tool | Skills path |
|------|-------------|
| Antigravity | `.agent/skills/` (canonical) |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |

Identical skill folders in all three. Workflows in `.agent/workflows/` (Claude reference: `.claude/docs/workflows/`). Rules in `.agent/rules/`, `.cursor/rules/`, `.claude/rules/`.

After editing skills or rules:

```bash
bash .agent/scripts/sync-all.sh
```
