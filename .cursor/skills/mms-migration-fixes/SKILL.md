---
name: mms-migration-fixes
description: Addresses known MMS technical debt from mms-migration-status — remaining gaps only. Use when the user asks to fix migration gaps, align rules with code, or tackle documented debt.
---

# MMS Migration Fixes

Only implement items **in scope** for the current task. Full register: `.cursor/rules/mms-migration-status.mdc` (synced to `.agent` / `.claude`).

## Resolved (do not reintroduce)

| Item | Resolution |
|------|------------|
| Auth seeds shape | `StoredUser` with `role` + `passwordHash` |
| RBAC on `/api/db/*` writes | `rbacService` |
| Nested `ContactConfigProvider` | Single mount in `App.tsx` |
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

## Open priorities

### P1 — Soft-delete / schema remaining gaps

**Problem:** Messaging log clear is intentional soft-archive (not a trash browser). Question Bank tests/papers and assessment_results remain upsert-only by design.

**Fix:** Do not regress Messaging clear or QB papers/results variants without an explicit product change. Users real soft-delete is shipped (`0027_tenant_users_soft_delete`).

**Skills:** `mms-module-work`, `mms-module-page` (§7), `mms-frontend`, `mms-backend-api`

### P2 — Residual permission / role special cases

**Problem:** Platform `super_user` checks, setup matrices (`RolesPermissions`), and a few non-gate `role` comparisons remain outside module write surfaces.

**Fix:** Prefer `can()` / contract permissions when touching those UIs; do not add new tenant-module `role ===` write gates (`mms-auth-security.mdc`).

### P3 — Relational custom fields

**Problem:** Document store only for custom tabs.

**Fix:** `pgTable` + migration per `mms-fields.mdc`.

### P4 — Report drill-down & saved reports

**Problem:** Contacts-only maturity for chart→Work drill-down and saved-report re-run.

**Fix:** Same patterns on other module reports (`mms-reports.mdc`, skill `mms-reports-export`).

### P5 — Responsive e2e depth

**Problem:** Shells + Work-route smoke are green (`responsive-shell` / `responsive-authenticated`). Platform `md` bottom nav and deep Reports/Setup builders are not asserted.

**Fix:** Extend those specs when touching those surfaces — `mms-ui-ux-design.mdc` §7, `mms-testing-observability.mdc`. Do not treat missing depth as license to regress shell overflow/touch floors.

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
