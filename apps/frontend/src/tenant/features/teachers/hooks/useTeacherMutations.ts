import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredTeacher, type TeacherRecord } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { TEACHER_COUNT_QUERY_KEY } from '@/tenant/features/teachers/hooks/useTeacherCount';
import {
  TEACHERS_API,
  TEACHERS_METRICS_QUERY_KEY,
  TEACHERS_QUERY_KEY,
  TEACHERS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/teachers/hooks/teachersQueryShared';

export function useTeacherMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: TEACHERS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHER_COUNT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHERS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TEACHERS_WIDGET_AGGREGATES_QUERY_KEY });
  };

  const createTeacher = useMutation({
    mutationFn: async (teacher: TeacherRecord) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>(TEACHERS_API, {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, teacher }: { id: string; teacher: TeacherRecord }) => {
      const normalized = normalizeStoredTeacher(teacher);
      return apiJson<{ teacher: TeacherRecord }>(`${TEACHERS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${TEACHERS_API}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const bulkDeleteTeachers = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${TEACHERS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const restoreTeacher = useMutation({
    mutationFn: async (id: string) =>
      apiJson<{ success: boolean }>(`${TEACHERS_API}/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      }),
    onSuccess: invalidate,
  });

  const bulkRestoreTeachers = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${TEACHERS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const bulkUpdateTeacherStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${TEACHERS_API}/bulk-status`, {
        method: 'POST',
        body: JSON.stringify({ ids, status }),
      }),
    onSuccess: invalidate,
  });

  return {
    createTeacher,
    updateTeacher,
    deleteTeacher,
    bulkDeleteTeachers,
    restoreTeacher,
    bulkRestoreTeachers,
    bulkUpdateTeacherStatus,
  };
}
