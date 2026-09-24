import { queryOptions } from '@tanstack/react-query';

/** Illustrates key identity and signal forwarding without inventing an API.
 * Use existing MMS factories in production. Pass a scope that identifies the
 * authorized dataset and a fetcher backed by the actual shared contract.
 * The caller still owns auth/permission gating and cache lifecycle.
 */
export function templateDetailQueryOptions<T>(
  scope: readonly string[],
  id: string,
  enabled: boolean,
  fetchDetail: (id: string, signal: AbortSignal) => Promise<T>,
) {
  return queryOptions({
    queryKey: [...scope, 'detail', id] as const,
    queryFn: ({ signal }) => fetchDetail(id, signal),
    enabled: enabled && Boolean(id),
  });
}
