import { type Student, type StudentsBulkEnrollBody } from "@mms/shared";
import {
  type useStudentMutations,
  type StudentRecord,
} from "@/tenant/features/students/hooks/useStudents";
import { useStudentsBulkEnrollMutation } from "@/tenant/features/students/hooks/useStudentMutations";
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
  const bulkEnrollMutation = useStudentsBulkEnrollMutation();
  const {
    deleteStudent,
    bulkDeleteStudents,
    restoreStudent,
    bulkRestoreStudents,
    bulkUpdateStudentStatus,
    createStudent,
    updateStudent,
  } = mutations;

  const handleSaveStudent = async (studentToSave: Student): Promise<Student> => {
    if (editStudent) {
      const res = await updateStudent.mutateAsync({
        params: { id: String(studentToSave.id) },
        body: studentToSave as StudentRecord,
      });
      return res.body as Student;
    } else {
      const res = await createStudent.mutateAsync({
        body: studentToSave as StudentRecord,
      });
      return res.body as Student;
    }
  };

  const handleDelete = async (studentId: string, deletionReason?: string): Promise<void> => {
    try {
      await deleteStudent.mutateAsync({ params: { id: String(studentId) }, body: { deletionReason } });
      notifyBulkResult(1, 0, "students.deleteSuccess", "students.bulkDeleteSuccess");
    } catch (error) {
      handleError(error, "students.delete", "students.deleteFailed");
    }
  };

  const handleRestore = async (studentId: string): Promise<void> => {
    try {
      await restoreStudent.mutateAsync({ params: { id: String(studentId) }, body: {} });
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
        body: { ids: studentIds.map(String), deletionReason },
      });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
        "students.deleteSuccess",
        "students.bulkDeleteSuccess",
      );
    } catch (error) {
      handleError(error, "students.bulk_delete", "students.deleteFailed");
    }
  };

  const handleBulkRestore = async (studentIds: string[]): Promise<void> => {
    try {
      const result = await bulkRestoreStudents.mutateAsync({ body: { ids: studentIds.map(String) } });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
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
        body: { ids: studentIds.map(String), status },
      });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
        "students.bulkStatusSuccess",
        "students.bulkStatusSuccessMany",
      );
    } catch (error) {
      handleError(error, "students.bulk_status", "students.bulkStatusFailed");
      throw error;
    }
  };

  const handleBulkEnroll = async (
    studentIds: string[],
    payload: { sessionIds: string[]; mode: StudentsBulkEnrollBody["mode"] },
  ): Promise<void> => {
    try {
      const result = await bulkEnrollMutation.mutateAsync({
        studentIds,
        sessionIds: payload.sessionIds,
        mode: payload.mode,
      });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "students.bulkEnrollSuccess",
        "students.bulkEnrollSuccess",
      );
    } catch (error) {
      handleError(error, "students.bulk_enroll", "students.saveFailed");
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
    handleBulkEnroll,
    bulkEnrollPending: bulkEnrollMutation.isPending,
  };
}
