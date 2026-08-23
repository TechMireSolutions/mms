import {
  useTeachersContractCreate,
  useTeachersContractUpdate,
  useTeachersContractDelete,
  useTeachersContractBulkDelete,
  useTeachersContractRestore,
  useTeachersContractBulkRestore,
  useTeachersContractBulkStatus,
  useTeachersContractBulkSpecialization,
  useTeachersContractLogExportAudit,
  useTeachersContractLogSetupAudit,
} from '@/tenant/features/teachers/hooks/useTeachersTsrHooks';

/** Server mutations for Teacher records (create, update, delete, bulk delete, bulk status, bulk specialization). */
export function useTeacherMutations() {
  const createTeacherMutation = useTeachersContractCreate();
  const updateTeacherMutation = useTeachersContractUpdate();
  const deleteTeacherMutation = useTeachersContractDelete();
  const bulkDeleteTeachersMutation = useTeachersContractBulkDelete();
  const restoreTeacherMutation = useTeachersContractRestore();
  const bulkRestoreTeachersMutation = useTeachersContractBulkRestore();
  const bulkUpdateTeacherStatusMutation = useTeachersContractBulkStatus();
  const bulkSpecializationMutation = useTeachersContractBulkSpecialization();
  const logExportAuditMutation = useTeachersContractLogExportAudit();
  const logSetupAuditMutation = useTeachersContractLogSetupAudit();

  return {
    createTeacher: createTeacherMutation,
    updateTeacher: updateTeacherMutation,
    deleteTeacher: deleteTeacherMutation,
    bulkDeleteTeachers: bulkDeleteTeachersMutation,
    restoreTeacher: restoreTeacherMutation,
    bulkRestoreTeachers: bulkRestoreTeachersMutation,
    bulkUpdateTeacherStatus: bulkUpdateTeacherStatusMutation,
    bulkUpdateTeacherSpecialization: bulkSpecializationMutation.mutateAsync,
    isBulkSpecializationPending: bulkSpecializationMutation.isPending,
    logExportAudit: {
      mutateAsync: (payload: any) => logExportAuditMutation.mutateAsync({ body: payload }),
      isPending: logExportAuditMutation.isPending,
    },
    logSetupAudit: {
      mutateAsync: (payload: any) => logSetupAuditMutation.mutateAsync({ body: payload }),
      isPending: logSetupAuditMutation.isPending,
    },
  };
}
