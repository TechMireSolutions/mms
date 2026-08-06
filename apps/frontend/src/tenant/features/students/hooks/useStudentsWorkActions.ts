import { type Student } from "@mms/shared";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useStudentMutations,
  type StudentRecord,
} from "@/tenant/features/students/hooks/useStudents";

/** Mutate + notify wrappers for Students Work (Contacts-shaped action cluster). */
export function useStudentsWorkActions({
  editStudent,
  mutations,
}: {
  editStudent: Student | null;
  mutations: ReturnType<typeof useStudentMutations>;
}) {
  const { t } = useTranslation();
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
      notify.success(t("students.deleteSuccess"));
    } catch (error) {
      notify.error(t("students.deleteFailed"));
      throw error;
    }
  };

  const handleRestore = async (studentId: string): Promise<void> => {
    try {
      await restoreStudent.mutateAsync(String(studentId));
      notify.success(t("students.restoreSuccess"));
    } catch (error) {
      notify.error(t("students.restoreFailed"));
      throw error;
    }
  };

  const handleBulkDelete = async (
    studentIds: string[],
    deletionReason?: string,
  ): Promise<void> => {
    try {
      await bulkDeleteStudents.mutateAsync({
        ids: studentIds.map(String),
        deletionReason,
      });
      notify.success(t("students.deleteSuccess"));
    } catch (error) {
      notify.error(t("students.deleteFailed"));
      throw error;
    }
  };

  const handleBulkRestore = async (studentIds: string[]): Promise<void> => {
    try {
      await bulkRestoreStudents.mutateAsync(studentIds.map(String));
      notify.success(t("students.restoreSuccess"));
    } catch (error) {
      notify.error(t("students.restoreFailed"));
      throw error;
    }
  };

  const handleBulkStatusChange = async (
    studentIds: string[],
    status: string,
  ): Promise<void> => {
    try {
      await bulkUpdateStudentStatus.mutateAsync({
        ids: studentIds.map(String),
        status,
      });
      notify.success(t("students.bulkStatusSuccess"));
    } catch {
      notify.error(t("students.bulkStatusFailed"));
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
