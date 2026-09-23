import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";
import type { Faculty, Teacher } from '@mms/shared';
import { useFacultyMutations } from "@/tenant/features/faculty/hooks/useFaculty";
import { useTeachersCrudNotify } from "@/tenant/features/faculty/hooks/useFacultyCrudNotify";
import { type FacultyRecord, toMessagingRecipient } from "@mms/shared";

export interface UseFacultyPageActionsParams {
  editFaculty?: Faculty | null;
  editTeacher?: Teacher | null;
}
export type UseTeachersPageActionsParams = UseFacultyPageActionsParams;

export function useFacultyPageActions({
  editFaculty,
  editTeacher,
}: UseFacultyPageActionsParams) {
  const effectiveEditTarget = editFaculty ?? editTeacher ?? null;
  const { t } = useTranslation();
  const { handleError, notifyBulkResult, notifyArchivedWithUndo } = useTeachersCrudNotify();
  const {
    createFaculty,
    updateFaculty,
    deleteFaculty,
    bulkDeleteFaculty,
    restoreFaculty,
    bulkRestoreFaculty,
    bulkUpdateFacultyStatus,
    bulkUpdateFacultySpecialization,
    isBulkSpecializationPending,
  } = useFacultyMutations();
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const toRecipients = (list: Faculty[]) =>
    list.map((item) => toMessagingRecipient(item));

  const handleWhatsApp = (list: Faculty[]) => {
    if (!canWriteMessaging) return;
    openComposer("whatsapp", toRecipients(list));
  };

  const handleSms = (list: Faculty[]) => {
    if (!canWriteMessaging) return;
    openComposer("sms", toRecipients(list));
  };

  const handleEmail = (list: Faculty[]) => {
    if (!canWriteMessaging) return;
    openComposer("email", toRecipients(list));
  };

  const handleSaveFaculty = async (facultyToSave: Faculty): Promise<Faculty> => {
    if (effectiveEditTarget) {
      const res = await updateFaculty.mutateAsync({
        params: { id: String(facultyToSave.id) },
        body: facultyToSave as unknown as FacultyRecord,
      });
      notify.success(t("teachers.toast.updated"));
      const raw = res.body as unknown;
      if (raw && typeof raw === "object") {
        const envelope = raw as Record<string, unknown>;
        const entity = envelope.faculty ?? envelope.teacher ?? envelope.facultyMember ?? envelope;
        return entity as Faculty;
      }
      return raw as Faculty;
    } else {
      const res = await createFaculty.mutateAsync({
        body: facultyToSave as unknown as FacultyRecord,
      });
      notify.success(t("teachers.toast.created"));
      const raw = res.body as unknown;
      if (raw && typeof raw === "object") {
        const envelope = raw as Record<string, unknown>;
        const entity = envelope.faculty ?? envelope.teacher ?? envelope.facultyMember ?? envelope;
        return entity as Faculty;
      }
      return raw as Faculty;
    }
  };

  const handleDelete = async (id: string, deletionReason?: string): Promise<void> => {
    try {
      await deleteFaculty.mutateAsync({ params: { id }, body: { deletionReason } });
      notifyArchivedWithUndo(() => handleRestore(id));
    } catch (error) {
      handleError(error, "teachers.delete", "teachers.deleteFailed");
      throw error;
    }
  };

  const handleRestore = async (id: string): Promise<void> => {
    try {
      await restoreFaculty.mutateAsync({ params: { id }, body: {} });
      notifyBulkResult(1, 0, "teachers.restoreSuccess", "teachers.restoreSuccess");
    } catch (error) {
      handleError(error, "teachers.restore", "teachers.restoreFailed");
      throw error;
    }
  };

  const handleBulkDelete = async (ids: string[], deletionReason?: string): Promise<void> => {
    try {
      const result = await bulkDeleteFaculty.mutateAsync({ body: { ids, deletionReason } });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
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
      const result = await bulkRestoreFaculty.mutateAsync({ body: { ids } });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
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
      const result = await bulkUpdateFacultyStatus.mutateAsync({ body: { ids, status } });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
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
      const result = await bulkUpdateFacultySpecialization({ body: { ids, specialization } });
      notifyBulkResult(
        result.body.succeeded,
        result.body.failed,
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
    handleSaveFaculty,
    handleSaveTeacher: handleSaveFaculty,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
    handleBulkSpecializationChange,
    isBulkSpecializationPending,
  };
}

export const useTeachersPageActions = useFacultyPageActions;

