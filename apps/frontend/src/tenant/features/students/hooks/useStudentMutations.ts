import { normalizeStoredStudent, type StudentRecord } from '@mms/shared';
import { createModuleCrudMutations } from '@/lib/query/createModuleCrudMutations';
import { invalidateStudentsQueries } from '@/tenant/features/students/hooks/invalidateStudentsQueries';
import { STUDENTS_API } from '@/tenant/features/students/hooks/studentsQueryKeys';

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
