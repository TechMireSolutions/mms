import {
  FACULTY_MODULE_MANIFEST,
  emptyFacultyLookupsMap,
  emptyTeacherLookupsMap,
  type FacultyLookupKind,
  type FacultyLookupsMap,
  type TeacherLookupKind,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleLookupsHooks } from "@/lib/query/createModuleLookupsHooks";

export const FACULTY_LOOKUPS_QUERY_KEY = [FACULTY_MODULE_MANIFEST.collectionKey, "lookups"] as const;
export const TEACHERS_LOOKUPS_QUERY_KEY = FACULTY_LOOKUPS_QUERY_KEY;

const emptyMap = emptyFacultyLookupsMap || emptyTeacherLookupsMap;

export async function fetchFacultyLookups(_signal?: AbortSignal): Promise<FacultyLookupsMap> {
  const res = await apiContract.faculty.getLookups({ query: undefined, extraHeaders: {} });
  return (res.body as { lookups?: FacultyLookupsMap }).lookups ?? emptyMap();
}
export const fetchTeacherLookups = fetchFacultyLookups;

export async function putFacultyLookupKind(
  kind: FacultyLookupKind | TeacherLookupKind,
  items: string[],
): Promise<string[]> {
  const res = await apiContract.faculty.updateLookupKind({ params: { kind }, body: { items }, query: undefined, extraHeaders: {} });
  return (res.body as { items?: string[] }).items ?? [];
}
export const putTeacherLookupKind = putFacultyLookupKind;

const lookupsHooks = createModuleLookupsHooks<FacultyLookupsMap, FacultyLookupKind | TeacherLookupKind, string[]>({
  queryKey: FACULTY_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchFacultyLookups,
  putLookupKind: putFacultyLookupKind,
  defaults: emptyMap,
});

export const useFacultyLookupsQuery = lookupsHooks.useLookupsQuery;
export const useFacultyLookupMutation = lookupsHooks.useLookupMutation;

export const useTeacherLookupsQuery = useFacultyLookupsQuery;
export const useTeacherLookupMutation = useFacultyLookupMutation;

