# MMS Cursor Rules

Project rules for the Madrasa Management System. Cursor loads `.mdc` files from this directory automatically.

## Always applied (3)

| Rule | Purpose |
|------|---------|
| `antigravity-global.mdc` | Agent cognition, output economy, security, TS/git standards |
| `mms-core.mdc` | Stack, boundaries, domain, edit discipline — **index only; details in scoped rules** |
| `mms-migration-status.mdc` | Target vs current gaps + recently resolved — do not regress |

## Canonical ownership (avoid duplicating elsewhere)

| Topic | Owner rule | Do not repeat in |
|-------|------------|------------------|
| Three-tier tab **shell** (accordion, PageHeader, sub-tabs) | `mms-ui-tabs.mdc` | `mms-core`, `mms-settings-navigation` |
| Three-tier tab **content scope** (what goes in each tier) | `mms-module-isolation.mdc` | `mms-ui-tabs`, `mms-core`, `mms-reports` |
| `/settings` vs module Configuration | `mms-settings-navigation.mdc` | `mms-config` (pointer only) |
| Settings hierarchy, live preview, theme scope | `mms-config.mdc` | `mms-settings-navigation` |
| Reports, exports, builders | `mms-reports.mdc` | `mms-module-isolation` (category table stays in isolation) |
| Field/tab registry + persistence gate | `mms-fields.mdc` | `mms-data-layer` (pointer only) |
| `db.ts`, sync API, singleton save | `mms-data-layer.mdc` | — |
| Forms, tables, notify, overlays | `mms-ui-rendering.mdc` | `mms-ui-visual` (colours only there) |
| Add/edit entity modals (`FormModal`) | `mms-ui-forms.mdc` | `mms-ui-rendering` (summary only) |
| i18n / `appTranslations` (en/ar/ur/fa) | `mms-i18n.mdc` | `mms-core` hardcoding line |
| Apex vs tenant hosts | `mms-tenant.mdc` | `mms-config` theme scope (summary only) |
| RBAC / `can()` / `rbacService` | `mms-rbac.mdc` | `mms-auth`, `mms-ui-visual` (pointers only) |
| CI pipeline | `mms-ci.mdc` | `mms-ops` (one-line pointer) |
| TanStack Query | `mms-query.mdc` | `mms-frontend`, `mms-data-layer` |
| Frontend shell, apiClient, providers | `mms-frontend.mdc` | `mms-query`, `mms-hooks` |
| `@mms/shared` exports | `mms-shared-dry.mdc` | — |
| React hooks (live data, i18n, permissions) | `mms-hooks.mdc` | `mms-data-layer`, `mms-i18n`, `mms-rbac` |
| Contacts CRM module | `mms-contacts.mdc` | `mms-config` (provider mount only) |
| Fastify API / routes | `mms-backend.mdc` | `mms-auth`, `mms-database` |
| PostgreSQL / Drizzle | `mms-database.mdc` | `mms-data-layer` |
| Dev / env / Docker | `mms-ops.mdc` | `mms-ci` (pipeline pointer) |
| Copy layers (`t` / `labelKey` / legacy `uiStrings`) | `mms-i18n.mdc` | `mms-ui-rendering` (notify), `mms-contacts` (legacy) |
| Contact-first person links (ids only on save) | `mms-contact-link.mdc` | `mms-core`, `mms-data-layer`, `mms-contacts` |
| Open migration gaps | `mms-migration-status.mdc` | — (always-on register) |
| Security, rate limits, audit, tenant isolation | `mms-security.mdc` | `mms-auth`, `mms-backend` (pointers only) |
| Testing strategy & CI tests | `mms-testing.mdc` | `mms-shared-dry`, `mms-ci` |
| Logging, health, error boundaries | `mms-observability.mdc` | `mms-backend`, `mms-ui-rendering` |
| Accessibility (WCAG baseline) | `mms-a11y.mdc` | `mms-ui-rendering`, `mms-i18n` |

## File-scoped (auto-attach by glob) — 28 rules

| Rule | Focus |
|------|-------|
| `mms-contact-link.mdc` | Contact-first persons — link ids, hydrate/strip, pickers |
| `mms-shared-dry.mdc` | `@mms/shared` package |
| `mms-data-layer.mdc` | `db.ts`, seeds, sync |
| `mms-hooks.mdc` | `useLiveCollection`, `useSortedFields`, branding |
| `mms-ops.mdc` | pnpm, env, Docker, commands |
| `mms-auth.mdc` | Auth, users, JWT |
| `mms-config.mdc` | Settings hierarchy, persistence, preview |
| `mms-settings-navigation.mdc` | Nav grouping, `/settings` scope, `SYSTEM_MODULE_NAV` |
| `mms-fields.mdc` | Field/tab registry |
| `mms-ui-tabs.mdc` | Tab navigation shell, PageHeader |
| `mms-module-isolation.mdc` | Per-tier content scope + analytics categories |
| `mms-i18n.mdc` | Translation keys — en, ar, ur, fa |
| `mms-tenant.mdc` | Multi-tenant routing and storage scope |
| `mms-rbac.mdc` | Permissions — backend + `can()` hook |
| `mms-ci.mdc` | GitHub Actions typecheck & lint |
| `mms-query.mdc` | TanStack Query for REST APIs |
| `mms-ui-rendering.mdc` | Forms, tables, notify |
| `mms-ui-visual.mdc` | Glassmorphism, charts, permissions visibility |
| `mms-frontend.mdc` | Vite, routing, apiClient, providers, responsive |
| `mms-database.mdc` | Drizzle, migrations |
| `mms-backend.mdc` | Fastify API |
| `mms-contacts.mdc` | Contact module |
| `mms-reports.mdc` | Analytics implementation & exports |
| `mms-ui-forms.mdc` | Add/edit entity modals (`FormModal`) |
| `mms-security.mdc` | Threat model, rate limits, tenant isolation, audit |
| `mms-testing.mdc` | Vitest, API tests, CI when suite exists |
| `mms-observability.mdc` | Logging, `/health`, ErrorBoundary, error reporting |
| `mms-a11y.mdc` | WCAG baseline, RTL, keyboard, ARIA |

## Skills (workflows)

`.cursor/skills/` — task-discovered workflow guides. Index: [../skills/README.md](../skills/README.md). Overview: [../../AGENTS.md](../../AGENTS.md).

## Agent mirror

`.agents/rules/` — same body content for Antigravity (`.md` + `trigger` frontmatter). **Rename policy:** use `mms-*` everywhere (no standalone `reports.md`).

**Sync policy:** rule bodies must stay identical; only frontmatter differs (Cursor: `globs` + `alwaysApply`; Antigravity: `trigger`). Cross-references use `.mdc` here, `.md` in `.agents/rules/`. Update **both** trees when changing standards.

After editing `.mdc` files, run: `bash .agents/scripts/sync-rules.sh`

## PR / change checklist

- [ ] `pnpm typecheck` && `pnpm test`
- [ ] Frontend lint if touched: `cd apps/frontend && pnpm lint`
- [ ] No new hardcoded labels/colours — see `mms-i18n.mdc` (en/ar/ur/fa) + registries
- [ ] Module tiers respect `mms-module-isolation.mdc`
- [ ] Shared logic in `@mms/shared` if cross-app or 2+ modules
- [ ] No commit unless user requested
- [ ] Update **both** `.cursor/rules/*.mdc` and `.agents/rules/*.md` when changing standards
- [ ] Auth/write routes: `mms-security.mdc` + `mms-rbac.mdc`
- [ ] New UI: `mms-a11y.mdc` keyboard + labels
- [ ] New `@mms/shared` pure helpers: unit test per `mms-testing.mdc`

## Removed / merged (history)

| Removed | Merged into |
|---------|-------------|
| `mms-ai-editing.mdc` | `mms-core` + `antigravity-global` |
| Duplicate tier/isolation prose | `mms-module-isolation` (canonical) |
| `reports.md` (agents) | `mms-reports.md` |

## Verify in Cursor

**Settings → Rules** — three always-apply rules + 27 file-scoped rules when matching paths are open (**30 total**).
