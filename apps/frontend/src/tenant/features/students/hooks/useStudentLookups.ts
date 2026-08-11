import {
  STUDENTS_MODULE_MANIFEST,
  emptyStudentLookupsMap,
  type StudentLookupKind,
  type StudentLookupsMap,
} from "@mms/shared";
import { apiJson } from "@/lib/apiClient";
import { createModuleLookupsHooks } from "@/lib/query/createModuleLookupsHooks";
import { STUDENTS_API } from "@/tenant/features/students/hooks/studentsQueryKeys";

export const STUDENTS_LOOKUPS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, "lookups"] as const;

async function fetchStudentLookups(signal?: AbortSignal): Promise<StudentLookupsMap> {
  const response = await apiJson<{ lookups: StudentLookupsMap }>(`${STUDENTS_API}/lookups`, {
    signal,
  });
  return response.lookups ?? emptyStudentLookupsMap();
}

async function putStudentLookupKind(
  kind: StudentLookupKind,
  items: string[],
): Promise<string[]> {
  const response = await apiJson<{ items: string[] }>(`${STUDENTS_API}/lookups/${kind}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  return response.items;
}

const lookupsHooks = createModuleLookupsHooks<StudentLookupsMap, StudentLookupKind, string[]>({
  queryKey: STUDENTS_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchStudentLookups,
  putLookupKind: putStudentLookupKind,
  defaults: emptyStudentLookupsMap,
});

export const useStudentLookupsQuery = lookupsHooks.useLookupsQuery;
export const useStudentLookupMutation = lookupsHooks.useLookupMutation;
