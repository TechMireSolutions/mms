import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";
import type { Teacher } from "@/lib/data/teachersData";
import { useTeacherMutations } from "@/tenant/features/teachers/hooks/useTeachers";
import { type TeacherRecord, toMessagingRecipient } from "@mms/shared";

interface UseTeachersPageActionsParams {
  editTeacher: Teacher | null;
}

export function useTeachersPageActions({
  editTeacher,
}: UseTeachersPageActionsParams) {
  const { t } = useTranslation();
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

  const handleDelete = (id: string) => {
    deleteTeacher.mutate(id, {
      onSuccess: () => notify.info(t("teachers.toast.deleted")),
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreTeacher.mutate(id, {
      onSuccess: () => notify.success(t("teachers.restoreSuccess")),
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteTeachers.mutate(ids, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("teachers.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.info(t("teachers.toast.deleted"));
        }
      },
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkRestore = (ids: string[]) => {
    bulkRestoreTeachers.mutate(ids, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("teachers.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("teachers.restoreSuccess"));
        }
      },
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkStatusChange = (ids: string[], status: string) => {
    bulkUpdateTeacherStatus.mutate({ ids, status }, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("teachers.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("teachers.toast.statusUpdated"));
        }
      },
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
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
