---
name: mms-migration-fixes
description: Addresses known MMS technical debt from mms-migration-status — remaining gaps only. Use when the user asks to fix migration gaps, align rules with code, or tackle documented debt.
---

# MMS Migration Fixes

Only implement items **in scope** for the current task.

- **Do not reintroduce themes** (always-on): `.cursor/rules/mms-migration-status.mdc`
- **Open gaps detail** (this skill): prioritized P1–Pn below — the rule keeps a short summary only.

When the user asks to fix migration debt, work from the open priorities here and the owning scoped rules.

## Resolved (do not reintroduce)

| Item | Resolution |
|------|------------|
| Auth seeds shape | `StoredUser` with `role` + `passwordHash` |
| RBAC on `/api/db/*` writes | `rbacService` |
| Nested `ContactConfigProvider` | Single mount in `TenantScopedProviders` (tenant host) |
| JWT localStorage-only | httpOnly cookies; `apiClient` cookie-only (`credentials: 'include'`) |
| Tenant JWT binding | `authenticateTenant` middleware |
| Bulk sync open download | Admin-only `canDownloadBulkSync` |
| Global DB reset via API | Tenant-scoped `resetTenantData` |
| Massive mock auto-seed | `minimalSeeds` + empty frontend defaults |
| In-memory auth handoff | `auth_artifacts` table |
| Client-side 2FA only | Server `twoFactorService` |
| Orphan route guards | Canonical `ProtectedRoute` in `HostRoutes` |
| Contacts REST + write RBAC | Full `/api/contacts` CRUD + `canWriteCollection` on mutations |
| Settings monolithic panels | Split into hooks + section components; `useBackupRestore`, `ModuleSettingsNavGrid`, `settingsSectionComponents` |
| Accessible branding theme | `logoBrandColors.ts` + `brandingTheme.ts` WCAG AA tokens |
| Legacy `mms_token` cleanup | Removed — cookie-only session via `apiClient` |
| Composite primary keys | Changed to `(workspace_subdomain, id)` for strict isolation in schema.ts |
| Form modal progress tracking | Built progress scanning inside FormModal.tsx for forms |
| Linter warnings cleanup | Fixed all react-hooks dependency array and unused variable lint errors |
| Unified Phone & Zero-Click Form | Unified phone inputs & zero-click form sublist auto-population in ContactForm and Branding |
| Wrapper files removal | Removed redundant wrapper/alias files for StatCard, ExportToolbar, and SafeResponsiveContainer |
| Column Customizer Props DRY | Consolidated duplicate local ColumnCustomizerProps interfaces into ModuleColumnCustomizerProps |
| REST collections migration | Major modules on dedicated REST + TanStack Query (see migration-status resolved list) |
| Sentry client-side error reporting | Configured and integrated Sentry with global React ErrorBoundary fallback rendering in `main.tsx` |
| RBAC read hardening | Hardened `rbacService.ts` mapping and logic by explicitly checking permissions for `user_activity_logs` and `backups` collection reads/writes |
| Date & Money formatting consistency DRY | Settings-aware `formatDate` / `formatMoney` |
| Settings-Aware Currency Formatting DRY | `useAccountingCurrency` / `useFinanceCurrency`; no hardcoded `"PKR"` |
| Unified Date Filters | `<AccountingDateFilterBar>` |
| Module write-surface `can()` gates | `useModulePermissions(contract)` on major modules — omit forbidden CTAs |
| Students & Teachers soft-delete Work UI | Trash toggle + restore/bulk restore (Contacts-style) |
| Expanded soft-delete Work trash | Sessions, Attendance, Enrollments, Finance, Accounting, Obligations, Hasanat, Examinations, Question Bank (questions), Users (`tenant_users.deleted_at`) |
| Module gold-standard parity | Hasanat → Examinations → Users → Messaging → Question Bank: upsert bulk PUT, awaited saves, setupSubTabs, ErrorState, Cmd/Ctrl+N |
| Onboarding E2E critical path | `e2e/tests/onboarding-login.spec.ts` |
| Contacts FORCE RLS + typed soft-delete SQL | Squashed `0000_init` (+ journal forward migrations); list filters on `deleted_at` |
| Contacts entity leave document-store | Removed from `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS`; typed `contacts` table only |
| Google Contacts OAuth secrets table | `contact_google_sync_credentials` FORCE RLS; not `objects` |
| Contacts saved reports → typed table | `saved_reports` category `contacts`; object key deprecated from ALLOWED_OBJECTS |
| Audit trigger tenant + user GUCs | `log_row_change` fills `workspace_subdomain`; `app.current_user_id` SET LOCAL |
| Contact write schema soft-delete strip + top-level strict | `contactWriteSchema` / `buildContactWriteSchema` + `stripContactClientSoftDeleteFields` (nested item `.passthrough()` remains open — P3b) |
| Atomic contact merge | `POST /api/contacts/merge`; FE invalidates after Google sync (no dual upsert) |
| Contacts Setup lookups typed | `contact_lookups` + `/api/contacts/lookups`; removed from `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS` |
| Contacts Setup field-config / prefs / column prefs typed | `contact_field_configs`, `contact_module_preferences`, `contact_user_column_prefs` + REST; removed from `ALLOWED_OBJECTS` |
| Query-first report widgets | `useWidgetCollections({ requiredCollections })` + `useReportCollectionRows`; REST toggles via `widgetRecordToggle` |
| Students Work REST parity | SQL page/filter, table\|cards, trash/`viewingDeleted`, drawer archive chrome, metrics, server CSV (`POST /api/students/export/csv` + audit + `students:export`) |
| Students Identity → Contacts SSOT | Typed student row = `contactId` + module fields; strip `CONTACT_PROFILE_FIELDS` + guardian dual-write on write; hydrate on read; Work list gender/dob/name filter+sort+search joins `contacts` (`studentRepositoryList`); data migrate `046_strip_student_contact_profile_fields`; Drizzle `0020_drop_students_gender_active_idx` |
| Contacts Clean Architecture layering | `contacts/use-cases/**` (load/write/normalize/soft-delete/duplicate-scan/relationship-inference with repo DI) + `contacts/repository/` interface + `contactsRepositoryAdapter` + `contactUseCases` composition root; legacy `contactService*.ts` paths are stable re-export shims |
| Contacts duplicate-scan SQL closure | `findContactDuplicateCandidateIds` / `findContactDuplicateBlockedIds` on the repository interface — no full active-set walk; shared `buildNamePrefixRegex` / `getContactDuplicateCandidateKeys` are the semantic SSOT |
| Contacts list/filter SSOT | Shared `contactsListQuerySchema` drives SQL `listPage` pagination — in-memory `paginateContacts` helper removed; do not fork contact list/filter flags per route |
| Backend DRY factories | `createCollectionAuditHelper` / `createModulePreferencesService` in `apps/backend/src/lib/` — reused by Contacts / Students / Teachers / Users / Sessions (no per-module forked audit/prefs stores) |
| Contacts↔Students Module*/createModule* DRY | Shared Work/Setup chrome (`Module*`), `createModule*` / `registerModule*` (field-config, lookups, CSV, setup audit, field usage), `startServerBackgroundJob`, soft-delete via `registerResourceRoutes` hooks; thin domain adapters only |
| Teachers Work/Setup REST parity | SQL page/filter + contact-name join (`teacherRepositoryList`), table\|cards, trash/drawer archive, SQL metrics, server CSV, typed Setup (`teacher_field_configs` / `teacher_module_preferences` / `teacher_user_column_prefs` + `registerModule*`); Drizzle `0021_teacher_setup_config` |
| Sessions Work REST parity | SQL page/filter (`sessionRepositoryList`), table\|cards, trash drawer archive chrome, SQL metrics, server CSV |
| Users Work REST parity | SQL page/filter (`tenantUserRepositoryList`), FE `useUsersPaginated` + ListPagination, DetailDrawer archive chrome, SQL metrics, server CSV |
| Sessions typed Setup REST | `session_field_configs` / `session_module_preferences` / `session_user_column_prefs` + `registerModuleSetupConfigRoutes`; Drizzle `0022_session_setup_config`; data migrate `049`/`050`; Query-first `useSessionConfig` |
| Users typed Setup REST | `user_field_configs` / `user_module_preferences` / `user_user_column_prefs` + REST; prefs include `workspaceRoles` + auth `requireEmailVerification`; Drizzle `0023_user_setup_config`; data migrate `051`/`052`; Query-first `useUsersConfig` |

## Open priorities

Residual Work SQL-page debt for **other** modules (not Teachers/Users/Sessions) lives under “SQL pagination / oversized shells” in `mms-migration-status.md`.

### P1 — Soft-delete / schema remaining gaps

**Problem:** Messaging log clear is intentional soft-archive (not a trash browser). Question Bank tests/papers and assessment_results remain upsert-only by design. JSONB entity search/sort may still page in memory after SQL soft-delete filter.

**Fix:** Do not regress Messaging clear or QB papers/results variants without an explicit product change. Users soft-delete is in the squashed baseline (`tenant_users.deleted_at` in `0000_init` + forward migrations). Push SQL pagination when touching list hot paths (`mms-data-layer.md`).

**Skills:** `mms-module-work`, `mms-module-page` (§7), `mms-frontend`, `mms-backend-api`

### P2 — Residual permission / role special cases

**Problem:** Platform `super_user` checks, setup matrices (`RolesPermissions`), and a few non-gate `role` comparisons remain outside module write surfaces.

**Fix:** Prefer `can()` / contract permissions when touching those UIs; do not add new tenant-module `role ===` write gates (`mms-auth-security.md`).

### P3 — Remaining document-store debt (other modules’ prefs / field config)

**Problem:** Other modules’ prefs, field config, and column prefs may still live in `objects`. Contacts + Students + Teachers + Users + Sessions Setup (tabs/lookups where applicable, field-config, preferences, column prefs) is typed REST. Residual: Finance / Attendance / Enrollments / other modules still on document-store.

**Fix:** Prefer typed tables + FORCE RLS when migrating shareable module config; do not reintroduce Contacts/Students/Teachers/Users/Sessions Setup keys into `ALLOWED_OBJECTS` / `ALLOWED_COLLECTIONS` / FE `BUSINESS_COLLECTIONS` (`mms-fields.md`, `mms-data-layer.md`).

### P3b — Nested contact item Zod `.passthrough()`

**Problem:** Top-level `contactWriteSchema` / `buildContactWriteSchema` is strict (closed). Nested phone/email/address item schemas in `contactNestedSchemas.ts` still `.passthrough()` for item flags.

**Fix:** When touching those shapes, prefer `.strict()` / explicit allowlists — `mms-form-architecture.md`. Do not loosen top-level write Zod.

### P4 — Report drill-down & saved reports

**Problem:** Contacts has typed saved reports + share scopes; pinned widgets/visualizer are Query-first. Other modules lag on drill-down / share parity; some niche charts still client-reduce.

**Fix:** Same patterns on other module reports (`mms-reports.md`, skill `mms-reports-export`). Prefer `/metrics` / server aggregates over full-row dumps.

### P5 — Responsive e2e depth

**Problem:** Shells + Work-route smoke are green (`responsive-shell` / `responsive-authenticated`). Platform `md` bottom nav and deep Reports/Setup builders are not asserted.

**Fix:** Extend those specs when touching those surfaces — `mms-ui-ux-design.md` §7, `mms-testing-observability.md`. Do not treat missing depth as license to regress shell overflow/touch floors.

### P6 — FE live push (residual modules)

**Problem:** Contacts / Students / Teachers / Sessions / Enrollments: BE `broadcastCollection` + FE `/api/ws` → Query invalidate is closed. Residual: other modules may still lack emit and/or FE subscribe.

**Fix:** Extend the same channel per `mms-data-layer.md` (cookie auth, reconnect/backoff, invalidate tuple keys only) — ban new polling loops / parallel WS (`mms-core.md`).

### P7 — PG statement timeout budgets (residual)

**Problem:** Tenant-bound budgets ship on `withTenantTransaction` + `runInTransaction` (`PG_STATEMENT_TIMEOUT_MS` / `PG_IDLE_IN_TX_TIMEOUT_MS`). Residual: optional tighter per-route budgets on hot paths.

**Fix:** When touching hot routes, prefer tighter `SET LOCAL` budgets — `mms-data-layer.md` (align with Fastify `requestTimeout`).

## After each fix

```bash
pnpm typecheck && pnpm test
cd apps/backend && pnpm lint   # if BE touched
cd apps/frontend && pnpm lint  # if FE touched
```

Update `mms-migration-status` **Recently resolved** when fully done.

## Rules sync

After changing standards:

```bash
bash .agent/scripts/sync-all.sh
```
