import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  STUDENTS_MODULE_MANIFEST,
  emptyStudentLookupsMap,
  type StudentLookupKind,
  type StudentLookupsMap,
} from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { useAuth } from '@/lib/contexts/AuthContext';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryShared';

export const STUDENTS_LOOKUPS_QUERY_KEY = [STUDENTS_MODULE_MANIFEST.collectionKey, 'lookups'] as const;

export async function fetchStudentLookups(signal?: AbortSignal): Promise<StudentLookupsMap> {
  const response = await apiJson<{ lookups: StudentLookupsMap }>(`${STUDENTS_API}/lookups`, {
    signal,
  });
  return response.lookups ?? emptyStudentLookupsMap();
}

export async function putStudentLookupKind(
  kind: StudentLookupKind,
  items: string[],
): Promise<string[]> {
  const response = await apiJson<{ items: string[] }>(`${STUDENTS_API}/lookups/${kind}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return response.items;
}

export function useStudentLookupsQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_LOOKUPS_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudentLookups(signal),
    enabled: isAuthenticated,
    placeholderData: emptyStudentLookupsMap(),
  });
}

export function useStudentLookupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, items }: { kind: StudentLookupKind; items: string[] }) =>
      putStudentLookupKind(kind, items),
    onSuccess: (items, variables) => {
      queryClient.setQueryData<StudentLookupsMap>(STUDENTS_LOOKUPS_QUERY_KEY, (current) => {
        const base = current ?? emptyStudentLookupsMap();
        return { ...base, [variables.kind]: items };
      });
      void queryClient.invalidateQueries({ queryKey: STUDENTS_LOOKUPS_QUERY_KEY });
    },
  });
}
