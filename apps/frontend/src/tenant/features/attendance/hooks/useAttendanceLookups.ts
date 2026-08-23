import {
  ATTENDANCE_MODULE_MANIFEST,
  emptyAttendanceLookupsMap,
  type AttendanceLookupKind,
  type AttendanceLookupsMap,
  type AttendanceStatus,
} from '@mms/shared';
import { apiContract } from '@/lib/api';
import { createModuleLookupsHooks } from '@/lib/query/createModuleLookupsHooks';

const ATTENDANCE_API = ATTENDANCE_MODULE_MANIFEST.restBasePath;

export const ATTENDANCE_LOOKUPS_QUERY_KEY = [
  ATTENDANCE_MODULE_MANIFEST.collectionKey,
  'lookups',
] as const;

export async function fetchAttendanceLookups(
  signal?: AbortSignal,
): Promise<AttendanceLookupsMap> {
  const res = await apiContract.attendance.getLookups({ query: undefined, extraHeaders: {} });
  const response = res.body as any;
  return response.lookups ?? emptyAttendanceLookupsMap;
}

export async function putAttendanceLookupKind(
  kind: AttendanceLookupKind,
  items: AttendanceStatus[],
): Promise<AttendanceStatus[]> {
  const res = await apiContract.attendance.updateLookupKind({ params: { kind: kind as any }, body: { items }, query: undefined, extraHeaders: {} });
  const response = res.body as any;
  return response.items;
}

const lookupsHooks = createModuleLookupsHooks<
  AttendanceLookupsMap,
  AttendanceLookupKind,
  AttendanceStatus[]
>({
  queryKey: ATTENDANCE_LOOKUPS_QUERY_KEY,
  fetchLookups: fetchAttendanceLookups,
  putLookupKind: putAttendanceLookupKind,
  defaults: () => emptyAttendanceLookupsMap,
});

export const useAttendanceLookupsQuery = lookupsHooks.useLookupsQuery;
export const useAttendanceLookupMutation = lookupsHooks.useLookupMutation;
