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

  const handleDelete = (id: string, deletionReason?: string) => {
    deleteTeacher.mutate(
      { id, deletionReason },
      {
        onSuccess: () => notifyBulkResult(1, 0, "teachers.toast.deleted", "teachers.toast.deleted"),
        onError: (err) => handleError(err, "teachers.delete", "teachers.deleteFailed"),
      },
    );
  };

  const handleRestore = (id: string) => {
    restoreTeacher.mutate(id, {
      onSuccess: () => notifyBulkResult(1, 0, "teachers.restoreSuccess", "teachers.restoreSuccess"),
      onError: (err) => handleError(err, "teachers.restore", "teachers.restoreFailed"),
    });
  };

  const handleBulkDelete = (ids: string[], deletionReason?: string) => {
    bulkDeleteTeachers.mutate(
      { ids, deletionReason },
      {
        onSuccess: (result) =>
          notifyBulkResult(
            result.succeeded,
            result.failed,
            "teachers.toast.deleted",
            "teachers.toast.deleted",
          ),
        onError: (err) => handleError(err, "teachers.bulk_delete", "teachers.deleteFailed"),
      },
    );
  };

  const handleBulkRestore = (ids: string[]) => {
    bulkRestoreTeachers.mutate(ids, {
      onSuccess: (result) =>
        notifyBulkResult(
          result.succeeded,
          result.failed,
          "teachers.restoreSuccess",
          "teachers.restoreSuccess",
        ),
      onError: (err) => handleError(err, "teachers.bulk_restore", "teachers.restoreFailed"),
    });
  };

  const handleBulkStatusChange = (ids: string[], status: string) => {
    bulkUpdateTeacherStatus.mutate(
      { ids, status },
      {
        onSuccess: (result) =>
          notifyBulkResult(
            result.succeeded,
            result.failed,
            "teachers.toast.statusUpdated",
            "teachers.toast.statusUpdated",
          ),
        onError: (err) => handleError(err, "teachers.bulk_status", "teachers.bulkStatusFailed"),
      },
    );
  };

  return {
    messagingTarget,
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
  };
}
