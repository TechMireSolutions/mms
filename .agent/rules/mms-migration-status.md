---
trigger: always_on
---

# MMS Migration Status

Rules describe **target architecture**. Fix open gaps only when the task covers them — do not expand scope into debt cleanup.

## Open gaps

| Area | Current | Target |
|------|---------|--------|
| Residual hardcoded niche copy | Major shells localized | Full `t()` + registries — `mms-settings-i18n.md` |
| Permission matrix | Manifests on major writes; some setup/role UIs special-case | Full registry-driven matrix — `mms-auth-security.md` |
| Residual `role ===` | Platform console, chat roles, metrics aliases | Prefer `can()` / contract permissions |
| Custom tab provisioning | JSON document store only | Table + migration + CRUD — `mms-fields.md` |
| WebSockets / SSE | Not implemented | Replace polling for live push — `mms-core.md` |
| Residual deep sub-tab bars | ComparisonMode + JournalEntries on `SubTabBar`; niche leftovers | `SubTabBar` everywhere — `mms-ui-ux-design.md` |
| Status chart palettes | Most StatusBadge on SEMANTIC_BADGE | All semantic tokens |
| Automated tests | Broad onboard + module E2E; responsive Work/public smoke | Remaining write flows; responsive depth (platform `md` nav, Reports/Setup builders) — `mms-ui-ux-design.md` §7 |
| Global a11y | Partial | WCAG baseline on new UI |
| Report drill-down / saved reports | Contacts on typed `saved_reports` + share scopes; other modules vary | Remaining niche panels + per-module drill-down parity — `mms-reports.md` |
| Background job queue | Async workers + tray exports | Dedicated Redis/worker for multi-instance |
| Secure HTTP headers / CSP | Partial | Helmet + SPA-safe CSP — `mms-auth-security.md` |
| React Compiler / memo hygiene | Ad-hoc memo still appears | Compiler-first — `antigravity-global.md` |
| Query-first reports | Some live-collection panels remain | Server aggregates + Query — `mms-reports.md` |
| Document-store settings / prefs | Prefs, field config, lookup lists still in `objects` | Prefer typed tables + FORCE RLS for new secrets / shareable presets — `mms-data-layer.md` |
| Full SQL pagination for JSONB entities | Soft-delete filtered in SQL; search/sort still in-memory for contacts | Push page/filter into SQL where indexes allow — `mms-data-layer.md` |

## Do not reintroduce (themes)

Keep these regressions out of new work (details historically resolved — do not expand this list opportunistically):

- Per-entity REST + TanStack Query as primary; no mutation dual-write via `saveCollection`
- Cookie httpOnly sessions (`mms_access` / `mms_refresh`); no localStorage JWT
- Soft-delete Work trash pattern (Contacts-style) except documented Messaging clear + QB papers/results upsert-only
- Gold-standard §7: upsert bulk PUT, `mutateAsync`, `setupSubTabs` / `canEditSetup`, `ErrorState`, Cmd/Ctrl+N, `t()` + `useModulePermissions`
- Work Filters menu SSOT — no parallel preset chip/pill bar duplicating Filters options (Contacts: `ContactsFilterMenuButton` + shared `CONTACTS_QUICK_FILTER_OPTIONS`)
- Work directory view mode SSOT — one resolved `viewMode` (default cards `< md`, table `md+`); no CSS dual-render + override parallel systems; Setup `defaultViewLayout` must not drive Work directory render
- Contact-first persons; no `persona` / CRM lifecycle tags
- `apiClient` only — no raw `fetch('/api/...')`
- FormModal for entity forms; Modal for confirm/preview; Design-system primitives + semantic tokens
- Messaging: soft-archive log clear; composite PK + RLS; session-forced `userId`
- Mobile-first shells: no page-level horizontal overflow; 44×44 touch floors on primitives; tenant nav collapse `< lg`; platform nav collapse `< md`; tables in `overflow-x-auto` — `mms-ui-ux-design.md` §7
- **FORCE RLS** on new tenant tables (Messaging + Contacts/students/teachers/sessions + `contact_google_sync_credentials` / `saved_reports` pattern)
- **OAuth / long-lived secrets** in FORCE-RLS tenant tables — never in unscoped `objects` KV (legacy `contact_google_sync_by_user` is strip-only)
- **Client soft-delete fields** on create/update bodies — strip via write schema + `stripContactClientSoftDeleteFields`; only dedicated soft-delete helpers set them
- **Server-persisted imports** must not be re-upserted from the FE after bulkSave (invalidate Query keys only)
- Contacts saved reports live in typed `saved_reports` (`category: 'contacts'`); do not resurrect `contacts_saved_reports` object writes
- Contacts entity rows are REST-only (typed `contacts` table); do not re-add `contacts` to `ALLOWED_COLLECTIONS` or FE `BUSINESS_COLLECTIONS`
- Typed `deleted_at` is the SQL soft-delete source of truth for list filters; do not rely on JSONB `deletedAt` alone
- Unknown tenant host → apex hard-redirect `/tenant-not-found?subdomain=…` — never keep the bad subdomain URL or mount `/settings` there — `mms-settings-i18n.md` / `mms-ui-ux-design.md` §8
