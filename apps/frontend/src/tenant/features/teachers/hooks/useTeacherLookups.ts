import {
  TEACHERS_MODULE_MANIFEST,
  emptyTeacherLookupsMap,
  type TeacherLookupKind,
  type TeacherLookupsMap,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleLookupsHooks } from "@/lib/query/createModuleLookupsHooks";

export const TEACHERS_LOOKUPS_QUERY_KEY = [TEACHERS_MODULE_MANIFEST.collectionKey, "lookups"] as const;

export async function fetchTeacherLookups(_signal?: AbortSignal): Promise<TeacherLookupsMap> {
  const res = await apiContract.teachers.getLookups({ query: undefined, extraHeaders: {} });
    const response = res.body as any;
  return response.lookups ?? emptyTeacherLookupsMap();
}

export async function putTeacherLookupKind(
  kind: TeacherLookupKind,
  items: string[],
): Promise<string[]> {
  const res = await apiContract.teachers.updateLookupKind({ params: { kind: kind as any }, body: { items }, query: undefined, extraHeaders: {} });
  const response = res.body as any;
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
