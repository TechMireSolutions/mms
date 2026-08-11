import type { Teacher } from "@mms/shared";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import type {
  TeachersDeleteTarget,
  useTeachersPageOverlayState,
} from "@/tenant/features/teachers/hooks/useTeachersPageOverlayState";

export type TeachersPageOverlaysProps = {
  showForm: boolean;
  editTeacher: Teacher | null;
  onCloseForm: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
  viewTeacher: Teacher | null;
  onCloseView: () => void;
  onEditFromDrawer: (teacher: Teacher) => void;
  onRestoreFromDrawer?: (teacherId: string) => void | Promise<void>;
  messagingTarget: ReturnType<typeof useMessageComposerState>["messagingTarget"];
  onCloseComposer: () => void;
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
  canWrite: boolean;
  canDelete: boolean;
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmBulkDelete: (reason?: string) => void | Promise<void>;
  deleteTarget: TeachersDeleteTarget | null;
  onDeleteTargetOpenChange: (open: boolean) => void;
  onConfirmSingleDelete: (reason?: string) => void | Promise<void>;
  bulkRestoreOpen: boolean;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => void | Promise<void>;
};

/** Work-tier interaction slice of page-owned overlays (list + bulk bar). */
export type TeachersWorkOverlayInteractions = Pick<
  ReturnType<typeof useTeachersPageOverlayState>,
  | "openComposer"
  | "openSelectionMessage"
  | "canWriteMessaging"
  | "setConfirmBulkDeleteOpen"
  | "setConfirmBulkRestoreOpen"
  | "setDeleteTarget"
  | "setViewTeacher"
>;
