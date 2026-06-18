# MMS Agent Rules (Antigravity)

Project rules for the Madrasa Management System. Antigravity loads `.md` files from this directory (or `.agent/` symlink).

## Always on (`trigger: always_on`) — 3

| Rule | Purpose |
|------|---------|
| `antigravity-global.md` | Cognition, output economy, security, TS/git standards |
| `mms-core.md` | Stack, boundaries, domain, edit discipline — **index only; details in scoped rules** |
| `mms-migration-status.md` | Target vs current gaps + recently resolved — do not regress |

## Canonical ownership (avoid duplicating elsewhere)

| Topic | Owner rule | Do not repeat in |
|-------|------------|------------------|
| Three-tier tab **shell** (accordion, PageHeader, sub-tabs) | `mms-ui-tabs.md` | `mms-core`, `mms-settings-navigation` |
| Three-tier tab **content scope** (what goes in each tier) | `mms-module-isolation.md` | `mms-ui-tabs`, `mms-core`, `mms-reports` |
| `/settings` vs module Configuration | `mms-settings-navigation.md` | `mms-config` (pointer only) |
| Settings hierarchy, live preview, theme scope | `mms-config.md` | `mms-settings-navigation` |
| Reports, exports, builders | `mms-reports.md` | `mms-module-isolation` (category table stays in isolation) |
| Field/tab registry + persistence gate | `mms-fields.md` | `mms-data-layer` (pointer only) |
| `db.ts`, sync API, singleton save | `mms-data-layer.md` | — |
| Forms, tables, notify, overlays | `mms-ui-rendering.md` | `mms-ui-visual` (colours only there) |
| Add/edit entity modals (`FormModal`) | `mms-ui-forms.md` | `mms-ui-rendering` (summary only) |
| i18n / `appTranslations` (en/ar/ur/fa) | `mms-i18n.md` | `mms-core` hardcoding line |
| Apex vs tenant hosts | `mms-tenant.md` | `mms-config` theme scope (summary only) |
| RBAC / `can()` / `rbacService` | `mms-rbac.md` | `mms-auth`, `mms-ui-visual` (pointers only) |
| CI pipeline | `mms-ci.md` | `mms-ops` (one-line pointer) |
| TanStack Query | `mms-query.md` | `mms-frontend`, `mms-data-layer` |
| `@mms/shared` exports | `mms-shared-dry.md` | — |
| React hooks (live data, i18n, permissions) | `mms-hooks.md` | `mms-data-layer`, `mms-i18n`, `mms-rbac` |
| Contacts CRM module | `mms-contacts.md` | `mms-config` (provider mount only) |
| Fastify API / routes | `mms-backend.md` | `mms-auth`, `mms-database` |
| PostgreSQL / Drizzle | `mms-database.md` | `mms-data-layer` |
| Dev / env / Docker | `mms-ops.md` | `mms-ci` (pipeline pointer) |
| Copy layers (`t` / `labelKey` / legacy `uiStrings`) | `mms-i18n.md` | `mms-ui-rendering` (notify), `mms-contacts` (legacy) |
| Contact-first person links (ids only on save) | `mms-contact-link.md` | `mms-core`, `mms-data-layer`, `mms-contacts` |
| Open migration gaps | `mms-migration-status.md` | — (always-on register) |
| Security, rate limits, audit, tenant isolation | `mms-security.md` | `mms-auth`, `mms-backend` (pointers only) |
| Testing strategy & CI tests | `mms-testing.md` | `mms-shared-dry`, `mms-ci` |
| Logging, health, error boundaries | `mms-observability.md` | `mms-backend`, `mms-ui-rendering` |
| Accessibility (WCAG baseline) | `mms-a11y.md` | `mms-ui-rendering`, `mms-i18n` |

## Model decision (`trigger: model_decision`)

Agent loads when task matches — **28 scoped rules**:

| Rule | Focus |
|------|-------|
| `mms-contact-link.md` | Contact-first persons — link ids, hydrate/strip, pickers |
| `mms-shared-dry.md` | `@mms/shared` package |
| `mms-data-layer.md` | `db.ts`, seeds, sync |
| `mms-hooks.md` | `useLiveCollection`, `useSortedFields`, branding |
| `mms-ops.md` | pnpm, env, Docker, commands |
| `mms-auth.md` | Auth, users, JWT |
| `mms-config.md` | Settings hierarchy, persistence, preview |
| `mms-settings-navigation.md` | Nav grouping, `/settings` scope, `SYSTEM_MODULE_NAV` |
| `mms-fields.md` | Field/tab registry |
| `mms-ui-tabs.md` | Tab navigation shell, PageHeader |
| `mms-module-isolation.md` | Per-tier content scope + analytics categories |
| `mms-i18n.md` | Translation keys — en, ar, ur, fa |
| `mms-tenant.md` | Multi-tenant routing and storage scope |
| `mms-rbac.md` | Permissions — backend + `can()` hook |
| `mms-ci.md` | GitHub Actions typecheck & lint |
| `mms-query.md` | TanStack Query for REST APIs |
| `mms-ui-rendering.md` | Forms, tables, notify |
| `mms-ui-visual.md` | Glassmorphism, charts, permissions visibility |
| `mms-frontend.md` | Vite, routing, responsive |
| `mms-database.md` | Drizzle, migrations |
| `mms-backend.md` | Fastify API |
| `mms-contacts.md` | Contact module |
| `mms-reports.md` | Analytics implementation & exports |
| `mms-ui-forms.md` | Add/edit entity modals (`FormModal`) |
| `mms-security.md` | Threat model, rate limits, tenant isolation, audit |
| `mms-testing.md` | Vitest, API tests, CI when suite exists |
| `mms-observability.md` | Logging, `/health`, ErrorBoundary, error reporting |
| `mms-a11y.md` | WCAG baseline, RTL, keyboard, ARIA |

## Skills (workflows)

`.agents/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

## Workflows

`dev-setup`, `feature-module`, `code-review`, `fix-migration-debt` — see [../workflows/](../workflows/).

## Cursor mirror

`.cursor/rules/` — same body content as these files (`.mdc` + `globs` / `alwaysApply` frontmatter). **31 rule files** total (3 always-on + 28 scoped). **Rename policy:** use `mms-*` everywhere (no standalone `reports.md`).

**Sync policy:** rule bodies must stay identical; only frontmatter differs (Cursor: `globs` + `alwaysApply`; Antigravity: `trigger`). Cross-references use `.mdc` in Cursor, `.md` here.

After editing `.cursor/rules/*.mdc`, run: `bash .agents/scripts/sync-rules.sh`

## PR / change checklist

- [ ] `pnpm typecheck`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-i18n.md` (en/ar/ur/fa) + registries
- [ ] Module tiers respect `mms-module-isolation.md`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] No commit unless user requested
- [ ] Update **both** `.cursor/rules/*.mdc` and `.agents/rules/*.md` when changing standards
- [ ] Auth/write routes: `mms-security.md` + `mms-rbac.md`
- [ ] New UI: `mms-a11y.md` keyboard + labels
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing.md`

## Removed / merged (history)

| Removed | Merged into |
|---------|-------------|
| `mms-ai.md` | `mms-core` + `antigravity-global` |
| `mms-dry.md` | `mms-shared-dry.md` |
| `reports.md` | `mms-reports.md` |
| Duplicate tier/isolation prose | `mms-module-isolation` (canonical) |
