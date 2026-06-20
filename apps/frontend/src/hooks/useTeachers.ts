import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Teacher } from '@mms/shared';
import { normalizeStoredTeacher } from '@mms/shared';
import { TEACHERS } from '@/lib/data/teachersData';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { getCollection, saveCollection } from '@/lib/db';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { TEACHER_COUNT_QUERY_KEY } from './useTeacherCount';

export const TEACHERS_QUERY_KEY = ['teachers', 'list'] as const;

export interface TeacherRecord {
  id: string | number;
  [key: string]: unknown;
}

async function fetchTeachers(): Promise<TeacherRecord[]> {
  const body = await apiJson<{ teachers: TeacherRecord[] }>('/api/teachers');
  saveCollection('teachers', body.teachers);
  return getCollection<TeacherRecord>('teachers', []);
}

export function useTeachers(options?: { enabled?: boolean }) {
  const queryEnabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: TEACHERS_QUERY_KEY,
    queryFn: fetchTeachers,
    enabled: isAuthenticated && queryEnabled,
    staleTime: 30_000,
  });
}

export function useTeacherMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHER_COUNT_QUERY_KEY });
  };

  const createTeacher = useMutation({
    mutationFn: async (teacher: TeacherRecord) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, teacher }: { id: string; teacher: TeacherRecord }) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>(`/api/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/api/teachers/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { createTeacher, updateTeacher, deleteTeacher };
}

/** Query-first teachers for analytics; falls back to localStorage cache (hydrated). */
export function useTeachersCollection(options?: { enabled?: boolean }): Teacher[] {
  const enabled = options?.enabled ?? true;
  const { data: fromQuery = [] } = useTeachers({ enabled });
  const fromLocal = useLiveCollection<Teacher>('teachers', TEACHERS, { enabled });
  if (!enabled) return [];
  if (fromQuery.length > 0) {
    return fromQuery as unknown as Teacher[];
  }
  return fromLocal;
}
