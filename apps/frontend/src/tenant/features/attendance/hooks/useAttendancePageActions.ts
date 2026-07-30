import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { notify } from "@/lib/notify";
import type { AttendanceRecord } from "@/lib/data/attendanceData";
import { useAttendanceMutations } from "@/tenant/features/attendance/hooks/useAttendance";
import { toMessagingRecipient } from "@mms/shared";

export function useAttendancePageActions() {
  const { t } = useTranslation();
  const {
    bulkUpsert,
    updateRecord,
    deleteRecord,
    restoreRecord,
  } = useAttendanceMutations();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const handleMessageAttendance = (channel: "sms" | "whatsapp" | "email", attRecords: AttendanceRecord[]) => {
    openComposer(
      channel,
      attRecords.map((record) =>
        toMessagingRecipient({
          id: record.studentId || record.id,
          name: record.studentName || t("attendance.messaging.student"),
          phone: typeof (record as { phone?: string }).phone === "string"
            ? (record as { phone?: string }).phone
            : "",
          email: typeof (record as { email?: string }).email === "string"
            ? (record as { email?: string }).email
            : "",
        }),
      ),
    );
  };

  const persistRecords = useCallback(async (recordsForClassDate: AttendanceRecord[]) => {
    await bulkUpsert.mutateAsync(recordsForClassDate);
  }, [bulkUpsert]);

  const handleUpdateRecord = useCallback(async (record: AttendanceRecord) => {
    await updateRecord.mutateAsync({ id: record.id, record });
  }, [updateRecord]);

  const handleDeleteRecord = useCallback(async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      notify.success(t("attendance.toast.archived"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [deleteRecord, t]);

  const handleRestoreRecord = useCallback(async (id: string) => {
    try {
      await restoreRecord.mutateAsync(id);
      notify.success(t("attendance.toast.restored"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [restoreRecord, t]);

  return {
    messagingTarget,
    closeComposer,
    handleMessageAttendance,
    persistRecords,
    handleUpdateRecord,
    handleDeleteRecord,
    handleRestoreRecord,
  };
}
