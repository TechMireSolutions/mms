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
  skills/            # 25 capability modules (SKILL.md per folder)
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
| `rules/mms-completion-review.md` | `rules/mms-completion-review.mdc` |

Scoped: `mms-dry` (shared/hooks/features), `mms-dependencies` (package/CI/Docker), `mms-structure-naming` (layout/size bands).

**Rule → skill map:** each rule has a **Workflow skill:** line; full matrix in `mms-core` Standards index (rules = norms; skills = how-to).

| Skill | Purpose |
|-------|---------|
| `antigravity-workspace` | Where rules/skills live; sync policy |
| `mms-dev-setup` | Install, run, env verify |
| `mms-dependency-upgrade` | Catalogs, Dependabot, audits, React Compiler |
| `mms-frontend` | React app shell, apiClient, Query vs localStorage, FE tests |
| `mms-query-factories` | TanStack Query factories / optimistic policy |
| `mms-module-page` | Three-tier module pages + gold-standard parity (§7) |
| `mms-module-work` | Work tier — metrics, directory, drawer, trash |
| `mms-module-setup` | Setup tier — Fields, Preferences, field guards |
| `mms-background-jobs` | Queued exports/imports, progress, artifacts |
| `mms-form-architecture` | Static FormModal, shared Zod, uploads |
| `mms-fields-registry` | Fields & tabs |
| `mms-data-sync` | db.ts & API sync |
| `mms-backup-restore` | Encrypted backup / wipe-restore |
| `mms-schema-migrate` | Forward-only Drizzle DDL |
| `mms-linux-compatibility` | Linux/Ubuntu VPS compatibility |
| `mms-shared-package` | `@mms/shared` |
| `mms-backend-api` | Fastify backend |
| `mms-backend-security` | Tenant isolation, RBAC, cookies, CSRF |
| `mms-finance-accounting` | Invoices, payments, double-entry ledger |
| `mms-reports-export` | Analytics & export |
| `mms-messaging` | SMS/WhatsApp campaigns |
| `mms-migration-fixes` | Tech debt fixes |
| `mms-testing-e2e` | Vitest, MSW, Playwright E2E & smoke |
| `mms-code-review` | PR review |
| `mms-a11y-smoke` | axe + shell a11y verify |
| `mms-settings-i18n` | Settings + i18n (en/ar/ur/fa) |

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

**20 rules** (4 always-on + 16 scoped): product (`mms-ui-ux-design`, `mms-fields`, `mms-module-architecture`, `mms-form-architecture`, `mms-messaging`, ...), platform (`mms-dependencies`, `mms-dry`, `mms-auth-security`, ...). Index: `.cursor/rules/README.md`.

**Rule index:** [.cursor/rules/README.md](.cursor/rules/README.md) — canonical owner per topic (avoids duplicating tier/isolation/i18n prose).

**Scoped highlights:** `mms-module-architecture`, `mms-settings-i18n` (en/ar/ur/fa), `mms-auth-security`, `mms-ops-infrastructure`, `mms-data-layer`, `mms-messaging`.

## Layout

```
apps/frontend/     React 19 + Vite
apps/backend/      Fastify + PostgreSQL
packages/shared/   @mms/shared
```
