---
trigger: always_on
---

# MMS Migration Status

Rules describe **target architecture**. Open gaps below — fix when the task covers them.

| Area | Current state | Target (rules) |
|------|---------------|----------------|
| Hardcoded labels/colours | Widespread in modules | Config/registry + `t()` — `mms-settings-i18n.md` |
| Permission matrix completeness | Module contracts + `useModulePermissions` on major write surfaces; some setup/role UIs still special-case | Full registry-driven matrix everywhere — `mms-auth-security.md` |
| Inline `role ===` checks | Residual: platform console `super_user`, chat `msg.role`, metrics counting, `useViewerRole` teacher→staff alias | Prefer `can()` / contract permissions; no new module write gates via `role ===` |
| Custom tab provisioning | JSON document store only | Table + migration + CRUD per custom tab — `mms-fields.md` |
| WebSockets | Not implemented | Replace polling for server push — `mms-core.md` |
| Work/Reports sub-tabs | Residual inline bars in deep components | `SubTabBar` per `mms-ui-ux-design.md` |
| `category="academic"` in reports/KPI | Removed from module pages | Module-specific categories only (`mms-module-architecture.md`) |
| Legacy entity forms | Some deep module sheets | `FormModal` / `Modal` / `DetailDrawerShell` — `mms-ui-ux-design.md` |
| Status colours inline | Residual in chart color maps | `StatusBadge` + semantic tokens — `mms-ui-ux-design.md` |
| Automated tests | Shared + backend (auth, rbac, health, security); frontend apiClient + hooks; Playwright onboard/login + Contacts + navigation in `e2e/` | Broaden Playwright beyond Contacts/onboard critical path — `mms-testing-observability.md` |
| Global a11y pass | Partial (dropdowns + ContactPicker labels); not a full WCAG sweep | WCAG baseline on new UI — `mms-ui-ux-design.md` |
| Universal module architecture | All modules have `{Module}ModuleContract` + command centre metric strips | Report drill-down on remaining modules |
| Soft deletion (remaining modules) | Contacts + Students + Teachers have REST soft delete/restore + Work trash UI; messaging logs soft-delete via `deletedAt` (admin clear); enrollments/attendance/finance invoices soft-delete APIs exist without full FE trash parity | FE trash/restore parity (or documented hard-delete) per remaining REST modules |
| Report drill-down | Contacts chart → Work filters wired | Same pattern on other module reports |
| Saved reports re-run | Contacts `ContactsSavedReports` + REST; generic `SavedReports` empty | Per-module saved logic presets |
| Background job queue | Async off-request workers; Contacts CSV export + duplicate scan; artifact download API; accounting/obligations tray exports | Dedicated job queue infra (Redis/worker process) for multi-instance deploy |

## Recently Resolved (Do not reintroduce)

- **Client Error Reporting (Sentry)**: Integrated client-side error boundaries with Sentry instrumentation in `main.tsx`.
- **Per-Entity REST APIs**: Migrated students, contacts, teachers, finance, enrollments, obligations, accounting, hasanat, examinations, question-bank, users, attendance, and sessions to dedicated server-authoritative REST routes.
- **Internal API Communications**: Banned raw `fetch('/api/...')` calls in favor of the typesafe `apiClient` (`apiFetch`/`apiJson`).
- **TanStack Query & Server-First Data**: Refactored all 11 frontend modules to use TanStack Query hooks, replacing legacy client-side localStorage synchronization as the primary data source.
- **Slide-Over Drawer Shell Layouts**: Unified student detail drawer and contact detail drawer to use the central `<DetailDrawerShell>` primitive component, resolving layout, backdrop trigger, and spring animation duplication.
- **Generic Saved Reports Overlay**: Integrated a generic `<SavedReports>` panel overlay tab in `ModuleReports.tsx` to dynamically run saved filter presets and redirect back to dashboards.
- **Removed custom ObligationModal wrapper**: Deleted redundant `ObligationModal.tsx` and replaced it with direct `<Modal>` usage inside `ObligationCollectionDetail.tsx`.
- **Contacts REST & RBAC**: Standardized `/api/contacts` CRUD with soft-delete, deduplication/merging, sync conflict review, and server-side column preferences.
- **REST APIs (Students, Sessions, Attendance)**: Migrated major collections from client-side localStorage to server authoritative REST endpoints with TanStack Query.
- **Authentication & Security**: Migrated auth to httpOnly session cookies (`mms_access` and `mms_refresh`), opaque refresh tokens, server-side 2FA challenges (`auth_artifacts`), and tenant JWT binding. Removed local storage JWT.
- **Branding & Settings**: Refactored Settings page into section sub-components, live settings drafts preview, and WCAG AA accessible branding theme logic.
- **Cross-Module Boundaries**: Replaced direct collection imports with paginated `/api/...` pagination, batch resolution endpoints (`/resolve`), and server KPI analytics, removing legacy frontend list queries.
- **Offline/Sync UX & Columns**: Shipped conflict resolution merge logic on sync and `userColumnPrefsService` workspace column customizing.
- **Metrics & Subdomains**: Enabled server-side `/metrics` endpoints, Work metrics strips, and dynamic subdomain Google OAuth synchronization lifecycles.
- **Composite Keys & Relational Schemas**: Converted primary keys of migrated tables to composite `(workspace_subdomain, id)` keys to ensure strict tenant isolation in schema.ts.
- **Form Progress Scanning**: Implemented automatic progress tracking inside FormModal.tsx for both multi-tab and single-page forms.
- **Linter Cleanups**: Resolved 100% of react-hooks dependency and unused variable lint errors across all feature modules.
- **Unified Phone & Zero-Click Form Rows**: Consolidated split phone fields in ContactForm into a single input field, and implemented automatic first-row pre-population for form lists (phones, emails, addresses, socials, emergency contacts) with background cleanups.
- **DRY Metrics & Modernized Dashboards**: Extracted quick metrics cards into a central `<ModuleCommandMetricsGrid />` component across all 11 modules, and upgraded reports/KPI dashboard widgets with semantic accents and staggered Framer Motion transitions.
- **Unified SEO & Container Layouts**: Converted hardcoded SEO header strings to localized translation mappings (`t()`) and unified margins/spacing limits consistently across all pages.
- **Design System Primitives**: Refactored raw HTML `<select>`, `<textarea>`, `<input>`, and Radix checkbox controls across all 11 modules to use `FormSelect`, `Textarea`, `Input`, `SearchBar`, and `Checkbox` design system primitives. Cleaned up all unused variables and linter warnings to achieve a 100% clean compilation and lint state.
- **Consolidated Stats Cards, Export Toolbars & SafeResponsiveContainer**: Merged duplicate local metrics cards and data export toolbars across all feature modules and reports into unified, central primitives (`StatCard` and `ExportToolbar`). Relocated Recharts chart wrappers to the shared design system folder (`SafeResponsiveContainer`) and standardized imports to eliminate zero-width layout rendering warnings.
- **Sentry Client-Side Error Reporting**: Configured and integrated Sentry and `ErrorState` with global React ErrorBoundary fallback rendering and error type verification in `main.tsx`.
- **RBAC Read Hardening**: Hardened `rbacService.ts` mapping and logic by explicitly checking permissions for `user_activity_logs` and `backups` collection reads/writes.
- **Unused Component Cleanup & Initials DRY Refactoring**: Deleted leftover duplicate components (`ExportToolbar.tsx`, `SafeResponsiveContainer.tsx`, `ReportExportBar.tsx`, `ReportSummaryCard.tsx`) and refactored manual avatar initials formatting across 14 components to use the shared `getInitials` helper.
- **Redundant StatsGrid Proxy & Date Formatting DRY**: Cleaned up the redundant `StatsGrid.tsx` proxy file by importing directly from `StatisticsGrid.tsx` in `DashboardPage.tsx`. Standardized raw `.toLocaleString()` date formatting calls across the frontend to utilize the centralized global settings-aware `formatDateTime` helper.
- **Date & Money formatting consistency DRY**: Refactored raw date string renderings and manual `.toLocaleString()` calls on currency values in the frontend to resolve through settings-aware `formatDate` and `formatMoney` helpers, eliminating duplicate formatting code.
- **Settings-Aware Currency Formatting & Unified Date Filters**: Refactored the frontend's accounting and finance feature modules to use settings-aware hooks (`useAccountingCurrency` and `useFinanceCurrency`), eliminating hardcoded `"PKR"` defaults and currency prop-drilling. Consolidated duplicate date range input fields, labels, and fiscal-year presets across reporting subpanels into the reusable `<AccountingDateFilterBar>` component.
- **Accounting Module Localization & DRY Refactoring**: Refactored the entire Accounting feature module to eliminate all remaining hardcoded strings, placeholders, and fallback strings across all 14 components, the main page shell, and configuration helpers, ensuring 100% localization coverage and compliance with workspace standards.
- **Workspace-wide Settings-Aware Currency DRY Refactoring**: Refactored the remaining frontend feature modules (Reports, Obligations, Sessions, and Dashboard Widgets) to eliminate all hardcoded `"PKR"` defaults and manual `.replace("PKR ", "")` string hacks, formatting all currency and amount fields dynamically using settings-aware `useFinanceCurrency` hooks or item-specific currency configurations.
- **Module write-surface `can()` gates**: Wired `useModulePermissions({Module}ModuleContract)` + `useFilteredModuleTierTabs` on Finance, Accounting, Examinations, Hasanat, Question Bank, Users, Students (row/bulk), Teachers, Attendance, Enrollments, Sessions, Messaging, and Contacts — omit forbidden CTAs (never disabled placeholders).
- **Students & Teachers soft-delete Work UI**: `includeDeleted` list queries, restore + bulk restore mutations, Show deleted / Show active toolbar toggle, trash-mode row/bulk actions (Contacts-style, simpler). Backend `DELETE` + `POST :id/restore` already existed.
- **Contacts gender list filter**: `filterContactsForQuery` / student gender filters match case-insensitively so Father/Mother pickers (`filterGender=male|female`) find Title-Case stored values.
- **ContactPicker label association**: Search inputs use `<label htmlFor>` for a11y and stable Playwright `getByLabel` selectors.
- **Onboarding E2E critical path**: `e2e/tests/onboarding-login.spec.ts` covers platform setup → tenant onboard → contacts → student with guardians → attendance bulk submit.

Do not reintroduce resolved violations.

