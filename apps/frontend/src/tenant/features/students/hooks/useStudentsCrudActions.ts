import { type Student } from "@mms/shared";
import {
  useStudentMutations,
  type StudentRecord,
} from "@/tenant/features/students/hooks/useStudents";
import { useStudentsCrudNotify } from "@/tenant/features/students/hooks/useStudentsCrudNotify";

/** Mutate + notify wrappers for Students Work (Contacts-shaped action cluster). */
export function useStudentsCrudActions({
  editStudent,
  mutations,
}: {
  editStudent: Student | null;
  mutations: ReturnType<typeof useStudentMutations>;
}) {
  const { handleError, notifyBulkResult } = useStudentsCrudNotify();
  const {
    deleteStudent,
    bulkDeleteStudents,
    restoreStudent,
    bulkRestoreStudents,
    bulkUpdateStudentStatus,
    createStudent,
    updateStudent,
  } = mutations;

  const handleSaveStudent = async (studentToSave: Student): Promise<void> => {
    if (editStudent) {
      await updateStudent.mutateAsync({
        id: String(studentToSave.id),
        student: studentToSave as StudentRecord,
      });
    } else {
      await createStudent.mutateAsync(studentToSave as StudentRecord);
    }
  };

  const handleDelete = async (studentId: string, deletionReason?: string): Promise<void> => {
    try {
      await deleteStudent.mutateAsync({ id: String(studentId), deletionReason });
      notifyBulkResult(1, 0, "students.deleteSuccess", "students.bulkDeleteSuccess");
    } catch (error) {
      handleError(error, "students.delete", "students.deleteFailed");
    }
  };

  const handleRestore = async (studentId: string): Promise<void> => {
    try {
      await restoreStudent.mutateAsync(String(studentId));
      notifyBulkResult(1, 0, "students.restoreSuccess", "students.bulkRestoreSuccess");
    } catch (error) {
      handleError(error, "students.restore", "students.restoreFailed");
      throw error;
    }
  };

  const handleBulkDelete = async (
    studentIds: string[],
    deletionReason?: string,
  ): Promise<void> => {
    try {
      const result = await bulkDeleteStudents.mutateAsync({
        ids: studentIds.map(String),
        deletionReason,
      });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "students.deleteSuccess",
        "students.bulkDeleteSuccess",
      );
    } catch (error) {
      handleError(error, "students.bulk_delete", "students.deleteFailed");
    }
  };

  const handleBulkRestore = async (studentIds: string[]): Promise<void> => {
    try {
      const result = await bulkRestoreStudents.mutateAsync(studentIds.map(String));
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "students.restoreSuccess",
        "students.bulkRestoreSuccess",
      );
    } catch (error) {
      handleError(error, "students.bulk_restore", "students.restoreFailed");
    }
  };

  const handleBulkStatusChange = async (
    studentIds: string[],
    status: string,
  ): Promise<void> => {
    try {
      const result = await bulkUpdateStudentStatus.mutateAsync({
        ids: studentIds.map(String),
        status,
      });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "students.bulkStatusSuccess",
        "students.bulkStatusSuccessMany",
      );
    } catch (error) {
      handleError(error, "students.bulk_status", "students.bulkStatusFailed");
      throw error;
    }
  };

  return {
    handleSaveStudent,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
  };
}
