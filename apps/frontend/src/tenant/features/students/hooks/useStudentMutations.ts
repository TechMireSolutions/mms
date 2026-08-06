import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredStudent, type StudentRecord } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryShared';

/** Server mutations for Student records (create, update, delete, bulk delete, bulk status). */
export function useStudentMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => invalidateStudentsQueries(queryClient);

  const createStudent = useMutation({
    mutationFn: async (student: StudentRecord) => {
      const normalized = normalizeStoredStudent(student);
      return apiJson<{ student: StudentRecord }>(STUDENTS_API, {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, student }: { id: string; student: StudentRecord }) => {
      const normalized = normalizeStoredStudent(student);
      return apiJson<{ student: StudentRecord }>(`${STUDENTS_API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: invalidate,
  });

  const deleteStudent = useMutation({
    mutationFn: async ({ id, deletionReason }: { id: string; deletionReason?: string }) =>
      apiJson<{ success: boolean }>(`${STUDENTS_API}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify(deletionReason ? { deletionReason } : {}),
      }),
    onSuccess: invalidate,
  });

  const bulkDeleteStudents = useMutation({
    mutationFn: async ({ ids, deletionReason }: { ids: string[]; deletionReason?: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${STUDENTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({
          ids,
          ...(deletionReason ? { deletionReason } : {}),
        }),
      }),
    onSuccess: invalidate,
  });

  const restoreStudent = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`${STUDENTS_API}/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
    onSuccess: invalidate,
  });

  const bulkRestoreStudents = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${STUDENTS_API}/bulk-restore`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: invalidate,
  });

  const bulkUpdateStudentStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${STUDENTS_API}/bulk-status`, {
        method: 'POST',
        body: JSON.stringify({ ids, status }),
      }),
    onSuccess: invalidate,
  });

  return {
    createStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    restoreStudent,
    bulkRestoreStudents,
    bulkUpdateStudentStatus,
  };
}
