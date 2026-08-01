---
description: Frontend hooks — live data, Query, sorted fields, branding, settings
paths:
  - "apps/frontend/src/hooks/**"
  - "apps/frontend/src/tenant/hooks/**"
  - "apps/frontend/src/tenant/features/**/hooks/**"
  - "apps/frontend/src/lib/ContactConfigContext.tsx"
  - "apps/frontend/src/lib/contactConfig/**"
  - "apps/frontend/src/lib/contexts/TenantContext.tsx"
---

# MMS Hooks

Colocate in `apps/frontend/src/hooks/` or `tenant/features/{module}/hooks/`. Pure logic used in 2+ modules → `@mms/shared`, keep the hook as a thin wrapper. Exhaustive hook catalogs go stale — follow patterns below; discover hooks via feature folders / `@/tenant/hooks/collections/*`.

## Server state (TanStack Query)

Pattern for REST modules:

- `enabled: isAuthenticated`
- Export tuple `QUERY_KEY` (prefer shared key factories)
- `apiJson` in `queryFn` with Query `signal`
- Mutations invalidate list + count narrowly — no blanket `invalidateQueries()`
- Contacts mutations also invalidate `MESSAGING_CONTACTS_RESOLVE_QUERY_KEY` (messaging resolve cache)
- Await `mutateAsync`; no dual-write via `saveCollection` in `onSuccess` (cache mirror only in legacy `useCollectionSync` → `saveCollectionCacheOnly`)

### Cross-module collection facades

Hook **implementations** stay in `tenant/features/{module}/hooks/`. Cross-feature and shared UI **must** import from:

`@/tenant/hooks/collections/{contacts|students|teachers|sessions|enrollments|users|finance|accounting|hasanat|examinations|questionBank|attendance}`

Same-feature files may keep direct feature-hook imports. Shared person UI: `ContactPicker` / `ContactCreateModal` under `@/components/contactLink/`.

## `useLiveCollection(key, seed?)`

Legacy localStorage reactive reads only. **Hard ban** on new use for REST-migrated entities. Contacts entity rows are REST-only (not in FE `BUSINESS_COLLECTIONS`).

```ts
// ✅ Legacy keys not yet on Query as primary
const legacyRows = useLiveCollection('some_legacy_key');

// ❌ Contacts is REST-only — never seed entity rows from getCollection('contacts')
const [items] = useState(() => getCollection('contacts', CONTACTS));
```

## Domain lookups & config

Prefer feature hooks (`useObligationLookups`, `useQuestionBankConfig`, `useWorkspaceRoles`, …). `useSortedFields(registry, tabKey?)` for registry-driven forms — not hardcoded field lists.

## Settings & branding

Use `useGlobalSettings`, `useBranding`, draft hooks (`useSettingsDraft` / branding / theme), and public branding queries as documented in `mms-settings-i18n.md`. One-shot outside React: `getGlobalSettings()`, `getBrandingSettings()`.

## Contact config

`useContactConfig` / columns / validation from `ContactConfigContext`. Provider at `App.tsx` root only — never nest on child pages.

## RBAC & viewer

- Prefer `useModulePermissions(manifest)` / `can()` over `role ===` for module write gates.
- Do **not** add new tenant-module write gates via `role ===`. Residual non-gate uses (platform `super_user`, chat `msg.role`, metrics counting, teacher→staff alias) are fine.

## UI shell

`useModuleTierTabs`, `useConfigSubTabs` / `usePersistedTabState`, `useTranslation`, `useBodyScrollLock` (never set `document.body.style.overflow` manually), `useSessionTimeout`, `useDebounce`, `useMediaQuery`.

## New hooks checklist

- [ ] No polling — events or TanStack Query
- [ ] Internal API via `apiClient`
- [ ] Export query keys when using Query; pass `signal`
- [ ] `enabled: isAuthenticated` for tenant REST
- [ ] No new `useLiveCollection` for REST-migrated entities
- [ ] Test pure wrappers where ROI is high (`mms-testing-observability.md`)
