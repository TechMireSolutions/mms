---
trigger: always_on
---

# MMS Migration Status

Rules describe **target architecture**. Open gaps below — fix when the task covers them.

| Area | Current state | Target (rules) |
|------|---------------|----------------|
| Hardcoded labels/colours | Widespread in modules | Config/registry + `t()` — `mms-i18n.md` |
| TanStack Query | Students + contacts + workspace registry + auth; most modules still localStorage | New REST resources Query-first — `mms-query.md` |
| `can()` permissions hook | Shipped; Enrollments + Attendance wired; registry partial | Full registry-driven matrix — `mms-rbac.md` |
| Inline `role ===` checks | Dashboard widget filtering uses `resolveDashboardPersona(can)`; `useViewerRole` derives from `can()` | Full registry-driven matrix — `mms-rbac.md` |
| Custom tab provisioning | JSON document store only | Table + migration + CRUD per custom tab — `mms-fields.md` |
| WebSockets | Not implemented | Replace polling for server push — `mms-core.md` |
| Work/Reports sub-tabs | Residual inline bars in deep components | `SubTabBar` per `mms-ui-tabs.md` |
| `category="academic"` in reports/KPI | Removed from module pages | Module-specific categories only (`mms-module-isolation.md`) |
| Legacy entity forms | ObligationModal, some detail drawers | `FormModal` — `mms-ui-forms.md` |
| Status colours inline | Residual in chart color maps | `StatusBadge` + semantic tokens — `mms-ui-visual.md` |
| Automated tests | Shared + backend (auth, rbac, health, security); frontend apiClient + hooks; Playwright API + Contacts UI in CI `e2e/` | Expand Playwright for login/onboard — `mms-testing.md` |
| Server-first data | Students + contacts Query-first; most modules localStorage primary | Query + API authoritative for new modules — `mms-data-layer.md` |
| Per-entity REST API | `/api/students` + `/api/contacts` CRUD; generic `/api/db` for rest | Resource routes + validation per domain — `mms-backend.md` |
| Internal `fetch('/api/...')` | External OAuth only | All MMS API via `apiClient` — `mms-frontend.md` |
| JWT in localStorage | Removed — httpOnly cookies only; `apiClient` has no token reads | — resolved |
| Client error reporting | Console/toasts only | Sentry or equivalent — `mms-observability.md` |
| Global a11y pass | Partial (dropdowns only) | WCAG baseline on new UI — `mms-a11y.md` |
| Universal module architecture | All modules have `{Module}ModuleContract` + command centre metric strips | Report drill-down on remaining modules |
| Module command centre metrics | All modules — server `/metrics` + Work metric strips | — resolved |
| Soft deletion | Contacts REST soft delete + restore + bulk; most modules hard DELETE | `deletedAt` per module; restore API where needed |
| Offline/sync UX | Contacts: per-field merge + server fetch at conflict | — resolved |
| Report drill-down | Contacts chart → Work filters wired | Same pattern on other module reports |
| Saved reports re-run | Contacts `ContactsSavedReports` + REST; generic `SavedReports` empty | Per-module saved logic presets |
| Per-user column prefs | Shared `userColumnPrefsService`; all modules REST + Work customizer | — resolved |
| Background job queue | Async off-request workers; Contacts CSV export + duplicate scan; artifact download API; accounting/obligations tray exports | Dedicated job queue infra (Redis/worker process) for multi-instance deploy |
| Google sync OAuth | Server per-user config + `POST /google-sync/audit` lifecycle events | — resolved |

## Recently Resolved (Do not reintroduce)

- **Contacts REST & RBAC**: Standardized `/api/contacts` CRUD with soft-delete, deduplication/merging, sync conflict review, and server-side column preferences.
- **REST APIs (Students, Sessions, Attendance)**: Migrated major collections from client-side localStorage to server authoritative REST endpoints with TanStack Query.
- **Authentication & Security**: Migrated auth to httpOnly session cookies, opaque refresh tokens, server-side 2FA challenges (`auth_artifacts`), and tenant JWT binding.
- **Branding & Settings**: Refactored Settings page into section sub-components, live settings drafts preview, and WCAG AA accessible branding theme logic.
- **Cross-Module Boundaries**: Replaced direct collection imports with paginated `/api/...` pagination, batch resolution endpoints (`/resolve`), and server KPI analytics, removing legacy frontend list queries.

Do not reintroduce resolved violations.
