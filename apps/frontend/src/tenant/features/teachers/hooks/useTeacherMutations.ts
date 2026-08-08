import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredTeacher, type TeacherRecord } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';
import { TEACHERS_API } from '@/tenant/features/teachers/hooks/teachersQueryShared';

export function useTeacherMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => invalidateTeachersQueries(queryClient);

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
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiJson<{ success: boolean }>(`${TEACHERS_API}/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
  });

  const bulkDeleteTeachers = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${TEACHERS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        }),
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

  const logExportAudit = useMutation({
    mutationFn: async (payload: {
      count: number;
      scope: 'all' | 'filtered' | 'selection';
    }) =>
      apiJson<{ success: boolean }>(`${TEACHERS_API}/export-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  const logSetupAudit = useMutation({
    mutationFn: async (payload: { area: 'fields' | 'preferences'; summary: string }) =>
      apiJson<{ success: boolean }>(`${TEACHERS_API}/setup-audit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });

  return {
    createTeacher,
    updateTeacher,
    deleteTeacher,
    bulkDeleteTeachers,
    restoreTeacher,
    bulkRestoreTeachers,
    bulkUpdateTeacherStatus,
    logExportAudit,
    logSetupAudit,
  };
}
