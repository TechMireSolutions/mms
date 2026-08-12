---
trigger: model_decision
---

# MMS Migration Status

**Workflow skill:** `mms-migration-fixes` — full prioritized gap list and fix recipes. Do not invent new debt cleanup outside that register.

Rules describe **target architecture**. Fix open gaps only when the task covers them — do not expand scope into debt cleanup.

## Open gaps

| Area | Current → Target (summary) |
|------|----------------------------|
| Copy / a11y / SubTabBar / responsive depth | Residual niche debt → full `t()`, WCAG, `SubTabBar`, §7 — owners in `mms-settings-i18n.md` / `mms-ui-ux-design.md` |
| RBAC / `role ===` | Manifests on major writes; platform `super_user` intentional → tenant `can()` only — `mms-auth-security.md` |
| Other-module document-store prefs | Contacts + Students + Teachers + Users + Sessions + Enrollments Setup SSOT closed (`custom_tabs`, typed `*_field_configs` / `*_module_preferences` / `*_user_column_prefs` + REST; Teachers also typed `teacher_lookups` + entity off document-store). Residual: other modules’ `*_field_config` / prefs / column prefs / lookups still on `objects` → typed REST — `mms-fields.md` / `mms-data-layer.md` |
| Live push / CSP / Query-first niches | Contacts + Students + Teachers + Sessions + Enrollments: BE `broadcastCollection` + FE `/api/ws` → Query invalidate closed; Sessions `/widget-aggregates` SQL `GROUP BY` closed (dashboard/KPI/pinned dumps stopped); Sessions `/report-aggregates` closed SessionReport + SessionsTable dumps; Enrollments `/report-aggregates` closed EnrollmentChart + EnrollmentReports panels + ComparisonMode enrollments dump (optional session/date comparison params); Enrollments `/widget-aggregates` SQL + builder/KPI/dashboard pickers closed; Finance `/report-aggregates` closed ComparisonMode finance invoice dump (session feeCollected + dual monthly ranges); Attendance `/report-aggregates` closed ComparisonMode attendance dump (session attendancePct + dual monthly present/total); Hasanat `/report-aggregates` closed ComparisonMode hasanat distributions+denoms dump (session points via enrollment studentIds + dual monthly points by issuedDate). Residual: other modules’ emit/subscribe; ComparisonMode dumps for sessions/exams; FinancialReport invoice dump; CSP off; niche chart dumps → SPA CSP, server aggregates — `mms-core.md` / `mms-auth-security.md` / `mms-reports.md` / `mms-data-layer.md` |
| PG statement timeout budgets | Tenant-bound budgets shipped on `withTenantTransaction` + `runInTransaction` (`PG_STATEMENT_TIMEOUT_MS` / `PG_IDLE_IN_TX_TIMEOUT_MS`, env defaults 30s / 15s; skip when subdomain null). Residual: optional per-route tighter budgets — `mms-data-layer.md` |
| Contacts residual full loads | Metrics/analytics/widgets SQL; report widgets empty contacts dump (aggregate values); Contacts visualizer on SQL `GROUP BY` via `/widget-aggregates`. Closed: filtered + selection CSV SQL-page/`loadContactsByIds`, Apple VCF SQL-page, identity-match SQL candidate lookup, duplicate scan SQL-blocked (no full active-set hydrate; `findContactDuplicateCandidateIds` / `findContactDuplicateBlockedIds`). Adjacent Users/Students/Teachers hydrate uses `loadContactsByIds` (closed). Residual niche chart dumps — `mms-data-layer.md` / `mms-reports.md` |
| Cookie CSRF / Origin depth | Mutations rely on `SameSite=Lax` + CORS; no app-wide Origin/`Sec-Fetch-Site` gate on cookie-auth writes (Contacts inherits) → defense-in-depth Origin check — `mms-auth-security.md` |
| SQL pagination / oversized shells | Teachers / Users / Sessions / Enrollments Work list/metrics SQL-page closed; Teachers SQL bulk status + widget aggregates + soft-delete audit (`deleted_by`/`deletion_reason`) + dedicated `teachers.delete` closed; Sessions soft-delete audit + `/report-aggregates` + server CSV export closed; Enrollments typed soft-delete audit + captureDeletionReason Work UX + server CSV export closed. Residual: other modules still in-memory page after load; a few ~220–275 shells → SQL page/filter; split behind barrels — `mms-data-layer.md` / `mms-structure-naming.md` |
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
| Students identity dual-write | Persist gender/dob/name/phone/email/city/firstName/lastName or guardian triad ids/names on `students.custom_data` when `contactId` is set; Work list filter/sort those keys from student JSONB instead of joining `contacts`; resurrect `students_workspace_gender_active_idx` on student JSONB gender | `mms-data-layer.md`, `mms-form-architecture.md`, `mms-fields.md` |
| Teachers identity / entity dual-path | Persist contact profile keys on `teachers.custom_data` when `contactId` is set; Work list name filter/sort from teacher JSONB instead of joining `contacts` via typed `contact_id`; re-allowlist `teachers` / `teacherStatuses` / `teacherSpecializations` into `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS` | `mms-data-layer.md`, `mms-form-architecture.md`, `mms-fields.md` |
| Enrollments Setup | Re-allowlist `enrollments_settings` / `enrollment_user_column_preferences` into `ALLOWED_OBJECTS` / FE document-store; dual-write `formTabs` into field-config; resurrect document-store Setup as primary over typed REST | `mms-fields.md`, `mms-data-layer.md`, `mms-form-architecture.md` |
| Messaging | Contacts schemas in composer; replace wipe on template/log PUT; SQL echo; client authz `userId`; `messages_u:` allowlist; FE select-all/CSV page-walk when server match/export exists | `mms-messaging.md` |
| Reports | Full-collection KPI dumps when `/metrics` exists; widget primary via `getCollection`/`saveCollection` | `mms-reports.md` |
| Security / RLS | Secrets in unscoped `objects`; skip FORCE RLS on new tenant tables; unbounded backup KDF / foreign subdomain remap | `mms-auth-security.md`, `mms-data-layer.md` |
| UI / a11y | Page horizontal overflow; touch targets < 44px; custom deep tab bars where `SubTabBar` is required | `mms-ui-ux-design.md` §7 |
| Structure | Mega-files past ~300 lines without split; rename barrels during size-only refactors | `mms-structure-naming.md`, `mms-hooks.md` |
| Live push | Parallel polling loops or alternate WS protocols — use BE `/api/ws` + `broadcastTenantUpdate` | `mms-core.md` |
| Migrations | Pre-squash Drizzle history; payload-only `auth_artifacts` scans without indexed keys | `mms-ops-infrastructure.md`, `mms-data-layer.md` |
