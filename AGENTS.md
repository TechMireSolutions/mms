# MMS — Agent Guide

Madrasa Management System monorepo. For **Cursor** and **Antigravity** (and any agent reading `.agents/`).

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm dev                    # or ./restart_servers.sh
bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
```

## Antigravity layout

```
.agent/              → symlink to .agents/ (Antigravity standard path)
.agents/
  rules/             # behavioural rules (always_on + model_decision)
  skills/            # 13 capability modules (SKILL.md per folder)
  workflows/         # multi-step procedures
  skills-manifest.json
```

Start here in Antigravity: **skill `antigravity-workspace`**

## Cursor layout

```
.cursor/
  rules/             # .mdc rules (alwaysApply + globs)
  skills/            # same skills as .agents/skills/
```

## Always-on rules (both tools)

| Antigravity | Cursor |
|-------------|--------|
| `rules/antigravity-global.md` | `rules/antigravity-global.mdc` |
| `rules/mms-core.md` | `rules/mms-core.mdc` |
| `rules/mms-migration-status.md` | `rules/mms-migration-status.mdc` |

## Skills (13)

| Skill | Purpose |
|-------|---------|
| `antigravity-workspace` | Where rules/skills live; sync policy |
| `mms-dev-setup` | Install, run, env verify |
| `mms-frontend` | React app shell, apiClient, Query vs localStorage, FE tests |
| `mms-module-page` | Three-tier module pages |
| `mms-contacts` | Contact CRM module |
| `mms-fields-registry` | Fields & tabs |
| `mms-data-sync` | db.ts & API sync |
| `mms-auth-users` | Auth & users |
| `mms-shared-package` | `@mms/shared` |
| `mms-backend-api` | Fastify backend |
| `mms-reports-export` | Analytics & export |
| `mms-migration-fixes` | Tech debt fixes |
| `mms-code-review` | PR review |

Index: [.agents/skills/README.md](.agents/skills/README.md)

## Workflows (Antigravity)

[.agents/workflows/](.agents/workflows/) — `dev-setup`, `feature-module`, `code-review`, `fix-migration-debt`

## Sync policy

When editing standards, update **both**:

1. `.cursor/rules/` and `.cursor/skills/`
2. `.agents/rules/` and `.agents/skills/`

Rule **bodies** must stay identical between `.cursor/rules/*.mdc` and `.agents/rules/*.md`. Only frontmatter differs: Cursor uses `globs` + `alwaysApply`; Antigravity uses `trigger` (`always_on` | `model_decision`). Cross-references use `.mdc` in Cursor, `.md` in Antigravity.

Sync after `.mdc` edits: `bash .agents/scripts/sync-rules.sh`

**31 rules** (3 always-on + 28 scoped): product (`mms-ui-*`, `mms-fields`, `mms-contact-link`, …), platform (`mms-security`, `mms-testing`, `mms-observability`, `mms-a11y`). Index: `.cursor/rules/README.md`.

**Rule index:** [.cursor/rules/README.md](.cursor/rules/README.md) — canonical owner per topic (avoids duplicating tier/isolation/i18n prose).

**Scoped highlights:** `mms-module-isolation`, `mms-i18n` (en/ar/ur/fa), `mms-tenant`, `mms-rbac`, `mms-ci`, `mms-query`.

## Layout

```
apps/frontend/     React 19 + Vite
apps/backend/      Fastify + PostgreSQL
packages/shared/   @mms/shared
```
