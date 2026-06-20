# MMS — Agent Guide

Madrasa Management System monorepo. For **Cursor**, **Antigravity**, **Claude Code**, and any agent reading `.agents/`.

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm install && ./restart_servers.sh   # local dev (screen)
bash .agents/skills/mms-dev-setup/scripts/verify-env.sh
```

## Antigravity layout

```
.agent/              → symlink to .agents/ (Antigravity standard path)
.agents/
  rules/             # behavioural rules (always_on + model_decision)
  skills/            # 15 capability modules (SKILL.md per folder)
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

## Claude Code layout

```
CLAUDE.md            # Session entry (points here + sync commands)
.claude/
  rules/             # path-scoped .md rules (synced from .cursor/rules)
  skills/            # same skills as .agents/skills/
  settings.json      # permissions template (team defaults)
  docs/workflows/    # reference copies of .agents/workflows/
```

## Always-on rules (both tools)

| Antigravity | Cursor |
|-------------|--------|
| `rules/antigravity-global.md` | `rules/antigravity-global.mdc` |
| `rules/mms-core.md` | `rules/mms-core.mdc` |
| `rules/mms-migration-status.md` | `rules/mms-migration-status.mdc` |
| `rules/mms-dependencies.md` | `rules/mms-dependencies.mdc` |
| `rules/mms-dry.md` | `rules/mms-dry.mdc` |

Engineering layout & naming (file-scoped): `mms-structure.md`, `mms-naming.md`.

## Skills (15)

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
| `mms-backend-security` | Tenant isolation, RBAC, cookies, rate limits |
| `mms-ops-deploy` | Hetzner deploy, Apache, PORT 5002, GitHub Actions |
| `mms-reports-export` | Analytics & export |
| `mms-migration-fixes` | Tech debt fixes |
| `mms-code-review` | PR review |

Index: [.agents/skills/README.md](.agents/skills/README.md)

## Workflows (Antigravity)

[.agents/workflows/](.agents/workflows/) — `dev-setup`, `feature-module`, `code-review`, `fix-migration-debt`

## Sync policy

When editing standards, update **both**:

1. `.cursor/rules/` and `.cursor/skills/` (or edit skills in `.agents/skills/` first)
2. `.agents/rules/` and `.agents/skills/` (Antigravity)
3. `.claude/rules/` and `.claude/skills/` (Claude Code)

Rule **bodies** must stay identical between `.cursor/rules/*.mdc`, `.agents/rules/*.md`, and `.claude/rules/*.md`. Only frontmatter differs:

| Tool | Frontmatter |
|------|-------------|
| Cursor | `globs` + `alwaysApply` |
| Antigravity | `trigger: always_on \| model_decision` |
| Claude Code | `paths:` (scoped) or none (always-on) |

Cross-references use `.mdc` in Cursor, `.md` in Antigravity and Claude.

**One command after rule/skill edits:**

```bash
bash .agents/scripts/sync-all.sh
```

Individual targets: `sync-rules.sh` (→ Antigravity), `sync-skills.sh` (→ Cursor), `sync-claude.sh` (→ Claude).

**37 rules** (6 always-on + 31 scoped): product (`mms-ui-*`, `mms-fields`, `mms-structure`, `mms-naming`, …), platform (`mms-dependencies`, `mms-dry`, `mms-security`, `mms-completion-review`, …). Index: `.cursor/rules/README.md`.

**Rule index:** [.cursor/rules/README.md](.cursor/rules/README.md) — canonical owner per topic (avoids duplicating tier/isolation/i18n prose).

**Scoped highlights:** `mms-module-isolation`, `mms-i18n` (en/ar/ur/fa), `mms-tenant`, `mms-rbac`, `mms-ci`, `mms-query`.

## Layout

```
apps/frontend/     React 19 + Vite
apps/backend/      Fastify + PostgreSQL
packages/shared/   @mms/shared
```
