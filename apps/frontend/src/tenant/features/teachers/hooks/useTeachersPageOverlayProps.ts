import type { Teacher } from "@mms/shared";
import type { TeachersPageOverlaysProps } from "@/tenant/features/teachers/hooks/teachersPageOverlaysTypes";
import type { useTeachersPageFormState } from "@/tenant/features/teachers/hooks/useTeachersPageFormState";
import type { useTeachersPageOverlayState } from "@/tenant/features/teachers/hooks/useTeachersPageOverlayState";
import type { useTeachersPageActions } from "@/tenant/features/teachers/hooks/useTeachersPageActions";

type FormState = ReturnType<typeof useTeachersPageFormState>;
type WorkOverlays = ReturnType<typeof useTeachersPageOverlayState>;
type WorkActions = ReturnType<typeof useTeachersPageActions>;

/** Maps form / overlay / action slices into TeachersPageOverlaysProps (Contacts-shaped). */
export function useTeachersPageOverlayProps({
  canWrite,
  canDelete,
  formState,
  overlays,
  workActions,
  selectedIds,
  clearSelection,
}: {
  canWrite: boolean;
  canDelete: boolean;
  formState: FormState;
  overlays: WorkOverlays;
  workActions: Pick<
    WorkActions,
    "handleSaveTeacher" | "handleRestore" | "handleDelete" | "handleBulkDelete" | "handleBulkRestore"
  >;
  selectedIds: string[];
  clearSelection: () => void;
}): TeachersPageOverlaysProps {
  return {
    showForm: formState.showForm,
    editTeacher: formState.editTeacher,
    onCloseForm: formState.close,
    onSave: workActions.handleSaveTeacher,
    viewTeacher: overlays.viewTeacher,
    onCloseView: () => overlays.setViewTeacher(null),
    onEditFromDrawer: (teacher: Teacher) => {
      overlays.setViewTeacher(null);
      formState.openEdit(teacher);
    },
    onRestoreFromDrawer: canDelete
      ? async (teacherId) => {
          try {
            await workActions.handleRestore(teacherId);
            overlays.setViewTeacher(null);
          } catch {
            // Keep drawer open so the user can retry after a failed restore.
          }
        }
      : undefined,
    messagingTarget: overlays.messagingTarget,
    onCloseComposer: overlays.closeComposer,
    openComposer: overlays.openComposer,
    canWriteMessaging: overlays.canWriteMessaging,
    canWrite,
    canDelete,
    bulkDeleteOpen: overlays.confirmBulkDeleteOpen,
    onBulkDeleteOpenChange: overlays.setConfirmBulkDeleteOpen,
    selectedCount: selectedIds.length,
    onConfirmBulkDelete: async (reason) => {
      await workActions.handleBulkDelete(selectedIds, reason);
      clearSelection();
    },
    deleteTarget: overlays.deleteTarget,
    onDeleteTargetOpenChange: (open) => {
      if (!open) overlays.setDeleteTarget(null);
    },
    onConfirmSingleDelete: async (reason) => {
      if (!overlays.deleteTarget) return;
      await workActions.handleDelete(String(overlays.deleteTarget.id), reason);
      overlays.setDeleteTarget(null);
    },
    bulkRestoreOpen: overlays.confirmBulkRestoreOpen,
    onBulkRestoreOpenChange: overlays.setConfirmBulkRestoreOpen,
    onConfirmBulkRestore: async () => {
      await workActions.handleBulkRestore(selectedIds);
      clearSelection();
    },
  };
}
