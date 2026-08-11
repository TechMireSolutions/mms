import { useState } from "react";
import { toMessagingRecipient, type Teacher } from "@mms/shared";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

type MessageChannel = "whatsapp" | "sms" | "email";

export type TeachersDeleteTarget = { id: string; name?: string };

/** Page-owned Work overlays: composer, soft-delete confirms, profile drawer target. */
export function useTeachersPageOverlayState() {
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } =
    useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeachersDeleteTarget | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);

  const openSelectionMessage = (channel: MessageChannel, targets: Teacher[]) => {
    openComposer(
      channel,
      targets.map((teacher) => toMessagingRecipient(teacher)),
    );
  };

  return {
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
    viewTeacher,
    setViewTeacher,
  };
}
