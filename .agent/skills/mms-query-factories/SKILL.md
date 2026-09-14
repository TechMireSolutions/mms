---
name: mms-query-factories
description: Implements TanStack Query v5 queryOptions/mutationOptions factories, tuple keys, optimistic updates, and API facades. Use when building query hooks, data fetching facades under @/tenant/hooks/collections/*, or caching mutations. Do NOT use for app routing (use mms-frontend), legacy document-store db.ts (use mms-data-sync), or Work tier directory UI (use mms-module-work).
---

# MMS Query Factories Workflow

**Rule (norms SSOT):** `mms-hooks.md` · `mms-data-layer.md` §3 · `mms-api-interface.md` · `mms-performance.md` §5.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Anti-Patterns & Banned Operations

- ❌ **NEVER fetch data via manual `useEffect`**: All server state reads must go through TanStack Query options.
- ❌ **NEVER use ad-hoc string keys**: Always define structured tuple key constants with `as const satisfies readonly unknown[]`.
- ❌ **NEVER perform optimistic updates on financial or bulk writes**: Optimistic updates are strictly limited to idempotent, low-risk UI (e.g. single-item soft-delete hide with 5–10s undo toast).
- ❌ **NEVER deep-import feature hooks across modules**: Always re-export public surfaces through `@/tenant/hooks/collections/{module}.ts`.

## Step-by-Step Workflow

1. **Verify REST Authority**: Confirm entity is server-authoritative REST. Never add `useLiveCollection` for REST entities.
2. **Tuple Query Keys**: Define query key constants and tuple factories in `features/{module}/hooks/{module}QueryKeys.ts`.
3. **Query Options Factory**: Colocate `queryOptions` with AbortSignal forwarding:
   ```ts
   export function entityListQueryOptions(query: Record<string, unknown> = {}) {
     return queryOptions({
       queryKey: [...ENTITY_QUERY_KEY, 'list', query] as const,
       queryFn: async ({ signal }) => {
         const res = await apiContract.entities.list({ query, signal, fetchOptions: { signal } });
         if (res.status !== 200) throw new Error('Failed to fetch entities');
         return res.body;
       },
       placeholderData: (prev) => prev,
       staleTime: 15_000,
     });
   }
   ```
4. **Invalidator Helper**: Create colocated `invalidate{Module}Queries(queryClient)` invalidating list, metrics, and lookups.
5. **Mutation Hook**: Return mutation wrapping `useMutation` with target invalidation:
   ```ts
   export function useEntityCreateMutation() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: async (payload: InsertEntityDto) => {
         const res = await apiContract.entities.create({ body: payload });
         if (res.status !== 201) throw new Error('Create failed');
         return res.body;
       },
       onSuccess: () => invalidateEntityQueries(qc),
     });
   }
   ```
6. **Cross-Feature Facade**: Re-export query options, hooks, and types in `@/tenant/hooks/collections/{module}.ts`.

## Verification Checklist

```
- [ ] queryOptions/mutationOptions colocated with tuple keys
- [ ] AbortSignal forwarded to apiContract/fetchOptions
- [ ] placeholderData: (prev) => prev used on paginated queries
- [ ] No manual useEffect fetch calls
- [ ] Re-exported through @/tenant/hooks/collections/{module}.ts
- [ ] Run: pnpm typecheck
```
