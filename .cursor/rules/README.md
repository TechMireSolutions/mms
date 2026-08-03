# MMS Cursor Rules

Project rules for the Madrasa Management System. Cursor loads `.mdc` files from this directory automatically.

**Architecture rules:** `mms-module-architecture.mdc`, `mms-ops-infrastructure.mdc`, `mms-ui-ux-design.mdc`, `mms-data-layer.mdc`.

## Always Applied (4)

| Rule | Purpose |
|------|---------|
| `antigravity-global.mdc` | Agent cognition, output economy, security, TS/git standards |
| `mms-core.mdc` | Stack, boundaries, ownership matrix, edit discipline |
| `mms-migration-status.mdc` | Do not reintroduce themes + short open-gaps summary (full gaps → `mms-migration-fixes` skill) |
| `mms-completion-review.mdc` | Self-review after code edits — verify, fix bugs, then mark done |

## Scoped Rules (16)

| Rule | Focus / Topic |
|------|---------------|
| `mms-dry.mdc` | DRY — single source of truth, extraction thresholds, `@mms/shared` exports |
| `mms-dependencies.mdc` | Latest stable Node, pnpm, and workspace dependency upgrades |
| `mms-ops-infrastructure.mdc` | Local dev setup, environment variables, Docker backend ports, health endpoints, Linux compatibility, and CI orchestration |
| `mms-ui-ux-design.mdc` | UI primitives, design tokens, tabs, notifications, a11y (RTL / WCAG), and **§7 responsiveness** (FormModal chrome → `mms-form-architecture.mdc`) |
| `mms-module-architecture.mdc` | Universal module manifest schemas, three-tier tab layout, Work/Reports/Setup scopes, soft-delete, **gold-standard parity (§7)**, background jobs |
| `mms-data-layer.mdc` | PostgreSQL, Drizzle schema, migrations, database transactions, TanStack Query policy |
| `mms-form-architecture.mdc` | Static FormModal forms, write Zod `.strict()`, React 19 defaults, decimal-as-string, local multipart uploads |
| `mms-structure-naming.mdc` | Monorepo layout, colocation, **file-size bands (~300 hard / ~220 soft)**, Title Case on save, naming |
| `mms-hooks.mdc` | Custom React hooks (Query recipes, page controllers / action handlers, Work layout) |
| `mms-auth-security.mdc` | Auth, users, JWT session shapes, RBAC permissions, multi-tenant isolation, cookie policies, rate limits |
| `mms-settings-i18n.mdc` | Settings hierarchy, preview, navigation, translations, `formatDate` / `formatMoney` |
| `mms-fields.mdc` | Field and tab registry |
| `mms-api-interface.mdc` | apiClient, Fastify routes, error taxonomy, HTTP pagination, bulk PUT upsert |
| `mms-reports.mdc` | Analytics implementation & exports |
| `mms-testing-observability.mdc` | Vitest, API tests, logging, ErrorBoundary, Sentry, request-id |
| `mms-messaging.mdc` | SMS/WhatsApp campaigns, `MessageComposer`, templates, and message-log soft-archive semantics |

## Ownership (see `mms-core.mdc`)

Single prose owner per topic. Duplicate essays elsewhere must be short pointers. Full matrix in always-on `mms-core.mdc` Standards index (soft-delete schema vs Work UX, write Zod, bulk PUT, `mutateAsync` split there).

## Skills (Workflows)

`.cursor/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

Rules = norms/SSOT. Skills = workflows/checklists that **point** at rules (do not re-author norms).

Every rule starts with a **Workflow skill:** line; the full rule→skill map lives in always-on **`mms-core.mdc`** Standards index. Highlights:

| When working on… | Invoke skill |
|------------------|--------------|
| New module / three-tier page | `mms-module-page` (+ `mms-module-work` / `mms-module-setup`) |
| REST Query hooks / optimistic policy | `mms-query-factories` |
| Drizzle DDL / FORCE RLS | `mms-schema-migrate` |
| Auth / CSRF / cookies / RBAC | `mms-backend-security` |
| Fastify routes / `inject()` | `mms-backend-api` |
| FE shell / apiClient | `mms-frontend` |
| FormModal / Zod forms | `mms-form-architecture` |
| Backup wipe-restore | `mms-backup-restore` |
| Dep upgrades / catalogs | `mms-dependency-upgrade` |
| axe / focus-return | `mms-a11y-smoke` |
| Migration debt | `mms-migration-fixes` |
| PR / self-review | `mms-code-review` |

## Agent Mirrors

| Tool | Rules | Skills |
|------|-------|--------|
| **Antigravity** | `.agent/rules/*.md` | `.agent/skills/` |
| **Claude Code** | `.claude/rules/*.md` | `.claude/skills/` |
| **Cursor** | `.cursor/rules/*.mdc` (canonical for rule bodies) | `.cursor/skills/` |

**Sync policy:** rule bodies identical across all three; only frontmatter differs (Cursor: `globs` + `alwaysApply`; Antigravity: `trigger`; Claude: `paths` or always-on). Cross-references use `.mdc` in Cursor, `.md` elsewhere.

After editing standards:

```bash
bash .agent/scripts/sync-all.sh
```

## PR / Change Checklist

- [ ] `pnpm typecheck` && `pnpm test`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-settings-i18n.mdc` (en/ar/ur/fa) + registries
- [ ] Module tiers respect isolation boundaries in `mms-module-architecture.mdc`
- [ ] Person-directory Work: `directoryViews: ['table','cards']` (never `list`) — `mms-module-architecture.mdc` §3
- [ ] Bulk PUT upsert / ban wipe-missing-rows — `mms-api-interface.mdc` §5; form close after `mutateAsync` — module-arch §7
- [ ] Write Zod `.strict()` — `mms-form-architecture.mdc`
- [ ] Work column widths persist (local + `/column-preferences`; merge preserves device widths) — `mms-module-architecture.mdc` §3
- [ ] Dashboard/report KPI cards use `/metrics` where available — `mms-reports.mdc`
- [ ] Setup Fields / form: tab enablement SSOT + enabled fields render in form **and** drawer — `mms-fields.mdc` / `mms-form-architecture.mdc`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] Touched app files stay under hard ~300 lines (prefer ~220 for FE shells); splits keep public import barrels — `mms-structure-naming.mdc`
- [ ] No commit unless user requested
- [ ] Update **all mirrors** when changing standards: `bash .agent/scripts/sync-all.sh`
- [ ] Auth/write routes: `mms-auth-security.mdc` (do not OR entity write with `canEditSetup`)
- [ ] Backup/restore: admin + `canBulkSync`, safety backup + password step-up, sync timeout rollback, strip secrets / exclude credential tables — `mms-settings-i18n.mdc` / `mms-data-layer.mdc` / `mms-auth-security.mdc`
- [ ] New UI: `mms-ui-ux-design.mdc` keyboard + labels + §7 responsive checklist (375 / 768 / 1440)
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing-observability.mdc`

## Removed / Merged (History)

| Removed | Merged into |
|---------|-------------|
| `mms-ai-editing.mdc` | `mms-core` + `antigravity-global` |
| `mms-ops.mdc`, `mms-production-ports.mdc`, `mms-linux-compatibility.mdc`, `mms-ci.mdc`, `saas-architecture.mdc` | `mms-ops-infrastructure.mdc` |
| `mms-ui-visual.mdc`, `mms-ui-rendering.mdc`, `mms-ui-tabs.mdc`, `mms-ui-forms.mdc`, `mms-a11y.mdc` | `mms-ui-ux-design.mdc` |
| `mms-module-work.mdc`, `mms-module-setup.mdc`, `mms-module-isolation.mdc`, `mms-module-crosscutting.mdc`, `mms-background-jobs.mdc` | `mms-module-architecture.mdc` |
| `mms-shared-dry.mdc` | `mms-dry.mdc` |
| `mms-database.mdc`, `mms-query.mdc` | `mms-data-layer.mdc` |
| `mms-structure.mdc`, `mms-naming.mdc` | `mms-structure-naming.mdc` |
| `mms-auth.mdc`, `mms-rbac.mdc`, `mms-tenant.mdc`, `mms-security.mdc` | `mms-auth-security.mdc` |
| `mms-config.mdc`, `mms-settings-navigation.mdc`, `mms-i18n.mdc` | `mms-settings-i18n.mdc` |
| `mms-frontend.mdc`, `mms-backend.mdc` | `mms-api-interface.mdc` |
| `mms-contacts.mdc`, `mms-contact-link.mdc` | Completely Deleted |
| `mms-testing.mdc`, `mms-observability.mdc` | `mms-testing-observability.mdc` |

## Verify in Cursor

**Settings → Rules** — four always-apply rules + 16 file-scoped rules when matching paths are open (**20 total**).
