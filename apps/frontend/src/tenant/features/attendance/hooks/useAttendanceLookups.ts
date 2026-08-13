import {
  ATTENDANCE_MODULE_MANIFEST,
  emptyAttendanceLookupsMap,
  type AttendanceLookupKind,
  type AttendanceLookupsMap,
  type AttendanceStatus,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { createModuleLookupsHooks } from '@/lib/query/createModuleLookupsHooks';

const ATTENDANCE_API = ATTENDANCE_MODULE_MANIFEST.restBasePath;

export const ATTENDANCE_LOOKUPS_QUERY_KEY = [
  ATTENDANCE_MODULE_MANIFEST.collectionKey,
  'lookups',
] as const;

export async function fetchAttendanceLookups(
  signal?: AbortSignal,
): Promise<AttendanceLookupsMap> {
  const response = await apiJson<{ lookups: AttendanceLookupsMap }>(
    `${ATTENDANCE_API}/lookups`,
    {
      signal,
    },
  );
  return response.lookups ?? emptyAttendanceLookupsMap;
}

export async function putAttendanceLookupKind(
  kind: AttendanceLookupKind,
  items: AttendanceStatus[],
): Promise<AttendanceStatus[]> {
  const response = await apiJson<{ items: AttendanceStatus[] }>(
    `${ATTENDANCE_API}/lookups/${kind}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    },
  );
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
