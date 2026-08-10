import { normalizeStoredTeacher, type TeacherRecord } from '@mms/shared';
import { createModuleCrudMutations } from '@/lib/query/createModuleCrudMutations';
import { invalidateTeachersQueries } from '@/tenant/features/teachers/hooks/invalidateTeachersQueries';
import { TEACHERS_API } from '@/tenant/features/teachers/hooks/teachersQueryShared';

const useTeachersModuleMutations = createModuleCrudMutations<TeacherRecord>({
  apiBase: TEACHERS_API,
  normalizeStored: normalizeStoredTeacher,
  invalidate: invalidateTeachersQueries,
  updateRecordKey: "teacher",
});

/** Server mutations for Teacher records (create, update, delete, bulk delete, bulk status). */
export function useTeacherMutations() {
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

  return {
    createTeacher: create,
    updateTeacher: update,
    deleteTeacher: remove,
    bulkDeleteTeachers: bulkDelete,
    restoreTeacher: restore,
    bulkRestoreTeachers: bulkRestore,
    bulkUpdateTeacherStatus: bulkStatus,
    logExportAudit,
    logSetupAudit,
  };
}
