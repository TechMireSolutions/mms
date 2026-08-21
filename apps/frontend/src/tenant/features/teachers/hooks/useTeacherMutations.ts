import { useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeStoredTeacher, type TeacherRecord } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { createModuleCrudMutations } from '@/lib/query/createModuleCrudMutations';
import { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';
import { TEACHERS_API } from '@/tenant/features/teachers/hooks/teachersQueryShared';

const useTeachersModuleMutations = createModuleCrudMutations<TeacherRecord>({
  apiBase: TEACHERS_API,
  normalizeStored: normalizeStoredTeacher,
  invalidate: invalidateTeachersQueries,
  updateRecordKey: "teacher",
});

/** Server mutations for Teacher records (create, update, delete, bulk delete, bulk status, bulk specialization). */
export function useTeacherMutations() {
  const queryClient = useQueryClient();
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
  } = useTeachersModuleMutations();

  const bulkSpecializationMutation = useMutation({
    mutationFn: async ({ ids, specialization }: { ids: string[]; specialization: string }) => {
      return apiJson<{ success: boolean; succeeded: number; failed: number }>(
        `${TEACHERS_API}/bulk-specialization`,
        {
          method: "POST",
          body: JSON.stringify({ ids, specialization }),
        },
      );
    },
    onSuccess: async () => {
      await invalidateTeachersQueries(queryClient);
    },
  });

  return {
    createTeacher: create,
    updateTeacher: update,
    deleteTeacher: remove,
    bulkDeleteTeachers: bulkDelete,
    restoreTeacher: restore,
    bulkRestoreTeachers: bulkRestore,
    bulkUpdateTeacherStatus: bulkStatus,
    bulkUpdateTeacherSpecialization: bulkSpecializationMutation.mutateAsync,
    isBulkSpecializationPending: bulkSpecializationMutation.isPending,
    logExportAudit,
    logSetupAudit,
  };
}
