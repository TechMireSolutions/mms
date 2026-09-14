# MMS — Agent Guide

Madrasa Management System monorepo. This file is the cross-tool standard: **Cursor**, **Codex**, **Copilot agents**, **Windsurf**, and **Antigravity** read it directly; **Claude Code** reads it through the `@AGENTS.md` import at the top of `CLAUDE.md`.

## Quick commands

```bash
pnpm install && pnpm typecheck
pnpm install && ./restart_servers.sh   # local dev (screen)
bash .agent/skills/mms-dev-setup/scripts/verify-env.sh   # env + services check
node scripts/verify-rules-integrity.mjs                  # rules/skills gate
```

## Layout

```
apps/frontend/     React 19 + Vite 8 · TanStack Query v5 · Tailwind v4
apps/backend/      Fastify 5 + Node.js 24 + PostgreSQL 16 + Drizzle · BullMQ worker
packages/shared/   @mms/shared — types, Zod DTOs, manifests, pure utils (SSOT)
e2e/               Playwright suites + axe helpers
```

## Agent standards layout

```
AGENTS.md            ← this file: the cross-tool source of truth
CLAUDE.md            ← thin wrapper: `@AGENTS.md` import + Claude-only notes
.agent/
  rules/             # canonical rule bodies are edited in .cursor/rules/ and mirrored here
  skills/            # CANONICAL skills (SKILL.md per folder + scripts/ references/ examples/)
  workflows/         # multi-step procedures (invoked as /dev-setup, /feature-module, …)
  scripts/           # sync-all.sh, sync-rules.sh, sync-skills.sh, sync-claude.sh
  skills-manifest.json
.cursor/
  rules/*.mdc        # CANONICAL rule sources (globs + alwaysApply)
  skills/            # generated mirror of .agent/skills/
  hooks.json         # afterFileEdit → format, beforeShellExecution → guard
  commands/          # /dev-setup, /feature-module, /code-review, /dry, /run-tests, /fix-migration-debt
.claude/
  rules/             # generated mirror (paths: frontmatter)
  skills/            # generated mirror
  agents/            # mms-reviewer, mms-explorer, mms-test-triage, mms-docs-auditor
  commands/          # same six workflow commands
  settings.json      # team permissions (deny-list) + hooks
```

Start here in Antigravity: **skill `antigravity-workspace`**.

## Always-on rules (all tools)

| Antigravity | Cursor |
|-------------|--------|
| `rules/mms-agent-universal.md` | `rules/mms-agent-universal.mdc` |
| `rules/mms-core.md` | `rules/mms-core.mdc` |
| `rules/mms-completion-review.md` | `rules/mms-completion-review.mdc` |

**Rule → skill map:** every rule carries a **Workflow skills:** line, and the full ownership matrix lives in [.cursor/rules/README.md](.cursor/rules/README.md) (that file is the single owner of the topic→rule→skill index — do not restate it here).

## Skills (30)

| Skill | Purpose |
|-------|---------|
| `antigravity-workspace` | Where rules/skills live; sync policy |
| `mms-dev-setup` | Install, run, env verify |
| `mms-agent-standards` | Authoring/verifying rules, skills, commands, hooks |
| `mms-dependency-upgrade` | Catalogs, Dependabot, audits, React Compiler |
| `mms-vuln-response` | Triage and respond to a dependency advisory |
| `mms-frontend` | React app shell, apiClient, Query vs localStorage, FE tests |
| `mms-query-factories` | TanStack Query factories / optimistic policy |
| `mms-module-page` | Three-tier module pages + gold-standard parity (§7) |
| `mms-module-work` | Work tier — metrics, directory, drawer, trash |
| `mms-module-setup` | Setup tier — Preferences, sub-tabs, setup audit |
| `mms-background-jobs` | Queued exports/imports, progress, artifacts |
| `mms-queue-ops` | Diagnose stuck/failed BullMQ jobs; replay safely |
| `mms-form-architecture` | Static FormModal, shared Zod, uploads |
| `mms-fields-registry` | Fields & tabs, field guards |
| `mms-data-sync` | db.ts & API sync |
| `mms-backup-restore` | Encrypted backup / wipe-restore |
| `mms-schema-migrate` | Forward-only Drizzle DDL, lock-safe indexes |
| `mms-db-performance` | Query/index/autovacuum triage |
| `mms-linux-compatibility` | Linux/Ubuntu VPS compatibility |
| `mms-shared-package` | `@mms/shared` purity and exports |
| `mms-soft-delete` | Soft-Delete System, 3-tier indexing, restore, outbox CDC, hard-purge |
| `mms-backend-api` | Fastify backend |
| `mms-backend-security` | Tenant isolation, RBAC, cookies, CSRF |
| `mms-audit-trail` | Audit trail, RFC 8785 canonical JSON, sharded hash chains, partitions |
| `mms-finance-accounting` | Invoices, payments, double-entry ledger |
| `mms-reports-export` | Analytics & export |
| `mms-messaging` | SMS/WhatsApp campaigns |
| `mms-migration-fixes` | Open debt priorities P1–P7 |
| `mms-testing-e2e` | Vitest, Playwright E2E & axe smoke |
| `mms-code-review` | Change-set review before merge |
| `mms-a11y-smoke` | axe + shell a11y verification |
| `mms-error-triage` | Sentry issue → traceparent → audit row |
| `mms-incident-response` | Diagnose → rollback → verify a bad deploy |
| `mms-ops-deploy` | Hetzner deploy, Apache isolation, PORT 5002 |
| `mms-release-versioning` | Version bumps, changelog, milestone bookkeeping |
| `mms-settings-i18n` | Settings + i18n (en/ar/ur/fa) |
| `mms-i18n-completeness` | Key parity across en/ar/ur/fa |
| `mms-ui-ux-design` | Design tokens, BiDi / RTL layout, Master Module Scaffold |

Index: [.agent/skills/README.md](.agent/skills/README.md)

## Workflows

[.agent/workflows/](.agent/workflows/) — `dev-setup`, `feature-module`, `code-review`, `fix-migration-debt`, `dry`, `run-tests`. Available as slash commands in Cursor (`.cursor/commands/`) and Claude Code (`.claude/commands/`); Antigravity reads the folder directly.

## Editing standards

**Canonical sources — edit these, never the mirrors:**

| Artifact | Canonical | Generated mirrors |
|---|---|---|
| Rules | `.cursor/rules/*.mdc` | `.agent/rules/*.md`, `.claude/rules/*.md` |
| Skills | `.agent/skills/*/SKILL.md` (+ `scripts/`, `references/`, `examples/`) | `.cursor/skills/`, `.claude/skills/` |
| Workflows | `.agent/workflows/*.md` | `.claude/docs/workflows/` (commands read the canonical path) |
| Docs (this file) | `AGENTS.md` | `CLAUDE.md` imports it |

Rule **bodies** are byte-identical across the three rule trees; only frontmatter differs:

| Tool | Frontmatter |
|------|-------------|
| Cursor | `globs` + `alwaysApply` |
| Antigravity | `trigger: always_on \| model_decision` |
| Claude Code | `paths:` (scoped) or none (always-on) |

Cross-references use `.mdc` in Cursor and `.md` in Antigravity/Claude — the sync script rewrites only rule-name references, never `.cursor/...` paths.

**After editing standards:**

```bash
bash .agent/scripts/sync-all.sh              # regenerate mirrors (add --dry-run for a preview)
node scripts/verify-rules-integrity.mjs      # gate: frontmatter, paths, imports, globs, citations
```

CI fails if the mirrors are out of sync (`git diff --exit-code -- .agent .cursor .claude`) or the verifier reports an error. Both run in `.github/workflows/ci.yml`.

**Enforcement rule** (from `mms-agent-universal.mdc`): a norm is either machine-enforced (lint rule, ratchet script, CI check, hook, test) or explicitly labelled advisory. Land the check with the norm.

**21 rules** (3 always-on + 18 scoped) — index with the per-topic owner: [.cursor/rules/README.md](.cursor/rules/README.md).
