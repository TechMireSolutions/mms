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
| Custom tabs FE dual-write / document-store prefs | Typed `custom_tabs` shipped; **Contacts Setup writes tabs via `/api/custom-tabs` and strips `formTabs` from `contact_field_config`**; field-config / preferences / column prefs remain document-store → REST SSOT + typed tables — `mms-fields.md` / `mms-data-layer.md` |
| Live push / CSP / Query-first niches | BE `/api/ws` without FE sub; CSP off; some charts client-reduce → FE WS, SPA CSP, server aggregates — `mms-core.md` / `mms-auth-security.md` / `mms-reports.md` |
| Contacts residual full loads | Metrics/analytics/widgets/Google name check SQL; report widgets empty contacts dump; visualizer capped to one page; **duplicate scan, CSV export, Apple import/export page-walk remain** → SQL/streamed paths — `mms-data-layer.md` / `mms-reports.md` |
| Contacts lookup collections | `genders`, `phoneLabels`, `emailLabels`, `countryCodes`, etc. remain unscoped `collections` KV → typed or tenant-RLS store — `mms-data-layer.md` / `mms-fields.md` |
| Cookie CSRF / Origin depth | Mutations rely on `SameSite=Lax` + CORS; no app-wide Origin/`Sec-Fetch-Site` gate on cookie-auth writes (Contacts inherits) → defense-in-depth Origin check — `mms-auth-security.md` |
| Contacts write Zod passthrough | `contactWriteSchema` strips soft-delete but remains `.passthrough()` for custom fields → documented dynamic-key / allowlist strategy (prefer `.strict()` where possible) — `mms-api-interface.md` / `mms-form-architecture.md` |
| Work REST parity (Students/Teachers/Users/Sessions) | `list` views / unpaged dumps / drawer gaps → Contacts parity — `mms-module-architecture.md` §3/§7 |
| SQL pagination / oversized shells | In-memory page after load; a few ~220–275 shells → SQL page/filter; split behind barrels — `mms-data-layer.md` / `mms-structure-naming.md` |

## Do not reintroduce (themes)

Keep these regressions out of new work. Details live in owning scoped rules — do not expand this list opportunistically.

| Theme | Never reintroduce | Owner |
|-------|-------------------|--------|
| Data authority | Mutation dual-write via `saveCollection`; `getCollection` as primary for REST; unpaged `loadAllFn` / `maxPageSize` card dumps | `mms-data-layer.md` |
| Sessions | localStorage JWT; skip platform `/me` probe; resurrect deleted apex chrome | `mms-auth-security.md` |
| Soft-delete | Work trash without drawer archive chrome; JSONB-only `deletedAt` when typed columns exist; client soft-delete on create/update bodies | `mms-module-architecture.md` §6–§7 |
| Gold-standard §7 | Bulk wipe PUT; fire-and-forget `mutate()` closes forms; missing `ErrorState` / Cmd+N / `canEditSetup` | `mms-module-architecture.md` §7 |
| Work UX | Parallel Filters chip bar; `directoryViews: ['list']` when Work is table\|cards; server prefs overwriting local column widths | `mms-module-architecture.md` §3 |
| Fields / forms | Hard-coded field allowlists dropping Setup customs; object-only custom tabs; unlocked `basic`/`custom` tabs; Save enabled when not dirty | `mms-fields.md`, `mms-form-architecture.md` |
| Contacts | Persona/CRM tags; `ALLOWED_COLLECTIONS` contacts; resurrect emptied collection arrays; Google sync OR `canEditSetup` | `mms-form-architecture.md`, `mms-fields.md` |
| Messaging | Contacts schemas in composer; replace wipe on template/log PUT; SQL echo; client authz `userId` | `mms-messaging.md` |
| Reports | Full-collection KPI dumps when `/metrics` exists; widget primary via `getCollection`/`saveCollection` | `mms-reports.md` |
| Security / RLS | Secrets in unscoped `objects`; skip FORCE RLS on new tenant tables; unbounded backup KDF / foreign subdomain remap | `mms-auth-security.md`, `mms-data-layer.md` |
| UI / a11y | Page horizontal overflow; touch targets < 44px; custom deep tab bars where `SubTabBar` is required | `mms-ui-ux-design.md` §7 |
| Structure | Mega-files past ~300 lines without split; rename barrels during size-only refactors | `mms-structure-naming.md`, `mms-hooks.md` |
| Live push | Parallel polling loops or alternate WS protocols — use BE `/api/ws` + `broadcastTenantUpdate` | `mms-core.md` |
| Migrations | Pre-squash Drizzle history; payload-only `auth_artifacts` scans without indexed keys | `mms-ops-infrastructure.md`, `mms-data-layer.md` |
