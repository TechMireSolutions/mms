import {
  TEACHERS_MODULE_MANIFEST,
  emptyTeacherLookupsMap,
  type TeacherLookupKind,
  type TeacherLookupsMap,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { createModuleLookupsHooks } from "@/lib/query/createModuleLookupsHooks";
import { TEACHERS_API } from "@/tenant/features/teachers/hooks/teachersQueryShared";

export const TEACHERS_LOOKUPS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, "lookups"] as const;

export async function fetchTeacherLookups(signal?: AbortSignal): Promise<TeacherLookupsMap> {
  const response = await apiJson<{ lookups: TeacherLookupsMap }>(`${TEACHERS_API}/lookups`, {
    signal,
  });
  return response.lookups ?? emptyTeacherLookupsMap();
}

export async function putTeacherLookupKind(
  kind: TeacherLookupKind,
  items: string[],
): Promise<string[]> {
  const response = await apiJson<{ items: string[] }>(`${TEACHERS_API}/lookups/${kind}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return response.items;
}

const lookupsHooks = createModuleLookupsHooks<TeacherLookupsMap, TeacherLookupKind, string[]>({
  queryKey: TEACHERS_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchTeacherLookups,
  putLookupKind: putTeacherLookupKind,
  defaults: emptyTeacherLookupsMap,
});

export const useTeacherLookupsQuery = lookupsHooks.useLookupsQuery;
export const useTeacherLookupMutation = lookupsHooks.useLookupMutation;
