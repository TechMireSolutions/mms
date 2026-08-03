---
name: mms-query-factories
description: Adds TanStack Query v5 queryOptions/mutationOptions factories, tuple keys, invalidation, and optimistic-update policy for REST collections. Use when creating collection hooks, facades under @/tenant/hooks/collections/*, or mutation cache patterns.
---

# MMS Query Factories Workflow

**Rules (norms SSOT):** `mms-hooks.mdc` · `mms-data-layer.mdc` §3 · `mms-api-interface.mdc` · `mms-dry.mdc`.

Do **not** use for app shell/routing → `mms-frontend`. Do **not** use for db.ts/legacy collections → `mms-data-sync`. Do **not** use for Work directory UX → `mms-module-work`.

## Workflow

1. Confirm the entity is REST Query-first — no new `useLiveCollection` for REST-migrated entities.
2. Define tuple key constants / key factory (named exports; no ad-hoc string keys).
3. Colocate TanStack Query v5 `queryOptions` / `mutationOptions` with those keys.
4. Thin hooks wrap factories: `enabled: isAuthenticated`, pass Query `signal` into `apiJson` / `apiFetch`.
5. Mutations: narrow invalidate list + count (+ `MESSAGING_CONTACTS_RESOLVE_QUERY_KEY` for contacts).
6. Await `mutateAsync`; toast success/error at the **call site** via `notify.*` + `t()` — no global `MutationCache` toast bus.
7. **Optimistic updates**: only for idempotent, easily-rollbackable UX. **Ban** for money, soft-delete/restore, bulk, backup/restore, messaging send. Reconcile via invalidate + server response.
8. Export cross-feature facade from `@/tenant/hooks/collections/{module}` — ban feature→feature deep imports.
9. Align client defaults with `queryClient.ts` (`staleTime` 30s, `gcTime` 5m, etc.) — `mms-data-layer.mdc`.
10. Paginated lists: `placeholderData: (previousData) => previousData` (Query v5) — not the v4 boolean `keepPreviousData`.
11. When the API supports **keyset/cursor**, wire Query to that contract (not only offset `page`/`limit`) — `mms-data-layer.mdc`.

## Checklist

```
- [ ] queryOptions / mutationOptions colocated with keys
- [ ] AbortSignal wired through apiClient
- [ ] No saveCollection dual-write on mutation success
- [ ] Optimistic policy respected
- [ ] Paginated lists use placeholderData: (prev) => prev when needed
- [ ] Keyset/cursor Query when API supports it (hot/large lists)
- [ ] Facade exported for cross-feature use when needed
```

## Done

Typecheck; one read + one mutation path verified — `mms-completion-review.mdc`.
