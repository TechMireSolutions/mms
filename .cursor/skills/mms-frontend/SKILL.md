---
name: mms-frontend
description: Builds or modifies the MMS React frontend — apiClient, routing, providers, TanStack Query vs useLiveCollection, Vitest, Playwright, and module file structure. Use when editing apps/frontend, Vite config, frontend hooks, pages, components, or frontend tests.
---

# MMS Frontend Workflow

**Rules (norms SSOT):** `mms-api-interface.mdc` · `mms-data-layer.mdc` · `mms-hooks.mdc` · `mms-ui-ux-design.mdc` · `mms-structure-naming.mdc` · `mms-settings-i18n.mdc` · `mms-auth-security.mdc`

Stack: React 19 · Vite 8 · Tailwind 4 · TanStack Query · React Router · shadcn/Radix · Framer Motion · Recharts · Lucide · `@mms/shared`. Alias `@/` → `apps/frontend/src/`.

## Data layer decision

```
Dedicated REST (/api/{resource})?
├── YES → TanStack Query — skill mms-query-factories
│         useXxx / useXxxPaginated / useXxxMutations (restore when soft-delete ships)
└── NO  → useLiveCollection + saveCollection for **existing non-migrated** keys only
              (no new entity collections / no new useLiveCollection for REST-migrated modules)
              skill mms-data-sync
```

Contacts (and other typed person entities): **Query + REST only** — never `saveCollection('contacts')`. Lookups via ContactConfig / `useContactLookups*` + `/api/contacts/lookups` — **never** `saveCollection` for genders/labels/countryCodes.

Query factories SSOT: before hand-rolling per-module `queryOptions` / `mutationOptions`, reuse `apps/frontend/src/lib/query/` — `createModuleQueryInvalidator`, `createModuleSetupConfigApi`, `createModuleSetupConfigHooks`, `createModuleLookupsHooks` — and export cross-feature facades from `@/tenant/hooks/collections/{module}` or `@/platform/hooks/collections/{module}`. Module config: `createStandardModuleConfigHook` (`hooks/createStandardModuleConfigHook.ts`) via `useStandardModuleConfig` (standard modules) or `useContactStandardConfig` (Contacts richer config) — extend the hook, do not fork providers.

## Before editing

1. Read the rule row for the surface (table below).
2. Large shells: hard ~300 / soft ~220 splits behind stable barrels — do not break public import paths.
3. Work chrome & BiDi UI: Enforce Tailwind v4 logical CSS properties for zero-compromise RTL/LTR rendering. **Do not use physical classes** (`pl-`, `pr-`, `left-`, `right-`).
   * `pl-4`, `pr-2` -> `ps-4`, `pe-2`
   * `ml-auto`, `mr-2` -> `ms-auto`, `me-2`
   * `left-0`, `right-4` -> `inset-inline-start-0`, `inset-inline-end-4`
   * `text-left`, `text-right` -> `text-start`, `text-end`
   * `border-l-2`, `border-r-0` -> `border-s-2`, `border-e-0`
   Prefer shared `EmptyState` / `FieldErrorMessage` / `WarningCallout` / `BulkSelectionBar` + `BulkSelectionActions` / `QuickActionButton` / `ModuleCommandMetricsGrid` / person-module chrome / `formStyles` tokens / `@theme` layout sizes — `mms-ui-ux-design.mdc` · `mms-dry.mdc`. Column gates: `isColumnVisible` into leaves (no `show*` fans).
4. Quality gate: `cd apps/frontend && pnpm typecheck && pnpm lint && pnpm test` · E2E: `pnpm exec playwright test`

## API calls

Always `apiJson` / `apiFetch` from `@/lib/apiClient` — cookie session (`credentials: 'include'`). No `localStorage` token reads. Exception: third-party URLs (e.g. Google OAuth popup). After server-persisted imports (`bulkSave`), **invalidate** Query keys only — no client upsert loop. Only `VITE_*` in the FE bundle — ban server secrets (`JWT_SECRET`, `DATABASE_URL`) — `mms-ops-infrastructure.mdc`.

## New page checklist

```
- [ ] Feature under tenant/features/{module}/ — lazy in HostRoutes
- [ ] Nav: navConfig + SYSTEM_MODULES
- [ ] Three-tier: useFilteredModuleTierTabs + ResponsiveAccordionTabs
- [ ] PageHeader actions unconditional; omit when !canWrite
- [ ] ErrorBoundary on Work/Reports; ErrorState on list isError
- [ ] List pending: aria-busy / polite live region when touching Work loads
- [ ] Copy via t(); StatusBadge (not text-green-500)
- [ ] Internal API via apiClient; RBAC via useModulePermissions / can()
- [ ] Soft-delete trash UI when REST restore ships — mms-module-work
- [ ] §7 gold-standard — mms-module-page
```

Full module pattern → skill **`mms-module-page`**. FE `/api/ws` subscribe is shipped (`TenantLivePushSubscriber` → `useTenantDatabaseUpdates` → `connectTenantDatabaseSocket`): cookie auth, reconnect/backoff, invalidate tuple keys only — `mms-data-layer.mdc`.

## Host / provider (do not break)

| Host | Notes |
|------|--------|
| Apex | Platform English/LTR; `MMS_PLATFORM_BRANDING` |
| Tenant | Workspace language; `ProtectedRoute` → `AppLayout` |
| Missing tenant | `TenantBootGate` hard-redirect to apex `tenant-not-found` — never mount tenant routes |
| Disabled workspace | `WorkspaceDisabledScreen` on tenant host |

Provider tree: `providers/AppProviders.tsx` — RootErrorBoundary → Auth → Query → Router → … → `TenantScopedProviders` (`ContactConfigProvider` on tenant host only). **Never** nest ContactConfigProvider on child pages.

## Settings (`/settings`)

App-wide only — not module Fields/Preferences. Workflow → **`mms-settings-i18n`**. Backup wipe-restore → **`mms-backup-restore`**.

## Key paths

| Path | Purpose |
|------|---------|
| `lib/apiClient.ts` | All internal HTTP |
| `lib/db.ts` | localStorage + `/api/db` (legacy) |
| `lib/contexts/AuthContext.tsx` | Session |
| `lib/contexts/TenantContext.tsx` | Subdomain / workspace |
| `lib/config/routes.ts` / `navConfig.tsx` | Paths + sidebar |
| `lib/config/settingsNavConfig.ts` | `/settings` nav |
| `lib/notify.ts` | Toasts — sole feedback API |
| `lib/queryClient.ts` | Query defaults |
| `lib/backup/` | Backup types/helpers |

## Ownership (pointer)

| Topic | Owner |
|-------|--------|
| apiClient / HTTP | `mms-api-interface.mdc` |
| Query / localStorage policy | `mms-data-layer.mdc` · **`mms-query-factories`** |
| Shell, tabs, StatusBadge, a11y | `mms-ui-ux-design.mdc` · **`mms-a11y-smoke`** |
| FormModal / Zod forms | `mms-form-architecture.mdc` · **`mms-form-architecture`** |
| Hooks inventory | `mms-hooks.mdc` |
| i18n / settings panels | `mms-settings-i18n.mdc` |
| RBAC UI / apex-tenant | `mms-auth-security.mdc` |
| Tests | `mms-testing-observability.mdc` |
| Performance, Caching & Virtualization | `mms-performance.mdc` |
| Debt register | `mms-migration-status.mdc` · **`mms-migration-fixes`** |

## Related skills

`mms-query-factories`, `mms-module-page`, `mms-module-work`, `mms-form-architecture`, `mms-settings-i18n`, `mms-backup-restore`, `mms-a11y-smoke`, `mms-data-sync`, `mms-messaging`, `mms-code-review`

## Done

`mms-completion-review.mdc` — typecheck → FE lint → tests if hooks touched. Layout: spot-check 375 / 768 / 1440. Pass Query `signal`. Memoize non-trivial calculations (`useMemo`) and callback/object references passed as dependencies (`useCallback`) to avoid render churn; avoid premature memoization on primitives (`mms-performance.mdc`). Virtualize tables and lists > 30 items via `@tanstack/react-virtual`. Complement with React 19 `useEffectEvent`, `startTransition`, and `useDeferredValue`.
