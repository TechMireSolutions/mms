import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredStudent, type StudentRecord } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { STUDENT_COUNT_QUERY_KEY } from '@/tenant/features/students/hooks/useStudentCount';
import {
  STUDENTS_API,
  STUDENTS_METRICS_QUERY_KEY,
  STUDENTS_QUERY_KEY,
  STUDENTS_WIDGET_AGGREGATES_QUERY_KEY,
} from '@/tenant/features/students/hooks/studentsQueryShared';

/** Server mutations for Student records (create, update, delete, bulk delete, bulk status). */
export function useStudentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENT_COUNT_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENTS_METRICS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STUDENTS_WIDGET_AGGREGATES_QUERY_KEY });
  };

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
    mutationFn: async (id: string) =>
      apiFetch(`${STUDENTS_API}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const bulkDeleteStudents = useMutation({
    mutationFn: async (ids: string[]) =>
      apiJson<{ success: boolean; succeeded: number; failed: number }>(`${STUDENTS_API}/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
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
