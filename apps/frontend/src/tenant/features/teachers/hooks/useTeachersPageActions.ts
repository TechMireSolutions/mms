import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";
import type { Teacher } from '@mms/shared';
import { useTeacherMutations } from "@/tenant/features/teachers/hooks/useTeachers";
import { useTeachersCrudNotify } from "@/tenant/features/teachers/hooks/useTeachersCrudNotify";
import { type TeacherRecord, toMessagingRecipient } from "@mms/shared";

interface UseTeachersPageActionsParams {
  editTeacher: Teacher | null;
}

export function useTeachersPageActions({
  editTeacher,
}: UseTeachersPageActionsParams) {
  const { t } = useTranslation();
  const { handleError, notifyBulkResult } = useTeachersCrudNotify();
  const {
    createTeacher,
    updateTeacher,
    deleteTeacher,
    bulkDeleteTeachers,
    restoreTeacher,
    bulkRestoreTeachers,
    bulkUpdateTeacherStatus,
    bulkUpdateTeacherSpecialization,
    isBulkSpecializationPending,
  } = useTeacherMutations();
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const toTeacherRecipients = (teachersList: Teacher[]) =>
    teachersList.map((teacher) => toMessagingRecipient(teacher));

  const handleWhatsApp = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer("whatsapp", toTeacherRecipients(teachersList));
  };

  const handleSms = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer("sms", toTeacherRecipients(teachersList));
  };

  const handleEmail = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer("email", toTeacherRecipients(teachersList));
  };

  const handleSaveTeacher = async (teacherToSave: Teacher) => {
    if (editTeacher) {
      await updateTeacher.mutateAsync({
        id: String(teacherToSave.id),
        teacher: teacherToSave as unknown as TeacherRecord,
      });
      notify.success(t("teachers.toast.updated"));
    } else {
      await createTeacher.mutateAsync(teacherToSave as unknown as TeacherRecord);
      notify.success(t("teachers.toast.created"));
    }
  };

  const handleDelete = async (id: string, deletionReason?: string): Promise<void> => {
    try {
      await deleteTeacher.mutateAsync({ id, deletionReason });
      notifyBulkResult(1, 0, "teachers.toast.deleted", "teachers.toast.deleted");
    } catch (error) {
      handleError(error, "teachers.delete", "teachers.deleteFailed");
      throw error;
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    try {
      await restoreTeacher.mutateAsync(id);
      notifyBulkResult(1, 0, "teachers.restoreSuccess", "teachers.restoreSuccess");
    } catch (error) {
      handleError(error, "teachers.restore", "teachers.restoreFailed");
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[], deletionReason?: string): Promise<void> => {
    try {
      const result = await bulkDeleteTeachers.mutateAsync({ ids, deletionReason });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "teachers.toast.deleted",
        "teachers.toast.deleted",
      );
    } catch (error) {
      handleError(error, "teachers.bulk_delete", "teachers.deleteFailed");
      throw error;
    }
  };

  const handleBulkRestore = async (ids: string[]): Promise<void> => {
    try {
      const result = await bulkRestoreTeachers.mutateAsync(ids);
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "teachers.restoreSuccess",
        "teachers.restoreSuccess",
      );
    } catch (error) {
      handleError(error, "teachers.bulk_restore", "teachers.restoreFailed");
      throw error;
    }
  };

  const handleBulkStatusChange = async (ids: string[], status: string): Promise<void> => {
    try {
      const result = await bulkUpdateTeacherStatus.mutateAsync({ ids, status });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "teachers.toast.statusUpdated",
        "teachers.toast.statusUpdated",
      );
    } catch (error) {
      handleError(error, "teachers.bulk_status", "teachers.bulkStatusFailed");
      throw error;
    }
  };

  const handleBulkSpecializationChange = async (
    ids: string[],
    specialization: string,
  ): Promise<void> => {
    try {
      const result = await bulkUpdateTeacherSpecialization({ ids, specialization });
      notifyBulkResult(
        result.succeeded,
        result.failed,
        "teachers.bulkSpecializationSuccess",
        "teachers.bulkSpecializationSuccess",
      );
    } catch (error) {
      handleError(error, "teachers.bulk_specialization", "teachers.bulkStatusFailed");
      throw error;
    }
  };

  return {
    messagingTarget,
    openComposer,
    canWriteMessaging,
    closeComposer,
    handleWhatsApp,
    handleSms,
    handleEmail,
    handleSaveTeacher,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
    handleBulkSpecializationChange,
    isBulkSpecializationPending,
  };
}
