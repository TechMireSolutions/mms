---
description: Frontend hooks — live data, Query, sorted fields, branding, settings
paths:
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/lib/ContactConfigContext.tsx"
  - "apps/frontend/src/lib/contactConfig/**"
  - "apps/frontend/src/lib/contexts/TenantContext.tsx"
---

# MMS Hooks

Colocate in `apps/frontend/src/hooks/`. Pure logic used in 2+ modules → extract to `@mms/shared`, keep hook as thin wrapper.

## Server state (TanStack Query)

| Hook | Purpose |
|------|---------|
| `useWorkspaceRegistry()` | Apex workspace list |
| `useStudentsPaginated()` / `useStudentMutations()` | Paginated Work directory + CRUD |
| `useStudentsByIds()` / `useStudentById()` | Batch/single resolve (§10 cross-module) |
| `useStudentsMetrics()` / `useStudentsWidgetAggregates()` | Command centre + dashboard aggregates |
| `useStudentCount()` | `GET /api/students/count` |
| `useContacts()` / `useContactMutations()` | Contact REST CRUD |
| `useContactsPaginated()` / `useContactsByIds()` | Paginated directory + resolve |

Pattern: `enabled: isAuthenticated`, export `QUERY_KEY` constant, use `apiJson` in `queryFn`, `saveCollection` in fetch when hybrid (`mms-data-layer.md`).

## `useLiveCollection(key, seed?)`

Reactive read of a localStorage collection. Subscribes to `local-database-update`.

```ts
// ✅ Reactive (finance, obligations, etc.)
const hasanat = useLiveCollection('hasanat');

// ❌ Stale after external saves
const [items] = useState(() => getCollection('contacts', CONTACTS));
```

**Note:** `Students.tsx` / `Contacts.tsx` use Query collection hooks — not raw `useLiveCollection` for primary CRUD.

## Domain lookups

| Hook | Purpose |
|------|---------|
| `useObligationLookups()` | Obligation reference data via live collections |
| `useQuestionBankConfig()` | Question bank field/config state |
| `useWorkspaceRoles()` | Workspace role metadata |

## `useSortedFields(registry, tabKey?)`

Fields filtered by `enabled`, sorted by `order`. Use with `FormPrimitives` — not hardcoded field lists.

## Settings & branding

| Hook | Purpose |
|------|---------|
| `useGlobalSettings()` | Reactive `global_settings` (incl. `enabledModules`, theme) |
| `useBranding()` | Branding CSS variables from `branding` object |
| `useBrandingDraft()` / `useThemeSettingsDraft()` / `useSettingsDraft()` | Settings preview before save (`mms-settings-i18n.md`) |
| `useSavedFlash()` | 2.5s post-save flash for settings panel footers |
| `useApplyLogoColors()` | Samples logo → applies primary/secondary via `extractLogoBrandColors` |
| `useBackupRestore()` | Backup export/import/decrypt/restore/history state machine |
| `useBrandedDashboardChartColors()` | Chart palette from branding |
| `useTenantBranding()` | Blocks auth UI until public branding fetched |
| `useWorkspaceBySubdomain()` | TanStack Query workspace lookup by subdomain |
| `usePublicBranding()` | Fallback public branding query |

One-shot reads outside React: `getGlobalSettings()`, `getBrandingSettings()`.

## Contact config (context-backed)

| Hook / export | Source |
|---------------|--------|
| `useContactConfig()` | `ContactConfigContext.tsx` |
| `useContactColumns()` | same |
| `useContactValidation()` | same |
| `calculateProfileCompleteness`, schema builders | `lib/contactConfig/*` (re-exported from context) |

Provider at `App.tsx` root only — never nest on child pages.

## RBAC & viewer

| Hook | Purpose |
|------|---------|
| `usePermissions()` / `can()` | `@mms/shared` permission matrix — **prefer over `role ===`** |
| `useViewerRole()` / `useIsAdminViewer()` | Legacy role normalization — migrate when touching module |

Hotspots still on `role ===`: `Dashboard.tsx`, `WelcomeBanner.tsx`, `KPISummary.tsx`, `Attendance.tsx`, `MarkAttendance.tsx` (`mms-auth-security.md`).

## UI shell & UX

| Hook | Purpose |
|------|---------|
| `useModuleTierTabs()` | `work` / `reports` / `setup` |
| `useConfigSubTabs()` / `usePersistedTabState()` | Sub-tab persistence |
| `useTranslation()` | `t`, `lang`, `dir` — all new copy via `t()` |
| `useBodyScrollLock(active?)` | Reference-counted modal scroll lock |
| `useSessionTimeout()` | Idle logout from global settings |
| `useDebounce()` | Input debouncing |
| `use-mobile.tsx` | Responsive breakpoint helper |

Never set `document.body.style.overflow` manually — use `useBodyScrollLock`.

## New hooks checklist

- [ ] No polling — events or TanStack Query
- [ ] Internal API via `apiClient`
- [ ] Export query keys when using Query
- [ ] `enabled: isAuthenticated` for tenant REST
- [ ] Test pure wrappers where ROI is high (`mms-testing-observability.md`)
