import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiJson } from '@/lib/apiClient';
import { uniqueRegistryIds } from '@/lib/registryResolve';

export interface CreatePersonModuleResolveQueriesOptions<TRecord, THydrated> {
  moduleQueryKey: readonly unknown[];
  apiBase: string;
  responseKey: string;
  toHydrated: (rows: TRecord[]) => THydrated[];
  /** When set, ids are chunked into sequential POSTs (large picker batches). */
  chunkSize?: number;
}

/**
 * Pure query-options builder for the batch-`/resolve` by-ids hook. Split from the
 * hook so the chunked-POST policy, enabled rule and query-key signature are
 * unit-testable without a renderer.
 */
export function createPersonResolveByIdsOptions<TRecord, THydrated>(
  options: CreatePersonModuleResolveQueriesOptions<TRecord, THydrated>,
  normalized: string[],
  isAuthenticated: boolean,
): UseQueryOptions<THydrated[]> {
  const { moduleQueryKey, apiBase, responseKey, toHydrated, chunkSize } = options;
  return {
    queryKey: [...moduleQueryKey, 'resolve', normalized.join(',')] as const,
    queryFn: async ({ signal }) => {
      const hydrated: THydrated[] = [];
      const resolveChunk = async (chunk: string[]) => {
        const response = await apiJson<Record<string, TRecord[]>>(`${apiBase}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ ids: chunk }),
          signal,
        });
        hydrated.push(...toHydrated((response[responseKey] ?? []) as TRecord[]));
      };
      if (chunkSize) {
        for (let index = 0; index < normalized.length; index += chunkSize) {
          await resolveChunk(normalized.slice(index, index + chunkSize));
        }
      } else {
        await resolveChunk(normalized);
      }
      return hydrated;
    },
    enabled: isAuthenticated && normalized.length > 0,
    staleTime: 30_000,
  };
}

/**
 * Shared batch-`/resolve` + `/linked-contact-ids` query hooks for contact-linked
 * person modules. Module adapters (Teachers/Students) supply their module query
 * key, API base, and response-key/row mapping once.
 */
export function createPersonModuleResolveQueries<TRecord, THydrated>(
  options: CreatePersonModuleResolveQueriesOptions<TRecord, THydrated>,
) {
  const { moduleQueryKey, apiBase, responseKey, toHydrated, chunkSize } = options;

  function useLinkedContactIds(excludeId?: string, enabled = true) {
    const { isAuthenticated } = useAuth();
    const queryString = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : '';
    return useQuery({
      queryKey: [...moduleQueryKey, 'linked-contact-ids', excludeId ?? ''] as const,
      queryFn: async ({ signal }) => {
        const linkedContactsResponse = await apiJson<{ contactIds: Array<string | number> }>(
          `${apiBase}/linked-contact-ids${queryString}`,
          { signal },
        );
        return linkedContactsResponse.contactIds;
      },
      enabled: isAuthenticated && enabled,
      staleTime: 30_000,
    });
  }

  function useByIds(ids: (string | number | null | undefined)[]) {
    const { isAuthenticated } = useAuth();
    const normalized = useMemo(() => uniqueRegistryIds(ids), [ids]);
    return useQuery(createPersonResolveByIdsOptions({ moduleQueryKey, apiBase, responseKey, toHydrated, chunkSize }, normalized, isAuthenticated));
  }

  return { useLinkedContactIds, useByIds };
}
