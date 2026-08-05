---
description: Known gaps between rules (target) and codebase (current) — do not opportunistically fix outside task scope
---

# MMS Migration Status

**Workflow skill:** `mms-migration-fixes` — full prioritized gap list and fix recipes. Do not invent new debt cleanup outside that register.

Rules describe **target architecture**. Fix open gaps only when the task covers them — do not expand scope into debt cleanup.

## Open gaps

| Area | Current → Target (summary) |
|------|----------------------------|
| Copy / a11y / SubTabBar / responsive depth | Residual niche debt → full `t()`, WCAG, `SubTabBar`, §7 — owners in `mms-settings-i18n.md` / `mms-ui-ux-design.md` |
| RBAC / `role ===` | Manifests on major writes; platform `super_user` intentional → tenant `can()` only — `mms-auth-security.md` |
| Other-module document-store prefs | Contacts Setup SSOT closed (`custom_tabs`, `contact_lookups`, `contact_field_configs`, `contact_module_preferences`, `contact_user_column_prefs` + REST). Residual: other modules’ `*_field_config` / prefs / column prefs still on `objects` → typed REST — `mms-fields.md` / `mms-data-layer.md` |
| Live push / CSP / Query-first niches | Contacts: BE `broadcastCollection('contacts')` + FE `/api/ws` → Query invalidate closed. Residual: other modules’ emit/subscribe; CSP off; some charts client-reduce → SPA CSP, server aggregates — `mms-core.md` / `mms-auth-security.md` / `mms-reports.md` / `mms-data-layer.md` |
| PG statement timeout budgets | Tenant-bound budgets shipped on `withTenantTransaction` + `runInTransaction` (`PG_STATEMENT_TIMEOUT_MS` / `PG_IDLE_IN_TX_TIMEOUT_MS`, env defaults 30s / 15s; skip when subdomain null). Residual: optional per-route tighter budgets — `mms-data-layer.md` |
| Contacts residual full loads | Metrics/analytics/widgets SQL; report widgets empty contacts dump (aggregate values); Contacts visualizer on SQL `GROUP BY` via `/widget-aggregates`; filtered + selection CSV SQL-page/`loadContactsByIds`, Apple VCF SQL-page + identity-match, duplicate scan SQL-page walk. Adjacent Users/Students/Teachers hydrate uses `loadContactsByIds` (closed). Residual niche chart dumps — `mms-data-layer.md` / `mms-reports.md` |
| Cookie CSRF / Origin depth | Mutations rely on `SameSite=Lax` + CORS; no app-wide Origin/`Sec-Fetch-Site` gate on cookie-auth writes (Contacts inherits) → defense-in-depth Origin check — `mms-auth-security.md` |
| Work REST parity (Students/Teachers/Users/Sessions) | `list` views / unpaged dumps / drawer gaps → Contacts parity — `mms-module-architecture.md` §3/§7 |
| SQL pagination / oversized shells | In-memory page after load; a few ~220–275 shells → SQL page/filter; split behind barrels — `mms-data-layer.md` / `mms-structure-naming.md` |
| Messaging hardening | Closed: `includeDeleted` gated by `canClearMessagingLogs`; CSV row/byte caps; clear-logs audited; log/export idempotency bound to body digest (`409` on mismatch) — residual only if regressions reappear — `mms-messaging.md` |

## Do not reintroduce (themes)

Keep these regressions out of new work. Details live in owning scoped rules — do not expand this list opportunistically.

| Theme | Never reintroduce | Owner |
|-------|-------------------|--------|
| Data authority | Mutation dual-write via `saveCollection`; `getCollection` as primary for REST; unpaged `loadAllFn` / `maxPageSize` card dumps | `mms-data-layer.md` |
| Sessions | localStorage JWT; skip platform `/me` probe; resurrect deleted apex chrome | `mms-auth-security.md` |
| Soft-delete Work UX | Work trash without drawer archive chrome, or forked archive/warning callouts / selection bars instead of `WarningCallout` / `BulkSelectionBar` | `mms-module-architecture.md` §6–§7 · `mms-ui-ux-design.md` |
| Soft-delete schema | JSONB-only `deletedAt` when typed columns exist; client soft-delete on create/update bodies | `mms-data-layer.md`, `mms-form-architecture.md` |
| Gold-standard §7 | Bulk wipe PUT; fire-and-forget `mutate()` closes forms; missing `ErrorState` / Cmd+N / `canEditSetup` | `mms-module-architecture.md` §7 |
| Work UX | Parallel Filters chip bar; `directoryViews: ['list']` when Work is table\|cards; server prefs overwriting local column widths | `mms-module-architecture.md` §3 |
| Work chrome DRY | Hand-rolled empties / glass stacks; resurrecting `FormEmptyState`; forked bulk delete/restore/messaging instead of `BulkSelectionDeleteAction` / Restore / Messaging; toolbar-inline bulk trash; hand-rolled field errors instead of `FieldErrorMessage`/`FORM_ERROR`; ad-hoc chart heights / modal-toast z-index / toast max-width instead of `h-chart-*` / `z-modal*` / `max-w-toast`; `visibleColumns`/`show*` boolean fans; title-only `ErrorState`; KPI StatCard strips bypassing `ModuleCommandMetricsGrid` when the strip pattern applies | `mms-ui-ux-design.md` · `mms-module-architecture.md` · `mms-dry.md` · `mms-form-architecture.md` |
| Fields / forms | Hard-coded field allowlists dropping Setup customs; object-only custom tabs; unlocked `basic` tab; resurrecting always-on seed `custom` “Custom Fields” system tab; Save enabled when not dirty; loosen top-level contact write Zod away from `.strict()` / allowlist | `mms-fields.md`, `mms-form-architecture.md` |
| Contacts | Persona/CRM tags; `ALLOWED_COLLECTIONS` contacts; resurrect emptied collection arrays; Google sync OR `canEditSetup`; re-allowlist Contacts Setup object/collection keys (`contact_field_config`, `contact_preferences`, `contact_user_column_preferences`, seven lookup kinds) into `ALLOWED_OBJECTS` / `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS`; dual-write `formTabs` into field-config | `mms-form-architecture.md`, `mms-fields.md`, `mms-data-layer.md` |
| Messaging | Contacts schemas in composer; replace wipe on template/log PUT; SQL echo; client authz `userId`; `messages_u:` allowlist; FE select-all/CSV page-walk when server match/export exists | `mms-messaging.md` |
| Reports | Full-collection KPI dumps when `/metrics` exists; widget primary via `getCollection`/`saveCollection` | `mms-reports.md` |
| Security / RLS | Secrets in unscoped `objects`; skip FORCE RLS on new tenant tables; unbounded backup KDF / foreign subdomain remap | `mms-auth-security.md`, `mms-data-layer.md` |
| UI / a11y | Page horizontal overflow; touch targets < 44px; custom deep tab bars where `SubTabBar` is required | `mms-ui-ux-design.md` §7 |
| Structure | Mega-files past ~300 lines without split; rename barrels during size-only refactors | `mms-structure-naming.md`, `mms-hooks.md` |
| Live push | Parallel polling loops or alternate WS protocols — use BE `/api/ws` + `broadcastTenantUpdate` | `mms-core.md` |
| Migrations | Pre-squash Drizzle history; payload-only `auth_artifacts` scans without indexed keys | `mms-ops-infrastructure.md`, `mms-data-layer.md` |
