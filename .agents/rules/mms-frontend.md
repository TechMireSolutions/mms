---
trigger: model_decision
---

# MMS Frontend

App shell, bundles, and cross-cutting FE concerns. Module/UI detail lives in scoped rules (`mms-ui-*`, `mms-contacts`, `mms-query`, etc.).

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
| External OAuth (Google, etc.) | — may use raw `fetch` to third-party URLs only |

Legacy `mms_token` in localStorage is sent as Bearer fallback — do not add new localStorage token writes.

## Bundle size

Dynamic `import()` for heavy libs — never static entry imports:

- `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas`

## Images

Every image upload **must** be optimized client-side before persisting — `@mms/shared`:

- File inputs → `optimizeImage(file)` (AVIF → WebP → original)
- Canvas exports → `canvasToOptimizedDataUrl(canvas, quality)`
- Never persist raw `File`/`FileReader` data URLs or call `canvas.toDataURL` directly

## Routing

| Piece | Path |
|-------|------|
| Entry | `src/main.tsx` → `App.tsx` |
| Route tree | `components/routing/HostRoutes.tsx` (apex vs tenant — single tree) |
| Guards | `ProtectedRoute`, `GuestRoute`, tenant gates |
| Path constants | `lib/routes.ts` |
| Nav | `lib/navConfig.tsx` |

- Lazy-load pages with `React.lazy` + `Suspense`
- No orphan pages without routes
- Do not add duplicate auth wrappers in `App.tsx` — guards live in `components/routing/` (`mms-auth.md`)

## Provider tree (`App.tsx`)

```
AuthProvider → QueryClientProvider → Router → BrandingPaletteProvider → TenantProvider → ContactConfigProvider
```

`ContactConfigProvider` mounts **once** at root — never on child pages (`mms-contacts.md`).

## Data fetching

| Data | Pattern | Owner |
|------|---------|-------|
| Dedicated REST resource (students, workspace) | TanStack Query + `apiJson` | `mms-query.md` |
| Local collections (most modules) | `useLiveCollection` + `saveCollection` | `mms-data-layer.md` |
| Cross-view refresh (local) | `local-database-update` event | `mms-data-layer.md` |

**Hybrid (students):** Query is source of truth; `useStudents` syncs to localStorage on fetch so KPI/reports stay consistent until those views migrate.

Avoid bare `fetch` in `useEffect` for server state.

## Large module files

Split by concern — keep page files thin:

| Module | Subfolder |
|--------|-----------|
| Contact config | `lib/contactConfig/` (profileMetrics, prefsStorage, validationSchema) |
| Pinned widgets | `components/reports/pinnedWidgets/` (types, widgetDataUtils, widgetDefaults) |

Re-export from the original entry file so imports stay stable.

## Real-time

- **Now:** event bus for localStorage sync
- **Target:** WebSockets for server push
- **Banned:** `setInterval` polling loops

## Responsive

- Mobile-first Tailwind breakpoints
- Min 44×44px touch targets
- Modals/drawers usable at 320px width
- Flex/Grid + `min-w-0` — prevent overflow horizontal scroll

## Resilience & a11y

- Lazy route `Suspense` fallbacks: accessible loading text (`t('common.loading')`)
- Module pages: `ErrorBoundary` on Operations/Analytics content (`mms-observability.md`)
- New UI: keyboard + `aria-label` baseline — `mms-a11y.md`

## Testing

- Vitest env: `happy-dom` (`vitest.config.ts`) — provides `localStorage` for hook/client tests
- Colocate `*.test.ts` next to source
- Mock `fetch` at boundaries; test `apiClient` sends `credentials: 'include'`

## Quality gate

After substantive edits:

```bash
cd apps/frontend && pnpm typecheck && pnpm lint && pnpm test
```

Track main chunk size on `pnpm build`; investigate regressions > 10% without new features.
