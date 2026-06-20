---
trigger: model_decision
---

# MMS Frontend

App shell, bundles, and cross-cutting FE concerns. Module/UI detail lives in scoped rules (`mms-ui-*`, `mms-contacts`, `mms-query`, etc.).

## Source layout

| Path | Role |
|------|------|
| `pages/` | Route-level module shells, auth, apex landing |
| `providers/` | Root provider composition (`AppProviders.tsx`) |
| `components/{module}/` | Feature UI by domain |
| `components/ui/` | shadcn/Radix primitives + MMS composites (`PageHeader`, `FormModal`, `SubTabBar`, `ErrorBoundary`) |
| `components/routing/` | `HostRoutes`, guards, `PageNotFound`, `RouteLoadingFallback`, `RootErrorBoundary` |
| `components/layout/` | `AppLayout`, sidebar |
| `components/dev/` | Dev-only tooling (`QueryDevtools`) |
| `hooks/` | Reusable hooks — server state + live collections |
| `lib/apiClient.ts`, `lib/db.ts`, `lib/notify.ts` | Core infrastructure |
| `lib/contexts/` | React contexts (`AuthContext`, `TenantContext`, …) |
| `lib/config/` | `env`, `routes`, `navConfig`, `tenantConfig`, `settingsNavConfig`, `settingsSectionComponents`, `moduleIcons` |
| `lib/settingsPreview.ts`, `lib/settingsPreviewStore.ts` | Live settings preview overlay |
| `lib/settingsGlobalDraft.ts`, `lib/settingsModulesDraft.ts` | Global/Modules panel draft helpers |
| `lib/backup/` | Backup download, history entry, restore types |
| `lib/extractLogoBrandColors.ts` | Canvas logo sampling → `@mms/shared` palette |
| `lib/routing/` | `appNavigate`, `routePrefetch` |
| `lib/data/` | Module seed/mock collections (`*Data.ts`) |
| `lib/contactConfig/` | Contact validation, prefs, profile metrics (split from context) |

Path alias: `@/` → `apps/frontend/src/`

## API client (required)

All **internal** MMS API calls use `lib/apiClient.ts`:

```ts
import { apiFetch, apiJson } from '@/lib/apiClient';

const data = await apiJson<{ students: Student[] }>('/api/students');
await apiFetch('/api/students/1', { method: 'DELETE' });
```

| Do | Don't |
|----|-------|
| `apiFetch` / `apiJson` with `credentials: 'include'` | Raw `fetch('/api/...')` in hooks, contexts, or lib helpers |
| External OAuth (Google People API, etc.) | — may use raw `fetch` to third-party URLs only |

**Session:** httpOnly cookies (`mms_access` / `mms_refresh`) — `apiClient` does **not** read or write `localStorage` tokens. Backend `attachAccessTokenFromCookie` copies cookie → `Authorization` for JWT verify (`mms-auth.md`).

## Bundle size

Dynamic `import()` for heavy libs — never static entry imports:

- `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas`

Track main chunk on `pnpm build`; investigate regressions > 10% without new features.

## Images

Every image upload **must** be optimized client-side before persisting — `@mms/shared`:

- File inputs → `optimizeImage(file)` (AVIF → WebP → original)
- Canvas exports → `canvasToOptimizedDataUrl(canvas, quality)`
- Never persist raw `File`/`FileReader` data URLs or call `canvas.toDataURL` directly

## Routing

| Piece | Path |
|-------|------|
| Entry | `src/main.tsx` → `App.tsx` |
| Route tree | `components/routing/HostRoutes.tsx` (apex vs tenant — **single tree**, never both) |
| Guards | `ProtectedRoute`, `GuestRoute`, `TenantBootGate`, `ApexWorkspaceGate` |
| Path constants | `lib/config/routes.ts` (`ROUTES`, `TENANT_APP_PATHS`, `PUBLIC_PATHS`) |
| Nav | `lib/config/navConfig.tsx` |
| Imperative nav | `lib/routing/appNavigate.ts` via `RouterBridge` (logout redirects) |
| Route prefetch | `lib/routing/routePrefetch.ts` on sidebar link hover/focus |

- Lazy-load pages with `React.lazy` + `Suspense`; fallback uses `t('common.loading')` + `role="status"`
- No orphan pages without routes
- Do not add duplicate auth wrappers in `App.tsx` — guards live in `components/routing/` (`mms-auth.md`)
- **Apex:** landing, onboarding, workspace gate — module paths redirect to gate
- **Tenant:** `ProtectedRoute` → `AppLayout` → module pages

## Provider tree (`providers/AppProviders.tsx`)

```
RootErrorBoundary → AuthProvider → QueryClientProvider → Router → BrandingPaletteProvider → TenantProvider → PlatformAuthProvider → ContactConfigProvider
```

- `App.tsx` mounts `<AppProviders>` then `<AuthenticatedApp />` (auth gate + lazy `Suspense` routes)
- `AuthenticatedApp` blocks only on **initial** `GET /api/auth/me` (`isLoadingAuth && !authChecked`) — not on login submit
- `Toaster` + `QueryDevtools` sit inside `QueryClientProvider`, outside `Router`
- `ContactConfigProvider` mounts **once** at root — never on child pages (`mms-contacts.md`)

## TanStack Query defaults

`lib/query-client.ts`: `refetchOnWindowFocus: false`, `retry: 1`. Per-hook `staleTime: 30_000` for REST lists.

## Data fetching

| Data | Pattern | Owner |
|------|---------|-------|
| Dedicated REST (`/api/students`, `/api/contacts`, workspace) | TanStack Query + `apiJson` | `mms-query.md` |
| Local collections (most modules) | `useLiveCollection` + `saveCollection` | `mms-data-layer.md` |
| Cross-view refresh (local) | `local-database-update` event | `mms-data-layer.md` |

### Module inventory (current)

| Module / area | Data pattern |
|---------------|--------------|
| Students | Query (`useStudents`, `useStudentMutations`) |
| Contacts | Query + hybrid (`useContacts`, `useContactsCollection`) |
| Workspace registry (apex) | Query (`useWorkspaceRegistry`) |
| Dashboard | Hybrid students/contacts + many `useLiveCollection` |
| Finance, Accounting, Obligations, Hasanat, Sessions, Users, Attendance, Enrollments, Examinations, QuestionBank | `useLiveCollection` only |
| Auth / tenant branding | `useEffect` + `apiJson` — migrate to Query when touched |

**Hybrid pattern:** Query is source of truth; `saveCollection` on fetch keeps KPI/report widgets on localStorage in sync until those views migrate:

```ts
// hooks/useStudents.ts / useContacts.ts pattern
export function useStudentsCollection() {
  const { data: fromQuery = [] } = useStudents();
  const fromLocal = useLiveCollection<Student>('students');
  return fromQuery.length > 0 ? fromQuery : fromLocal;
}
```

Avoid bare `fetch` in `useEffect` for server state.

## Settings page (`/settings`)

Thin orchestrator pattern — detail in `mms-settings-navigation.md` + `mms-config.md`.

| Piece | Path |
|-------|------|
| Page shell | `pages/Settings.tsx` — `SETTINGS_NAV` + `SETTINGS_SECTION_COMPONENTS` |
| Nav config | `lib/config/settingsNavConfig.ts` |
| Lazy sections | `lib/config/settingsSectionComponents.tsx` |
| Panels | `components/settings/{Global,Branding,Theme,SystemModules,Backup}*.tsx` |
| Sub-sections | `components/settings/backup/*`, `components/settings/modules/ModuleSettingsNavGrid.tsx` |
| Shared shell | `components/ui/SettingsShell.tsx`, `SettingsFormActions.tsx` |

New settings section checklist: add id to `SETTINGS_SECTIONS` + `SETTINGS_NAV` + `SETTINGS_SECTION_COMPONENTS`; panel uses `useSettingsDraft` or domain draft hook; preview via `settingsPreview.ts`; i18n via `t()`.

## Large module files

Split by concern — keep page files thin:

| Module | Subfolder |
|--------|-----------|
| Contact config | `lib/contactConfig/` (profileMetrics, prefsStorage, validationSchema) |
| Pinned widgets | `components/reports/pinnedWidgets/` (types, widgetDataUtils, widgetDefaults) |
| Settings backup | `hooks/useBackupRestore.ts` + `lib/backup/*` + `components/settings/backup/*` |
| Settings modules | `components/settings/modules/ModuleSettingsNavGrid.tsx` |

Re-export from the original entry file so imports stay stable.

## Real-time

- **Now:** `local-database-update` event bus for localStorage sync
- **Target:** WebSockets for server push
- **Banned:** `setInterval` / `refetchInterval` polling loops

## Responsive

- Mobile-first Tailwind breakpoints
- Min 44×44px touch targets
- Modals/drawers usable at 320px width
- Flex/Grid + `min-w-0` — prevent overflow horizontal scroll
- Multi-tab shells: `ResponsiveAccordionTabs` (`mms-ui-tabs.md`)

## Resilience & a11y

- Lazy route `Suspense` fallbacks: accessible loading text (`t('common.loading')`)
- Module pages: `ErrorBoundary` on Work/Reports content (`mms-observability.md`)
- New UI: keyboard + `aria-label` baseline — `mms-a11y.md`
- API/query failures: `notify.error` with `t()` — no silent `catch`

## Testing

| Layer | Location |
|-------|----------|
| Unit | Vitest + `happy-dom` (`vitest.config.ts`); colocate `*.test.ts` |
| E2E | `e2e/smoke.spec.ts`, `e2e/interactive.spec.ts` (repo root, Playwright) |

- Mock `fetch` at boundaries; test `apiClient` sends `credentials: 'include'`
- Expand Playwright for login/onboard when touching auth (`mms-testing.md`)

## Quality gate

After substantive edits:

```bash
cd apps/frontend && pnpm typecheck && pnpm lint && pnpm test
```
