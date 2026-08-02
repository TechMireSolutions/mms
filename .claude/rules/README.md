# MMS Claude Rules

Project rules for the Madrasa Management System. Claude Code loads `.md` files from this directory (synced from Cursor `.mdc`).

**Architecture rules:** `mms-module-architecture.md`, `mms-ops-infrastructure.md`, `mms-ui-ux-design.md`, `mms-data-layer.md`.

## Always Applied (4)

| Rule | Purpose |
|------|---------|
| `antigravity-global.md` | Agent cognition, output economy, security, TS/git standards |
| `mms-core.md` | Stack, boundaries, ownership matrix, edit discipline |
| `mms-migration-status.md` | Do not reintroduce themes + short open-gaps summary (full gaps → `mms-migration-fixes` skill) |
| `mms-completion-review.md` | Self-review after code edits — verify, fix bugs, then mark done |

## Scoped Rules (16)

| Rule | Focus / Topic |
|------|---------------|
| `mms-dry.md` | DRY — single source of truth, extraction thresholds, `@mms/shared` exports |
| `mms-dependencies.md` | Latest stable Node, pnpm, and workspace dependency upgrades |
| `mms-ops-infrastructure.md` | Local dev setup, environment variables, Docker backend ports, health endpoints, Linux compatibility, and CI orchestration |
| `mms-ui-ux-design.md` | UI primitives, design tokens, tabs, notifications, a11y (RTL / WCAG), and **§7 responsiveness** (FormModal chrome → `mms-form-architecture.md`) |
| `mms-module-architecture.md` | Universal module manifest schemas, three-tier tab layout, Work/Reports/Setup scopes, soft-delete, **gold-standard parity (§7)**, background jobs |
| `mms-data-layer.md` | PostgreSQL, Drizzle schema, migrations, database transactions, TanStack Query policy |
| `mms-form-architecture.md` | Static FormModal forms, shared Zod DTOs, React 19 defaults, decimal-as-string, local multipart uploads |
| `mms-structure-naming.md` | Monorepo layout, colocation, **file-size bands (~300 hard / ~220 soft)**, Title Case on save, naming |
| `mms-hooks.md` | Custom React hooks (Query recipes, page controllers / action handlers, Work layout) |
| `mms-auth-security.md` | Auth, users, JWT session shapes, RBAC permissions, multi-tenant isolation, cookie policies, rate limits |
| `mms-settings-i18n.md` | Settings hierarchy, preview, navigation, translations, `formatDate` / `formatMoney` |
| `mms-fields.md` | Field and tab registry |
| `mms-api-interface.md` | Vite SPA shell, routing, apiClient, Fastify API routes, error taxonomy, HTTP pagination contract |
| `mms-reports.md` | Analytics implementation & exports |
| `mms-testing-observability.md` | Vitest, API tests, logging, ErrorBoundary, Sentry, request-id |
| `mms-messaging.md` | SMS/WhatsApp campaigns, `MessageComposer`, templates, and message-log soft-archive semantics |

## Ownership (see `mms-core.md`)

Single prose owner per topic. Duplicate essays elsewhere must be short pointers. Full matrix in always-on `mms-core.md` Standards index.

## Skills (Workflows)

`.cursor/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

Rules = norms/SSOT. Skills = workflows/checklists that **point** at rules (do not re-author norms).

Every rule starts with a **Workflow skill:** line; the full rule→skill map lives in always-on **`mms-core.md`** Standards index. Highlights:

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
- [ ] No new hardcoded labels/colours — see `mms-settings-i18n.md` (en/ar/ur/fa) + registries
- [ ] Module tiers respect isolation boundaries in `mms-module-architecture.md`
- [ ] Person-directory Work: `directoryViews: ['table','cards']` (never `list`); domain modules keep their own sub-modes; paged list GET (no `loadAllFn`); cards share server pagination; drawer trash parity
- [ ] Work column widths persist (local + `/column-preferences`; merge preserves device widths) — `mms-module-architecture.md` §3
- [ ] Dashboard/report KPI cards use `/metrics` where available — no forced collection dumps for those values; widgets/visualizer use `useWidgetCollections` / `useReportCollectionRows` — `mms-reports.md`
- [ ] Setup Fields / form: tab enablement SSOT + enabled fields render in form **and** drawer — `mms-fields.md`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] Touched app files stay under hard ~300 lines (prefer ~220 for FE shells); splits keep public import barrels — `mms-structure-naming.md`
- [ ] No commit unless user requested
- [ ] Update **all mirrors** when changing standards: `bash .agent/scripts/sync-all.sh`
- [ ] Auth/write routes: `mms-auth-security.md` (do not OR entity write with `canEditSetup`)
- [ ] Backup/restore: admin + `canBulkSync`, safety backup + password step-up, sync timeout rollback, strip secrets / exclude credential tables — `mms-settings-i18n.md` / `mms-data-layer.md` / `mms-auth-security.md`
- [ ] New UI: `mms-ui-ux-design.md` keyboard + labels + §7 responsive checklist (375 / 768 / 1440)
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing-observability.md`

## Removed / Merged (History)

| Removed | Merged into |
|---------|-------------|
| `mms-ai-editing.md` | `mms-core` + `antigravity-global` |
| `mms-ops.md`, `mms-production-ports.md`, `mms-linux-compatibility.md`, `mms-ci.md`, `saas-architecture.md` | `mms-ops-infrastructure.md` |
| `mms-ui-visual.md`, `mms-ui-rendering.md`, `mms-ui-tabs.md`, `mms-ui-forms.md`, `mms-a11y.md` | `mms-ui-ux-design.md` |
| `mms-module-work.md`, `mms-module-setup.md`, `mms-module-isolation.md`, `mms-module-crosscutting.md`, `mms-background-jobs.md` | `mms-module-architecture.md` |
| `mms-shared-dry.md` | `mms-dry.md` |
| `mms-database.md`, `mms-query.md` | `mms-data-layer.md` |
| `mms-structure.md`, `mms-naming.md` | `mms-structure-naming.md` |
| `mms-auth.md`, `mms-rbac.md`, `mms-tenant.md`, `mms-security.md` | `mms-auth-security.md` |
| `mms-config.md`, `mms-settings-navigation.md`, `mms-i18n.md` | `mms-settings-i18n.md` |
| `mms-frontend.md`, `mms-backend.md` | `mms-api-interface.md` |
| `mms-contacts.md`, `mms-contact-link.md` | Completely Deleted |
| `mms-testing.md`, `mms-observability.md` | `mms-testing-observability.md` |

## Verify in Cursor

**Settings → Rules** — four always-apply rules + 16 file-scoped rules when matching paths are open (**20 total**).
