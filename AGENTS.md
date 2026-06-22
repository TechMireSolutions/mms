# MMS — Agent Guide

Madrasa Management System monorepo. For **Cursor**, **Antigravity**, **Claude Code**, and any agent reading `.agent/`.

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm install && ./restart_servers.sh   # local dev (screen)
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh
```

## Agent layout

```
.agent/
  rules/             # behavioural rules (always_on + model_decision)
  skills/            # 16 capability modules (SKILL.md per folder)
  workflows/         # multi-step procedures
  skills-manifest.json
```

Start here in Antigravity: **skill `antigravity-workspace`**

## Cursor layout

```
.cursor/
  rules/             # .mdc rules (alwaysApply + globs)
  skills/            # same skills as .agent/skills/
```

## Claude Code layout

```
CLAUDE.md            # Session entry (points here + sync commands)
.claude/
  rules/             # path-scoped .md rules (synced from .cursor/rules)
  skills/            # same skills as .agent/skills/
  settings.json      # permissions template (team defaults)
  docs/workflows/    # reference copies of .agent/workflows/
```

## Always-on rules (both tools)

| Antigravity | Cursor |
|-------------|--------|
| `rules/antigravity-global.md` | `rules/antigravity-global.mdc` |
| `rules/mms-core.md` | `rules/mms-core.mdc` |
| `rules/mms-migration-status.md` | `rules/mms-migration-status.mdc` |
| `rules/mms-dependencies.md` | `rules/mms-dependencies.mdc` |
| `rules/mms-dry.md` | `rules/mms-dry.mdc` |
| `rules/mms-completion-review.md` | `rules/mms-completion-review.mdc` |

Engineering layout & naming (file-scoped): `mms-structure.md`, `mms-naming.md`.

## Skills (18)

| Skill | Purpose |
|-------|---------|
| `antigravity-workspace` | Where rules/skills live; sync policy |
| `mms-dev-setup` | Install, run, env verify |
| `mms-frontend` | React app shell, apiClient, Query vs localStorage, FE tests |
| `mms-module-page` | Three-tier module pages per `globle.md` |
| `mms-module-work` | Command centre and Work tab — metrics, directory, drawer, bulk actions |
| `mms-module-setup` | Module Setup tier — Fields, Preferences, audit (`globle.md` §5–§7) |
| `mms-background-jobs` | Queued processing — exports, imports, dedup scans, progress, artifacts |
| `mms-contacts` | Contact CRM — `globle.md` reference module |
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

Index: [.agent/skills/README.md](.agent/skills/README.md)

## Workflows (Antigravity)

[.agent/workflows/](.agent/workflows/) — `dev-setup`, `feature-module`, `code-review`, `fix-migration-debt`

## Sync policy

When editing standards, update **both**:

1. `.cursor/rules/` and `.cursor/skills/` (or edit skills in `.agent/skills/` first)
2. `.agent/rules/` and `.agent/skills/` (Antigravity)
3. `.claude/rules/` and `.claude/skills/` (Claude Code)

Rule **bodies** must stay identical between `.cursor/rules/*.mdc`, `.agent/rules/*.md`, and `.claude/rules/*.md`. Only frontmatter differs:

| Tool | Frontmatter |
|------|-------------|
| Cursor | `globs` + `alwaysApply` |
| Antigravity | `trigger: always_on \| model_decision` |
| Claude Code | `paths:` (scoped) or none (always-on) |

Cross-references use `.mdc` in Cursor, `.md` in Antigravity and Claude.

**One command after rule/skill edits:**

```bash
bash .agent/scripts/sync-all.sh
```

Individual targets: `sync-rules.sh` (→ Antigravity), `sync-skills.sh` (→ Cursor), `sync-claude.sh` (→ Claude).

**42 rules** (6 always-on + 36 scoped): product (`mms-ui-*`, `mms-fields`, `mms-module-architecture`, `mms-module-work`, `mms-module-setup`, `mms-module-crosscutting`, `mms-background-jobs`, ...), platform (`mms-dependencies`, `mms-dry`, `mms-security`, …). Index: `.cursor/rules/README.md`.

**Rule index:** [.cursor/rules/README.md](.cursor/rules/README.md) — canonical owner per topic (avoids duplicating tier/isolation/i18n prose).

**Scoped highlights:** `mms-module-isolation`, `mms-i18n` (en/ar/ur/fa), `mms-tenant`, `mms-rbac`, `mms-ci`, `mms-query`.

## Layout

```
apps/frontend/     React 19 + Vite
apps/backend/      Fastify + PostgreSQL
packages/shared/   @mms/shared
```
