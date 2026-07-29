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
| Automated tests | Broad onboard + module E2E | Remaining write flows (obligations, etc.) |
| Global a11y | Partial | WCAG baseline on new UI |
| Report drill-down / saved reports | Partial (Contacts + several modules) | Remaining niche panels + per-module saved logic |
| Background job queue | Async workers + tray exports | Dedicated Redis/worker for multi-instance |
| Secure HTTP headers / CSP | Partial | Helmet + SPA-safe CSP — `mms-auth-security.md` |
| React Compiler / memo hygiene | Ad-hoc memo still appears | Compiler-first — `antigravity-global.md` |
| Query-first reports | Some live-collection panels remain | Server aggregates + Query — `mms-reports.md` |
| FORCE RLS on new tables | Messaging FORCE RLS; older tables may vary | Composite PK + RLS + FORCE — `mms-data-layer.md` |

## Do not reintroduce (themes)

Keep these regressions out of new work (details historically resolved — do not expand this list opportunistically):

- Per-entity REST + TanStack Query as primary; no mutation dual-write via `saveCollection`
- Cookie httpOnly sessions (`mms_access` / `mms_refresh`); no localStorage JWT
- Soft-delete Work trash pattern (Contacts-style) except documented Messaging clear + QB papers/results upsert-only
- Gold-standard §7: upsert bulk PUT, `mutateAsync`, `setupSubTabs` / `canEditSetup`, `ErrorState`, Cmd/Ctrl+N, `t()` + `useModulePermissions`
- Contact-first persons; no `persona` / CRM lifecycle tags
- `apiClient` only — no raw `fetch('/api/...')`
- FormModal for entity forms; Modal for confirm/preview; Design-system primitives + semantic tokens
- Messaging: soft-archive log clear; composite PK + RLS; session-forced `userId`
