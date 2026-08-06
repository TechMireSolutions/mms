import { useState } from "react";
import {
  primaryResponsibleAdultDisplayName,
  toMessagingRecipient,
  type Student,
} from "@mms/shared";
import { exportExcel } from "@/components/ui/exportToolbarUtils";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { notify } from "@/lib/notify";
import { studentStatusBadgeConfig, studentStatusLabel } from "@/lib/students/studentStatusUi";

type MessageChannel = "whatsapp" | "sms" | "email";

/** Messaging composer, bulk confirms, and export for Students Work (Contacts-shaped bulk chrome). */
export function useStudentsWorkOverlays({
  selectedStudents,
}: {
  selectedStudents: Student[];
}) {
  const { t } = useTranslation();
  const statusBadgeConfig = studentStatusBadgeConfig(t);
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } =
    useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const openSelectionMessage = (channel: MessageChannel, targets: Student[]) => {
    openComposer(
      channel,
      targets.map((student) => toMessagingRecipient(student)),
    );
  };

  const handleBulkExport = async () => {
    try {
      await exportExcel({
        title: t("nav.students"),
        filename: "students_export",
        moduleId: "students",
        columns: [
          { header: t("students.columns.name"), key: "name" },
          { header: t("students.columns.grNumber"), key: "grNumber" },
          { header: t("students.columns.gender"), key: "gender" },
          { header: t("students.columns.status"), key: "status" },
          { header: t("students.columns.parents"), key: "fatherName" },
        ],
        rows: selectedStudents.map((student) => ({
          name: student.name ?? "",
          grNumber: student.grNumber ?? "",
          gender: student.gender ? formatContactGenderLabel(student.gender, t) : "",
          status: studentStatusLabel(t, student.status || "active"),
          fatherName: primaryResponsibleAdultDisplayName(student),
        })),
      });
      notify.success(t("students.exportSuccess"));
    } catch {
      notify.error(t("students.exportFailed"));
    }
  };

  return {
    statusBadgeConfig,
    messagingTarget,
    openComposer,
    openSelectionMessage,
    closeComposer,
    canWriteMessaging,
    confirmBulkDeleteOpen,
    setConfirmBulkDeleteOpen,
    confirmBulkRestoreOpen,
    setConfirmBulkRestoreOpen,
    pendingDeleteId,
    setPendingDeleteId,
    handleBulkExport,
  };
}
