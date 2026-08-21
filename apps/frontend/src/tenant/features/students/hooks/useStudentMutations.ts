import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredStudent, type StudentRecord, type StudentsBulkEnrollBody } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { createModuleCrudMutations } from '@/lib/query/createModuleCrudMutations';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryKeys';
import { SESSIONS_QUERY_KEY } from '@/tenant/hooks/collections/sessions';

const useStudentsModuleMutations = createModuleCrudMutations<StudentRecord>({
  apiBase: STUDENTS_API,
  normalizeStored: normalizeStoredStudent,
  invalidate: invalidateStudentsQueries,
  updateRecordKey: 'student',
});

/** Server mutations for Student records (create, update, delete, bulk delete, bulk status). */
export function useStudentMutations() {
  const {
    create,
    update,
    remove,
    bulkDelete,
    restore,
    bulkRestore,
    bulkStatus,
    logExportAudit,
    logSetupAudit,
  } = useStudentsModuleMutations();

  return {
    createStudent: create,
    updateStudent: update,
    deleteStudent: remove,
    bulkDeleteStudents: bulkDelete,
    restoreStudent: restore,
    bulkRestoreStudents: bulkRestore,
    bulkUpdateStudentStatus: bulkStatus,
    logExportAudit,
    logSetupAudit,
  };
}

/** Atomic bulk session enrollment mutation for selected students. */
export function useStudentsBulkEnrollMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: StudentsBulkEnrollBody) => {
      return apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${STUDENTS_API}/bulk-enroll`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateStudentsQueries(queryClient),
        queryClient.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] }),
      ]);
    },
  });
}


