import { useState } from "react";
import { toMessagingRecipient, type Student } from "@mms/shared";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { studentStatusBadgeConfig } from "@/lib/students/studentStatusUi";

type MessageChannel = "whatsapp" | "sms" | "email";

export type StudentsDeleteTarget = { id: string; name?: string };

/** Page-owned Work overlays: composer, soft-delete confirms, profile drawer target. */
export function useStudentsPageOverlayState() {
  const { t } = useTranslation();
  const statusBadgeConfig = studentStatusBadgeConfig(t);
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } =
    useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentsDeleteTarget | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const openSelectionMessage = (channel: MessageChannel, targets: Student[]) => {
    openComposer(
      channel,
      targets.map((student) => toMessagingRecipient(student)),
    );
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
    deleteTarget,
    setDeleteTarget,
    viewStudent,
    setViewStudent,
  };
}
