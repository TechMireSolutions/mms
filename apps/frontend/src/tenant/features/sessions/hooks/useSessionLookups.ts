import {
  SESSIONS_MODULE_MANIFEST,
  emptySessionLookupsMap,
  type SessionLookupKind,
  type SessionLookupsMap,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { createModuleLookupsHooks } from '@/lib/query/createModuleLookupsHooks';

const SESSIONS_API = SESSIONS_MODULE_MANIFEST.restBasePath;

export const SESSIONS_LOOKUPS_QUERY_KEY = [
  SESSIONS_MODULE_MANIFEST.collectionKey,
  'lookups',
] as const;

export async function fetchSessionLookups(
  signal?: AbortSignal,
): Promise<SessionLookupsMap> {
  const response = await apiJson<{ lookups: SessionLookupsMap }>(
    `${SESSIONS_API}/lookups`,
    {
      signal,
    },
  );
  return response.lookups ?? emptySessionLookupsMap;
}

export async function putSessionLookupKind(
  kind: SessionLookupKind,
  items: string[],
): Promise<string[]> {
  const response = await apiJson<{ items: string[] }>(
    `${SESSIONS_API}/lookups/${kind}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );
  return response.items;
}

const lookupsHooks = createModuleLookupsHooks<
  SessionLookupsMap,
  SessionLookupKind,
  string[]
>({
  queryKey: SESSIONS_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchSessionLookups,
  putLookupKind: putSessionLookupKind,
  defaults: () => emptySessionLookupsMap,
});

export const useSessionLookupsQuery = lookupsHooks.useLookupsQuery;
export const useSessionLookupMutation = lookupsHooks.useLookupMutation;
