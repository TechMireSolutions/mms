import { useState } from "react";
import { toMessagingRecipient, type Faculty } from "@mms/shared";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

type MessageChannel = "whatsapp" | "sms" | "email";

export type FacultyDeleteTarget = { id: string; name?: string };
export type TeachersDeleteTarget = FacultyDeleteTarget;

/** Page-owned Work overlays: composer, soft-delete confirms, profile drawer target. */
export function useFacultyPageOverlayState() {
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } =
    useMessageComposerState();
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacultyDeleteTarget | null>(null);
  const [viewFaculty, setViewFaculty] = useState<Faculty | null>(null);
  const [idCardFaculty, setIdCardFaculty] = useState<Faculty[]>([]);

  const openSelectionMessage = (channel: MessageChannel, targets: Faculty[]) => {
    openComposer(
      channel,
      targets.map((member) => toMessagingRecipient(member)),
    );
  };

  const openIdCardsModal = (facultyMembers: Faculty[]) => {
    setIdCardFaculty(facultyMembers);
  };

  const closeIdCardsModal = () => {
    setIdCardFaculty([]);
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
    viewFaculty,
    setViewFaculty,
    viewTeacher: viewFaculty,
    setViewTeacher: setViewFaculty,
    idCardFaculty,
    setIdCardFaculty,
    idCardTeachers: idCardFaculty,
    setIdCardTeachers: setIdCardFaculty,
    openIdCardsModal,
    closeIdCardsModal,
  };
}

export const useTeachersPageOverlayState = useFacultyPageOverlayState;

