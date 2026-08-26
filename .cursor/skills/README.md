# MMS Project Skills

Agent skills for Cursor, Antigravity, and Claude Code. Cursor/Claude discover these from `description` frontmatter; Antigravity reads `.agent/skills/`.

**Antigravity:** start with [antigravity-workspace](antigravity-workspace/SKILL.md). Manifest: [.agent/skills-manifest.json](../skills-manifest.json)

## Skills index (28)

| Skill | Use when |
|-------|----------|
| [antigravity-workspace](antigravity-workspace/SKILL.md) | Antigravity orientation, rules/skills sync |
| [mms-dev-setup](mms-dev-setup/SKILL.md) | Install, run servers, env, typecheck |
| [mms-dependency-upgrade](mms-dependency-upgrade/SKILL.md) | Catalogs, Dependabot, audits, React Compiler enablement |
| [mms-frontend](mms-frontend/SKILL.md) | Frontend pages, hooks, apiClient, Vite, FE tests |
| [mms-query-factories](mms-query-factories/SKILL.md) | TanStack Query `queryOptions` / mutations / optimistic policy |
| [mms-module-page](mms-module-page/SKILL.md) | New module or three-tier page — `mms-module-architecture.mdc` (incl. §7) |
| [mms-module-work](mms-module-work/SKILL.md) | Command centre and Work tier — directory, drawer, trash |
| [mms-module-setup](mms-module-setup/SKILL.md) | Module Setup — Fields, Preferences, field guards |
| [mms-background-jobs](mms-background-jobs/SKILL.md) | Queued exports/imports, progress, artifacts |
| [mms-form-architecture](mms-form-architecture/SKILL.md) | Static FormModal, shared Zod, uploads |
| [mms-fields-registry](mms-fields-registry/SKILL.md) | Custom fields, tabs, column registry |
| [mms-data-sync](mms-data-sync/SKILL.md) | Legacy `/api/db` + db.ts (non-migrated keys only) |
| [mms-backup-restore](mms-backup-restore/SKILL.md) | Encrypted backup / wipe-restore validate-before-wipe |
| [mms-schema-migrate](mms-schema-migrate/SKILL.md) | Forward-only Drizzle DDL, FORCE RLS, ban db push |
| [mms-shared-package](mms-shared-package/SKILL.md) | `@mms/shared` types and utils |
| [mms-backend-api](mms-backend-api/SKILL.md) | Fastify routes, middleware, Zod, inject tests |
| [mms-backend-security](mms-backend-security/SKILL.md) | Tenant isolation, RBAC, cookies, CSRF/Origin, rate limits |
| [mms-finance-accounting](mms-finance-accounting/SKILL.md) | Invoices, payments, double-entry ledger, accounts, fiscal years |
| [mms-reports-export](mms-reports-export/SKILL.md) | Analytics, charts, PDF/Excel |
| [mms-messaging](mms-messaging/SKILL.md) | SMS/WhatsApp campaigns, MessageComposer, logs |
| [mms-migration-fixes](mms-migration-fixes/SKILL.md) | Known tech debt from migration-status |
| [mms-testing-e2e](mms-testing-e2e/SKILL.md) | Vitest, MSW network mocking, Playwright E2E, responsive & RTL smoke |
| [mms-code-review](mms-code-review/SKILL.md) | PR / change review against MMS standards |
| [mms-a11y-smoke](mms-a11y-smoke/SKILL.md) | axe smoke, focus-return, shell a11y verify |
| [mms-ops-deploy](mms-ops-deploy/SKILL.md) | Hetzner deploy, Apache isolation, PORT 5002 |
| [mms-linux-compatibility](mms-linux-compatibility/SKILL.md) | Linux/Ubuntu VPS casing, line endings, PM2 |
| [mms-settings-i18n](mms-settings-i18n/SKILL.md) | `/settings`, nav registries, i18n (en/ar/ur/fa) |
| [mms-ui-ux-design](mms-ui-ux-design/SKILL.md) | Design tokens, BiDi / RTL layout, Master Module Scaffold |

## Rules vs skills

| Layer | Location | Behavior |
|-------|----------|----------|
| **Rules** | `.cursor/rules/*.mdc` | Auto-applied (always or by glob) — norms/SSOT |
| **Skills** | `.cursor/skills/*/SKILL.md` | Invoked when description matches — workflows/checklists that **point** at rules |

Always-on rules: `antigravity-global`, `mms-core`, `mms-migration-status`, `mms-completion-review`. Scoped examples: `mms-dry`, `mms-dependencies`, `mms-structure-naming`.

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

After editing skills or rules:

```bash
bash .agent/scripts/sync-all.sh
```
