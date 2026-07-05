---
trigger: always_on
---

# MMS Migration Status

Rules describe **target architecture**. Open gaps below — fix when the task covers them.

| Area | Current state | Target (rules) |
|------|---------------|----------------|
| Hardcoded labels/colours | Widespread in modules | Config/registry + `t()` — `mms-settings-i18n.md` |
| TanStack Query | Students + contacts + workspace registry + auth; most modules still localStorage | New REST resources Query-first — `mms-data-layer.md` |
| `can()` permissions hook | Shipped; Enrollments + Attendance wired; registry partial | Full registry-driven matrix — `mms-auth-security.md` |
| Inline `role ===` checks | Dashboard widget filtering uses `resolveDashboardRole(can)`; `useViewerRole` derives from `can()` | Full registry-driven matrix — `mms-auth-security.md` |
| Custom tab provisioning | JSON document store only | Table + migration + CRUD per custom tab — `mms-fields.md` |
| WebSockets | Not implemented | Replace polling for server push — `mms-core.md` |
| Work/Reports sub-tabs | Residual inline bars in deep components | `SubTabBar` per `mms-ui-ux-design.md` |
| `category="academic"` in reports/KPI | Removed from module pages | Module-specific categories only (`mms-module-architecture.md`) |
| Legacy entity forms | ObligationModal, some detail drawers | `FormModal` — `mms-ui-ux-design.md` |
| Status colours inline | Residual in chart color maps | `StatusBadge` + semantic tokens — `mms-ui-ux-design.md` |
| Automated tests | Shared + backend (auth, rbac, health, security); frontend apiClient + hooks; Playwright API + Contacts UI in CI `e2e/` | Expand Playwright for login/onboard — `mms-testing-observability.md` |
| Server-first data | Students + contacts Query-first; most modules localStorage primary | Query + API authoritative for new modules — `mms-data-layer.md` |
| Per-entity REST API | Students, contacts, teachers, finance, enrollments, obligations, accounting, hasanat, examinations, question-bank, users, attendance, and sessions have resource routes; generic `/api/db` still serves legacy sync paths | Resource routes + validation per domain — `mms-api-interface.md` |
| Internal `fetch('/api/...')` | External OAuth only | All MMS API via `apiClient` — `mms-api-interface.md` |
| Client error reporting | Console/toasts only | Sentry or equivalent — `mms-testing-observability.md` |
| Global a11y pass | Partial (dropdowns only) | WCAG baseline on new UI — `mms-ui-ux-design.md` |
| Universal module architecture | All modules have `{Module}ModuleContract` + command centre metric strips | Report drill-down on remaining modules |
| Soft deletion | Contacts REST soft delete + restore + bulk; most modules hard DELETE | `deletedAt` per module; restore API where needed |
| Report drill-down | Contacts chart → Work filters wired | Same pattern on other module reports |
| Saved reports re-run | Contacts `ContactsSavedReports` + REST; generic `SavedReports` empty | Per-module saved logic presets |
| Background job queue | Async off-request workers; Contacts CSV export + duplicate scan; artifact download API; accounting/obligations tray exports | Dedicated job queue infra (Redis/worker process) for multi-instance deploy |

## Recently Resolved (Do not reintroduce)

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

Do not reintroduce resolved violations.
