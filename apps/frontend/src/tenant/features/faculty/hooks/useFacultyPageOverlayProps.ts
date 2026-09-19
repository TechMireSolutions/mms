import type { Faculty, Teacher } from "@mms/shared";
import type {
  FacultyPageOverlaysProps,
} from "@/tenant/features/faculty/hooks/facultyPageOverlaysTypes";
import type { useFacultyPageFormState } from "@/tenant/features/faculty/hooks/useFacultyPageFormState";
import type { useFacultyPageOverlayState } from "@/tenant/features/faculty/hooks/useFacultyPageOverlayState";
import type { useFacultyPageActions } from "@/tenant/features/faculty/hooks/useFacultyPageActions";

type FormState = ReturnType<typeof useFacultyPageFormState>;
type WorkOverlays = ReturnType<typeof useFacultyPageOverlayState>;
type WorkActions = ReturnType<typeof useFacultyPageActions>;

/** Maps form / overlay / action slices into FacultyPageOverlaysProps (Contacts-shaped). */
export function useFacultyPageOverlayProps({
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
    | "handleRestore"
    | "handleDelete"
    | "handleBulkDelete"
    | "handleBulkRestore"
  > & {
    handleSaveFaculty?: WorkActions["handleSaveFaculty"];
    handleSaveTeacher?: WorkActions["handleSaveTeacher"];
  };

  selectedIds: string[];
  clearSelection: () => void;
}): FacultyPageOverlaysProps {
  const saveFn = workActions.handleSaveFaculty || workActions.handleSaveTeacher;
  const currentEdit = formState.editFaculty ?? formState.editTeacher ?? null;
  const currentView = overlays.viewFaculty ?? overlays.viewTeacher ?? null;

  return {
    showForm: formState.showForm,
    editFaculty: formState.editFaculty,
    editTeacher: formState.editTeacher,
    onCloseForm: formState.close,
    onSave: async (faculty: Faculty | Teacher) => {
      if (!saveFn) return;
      const saved = await saveFn(faculty);
      if (!currentEdit && saved) {
        formState.setEditFaculty?.(saved);
      }
    },
    viewFaculty: currentView,
    viewTeacher: currentView,
    onCloseView: () => overlays.setViewFaculty(null),
    onEditFromDrawer: (faculty: Faculty | Teacher) => {
      overlays.setViewFaculty(null);
      formState.openEdit(faculty);
    },
    onRestoreFromDrawer: canDelete
      ? async (facultyId) => {
          try {
            await workActions.handleRestore(facultyId);
            overlays.setViewFaculty(null);
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
    idCardFaculty: overlays.idCardFaculty,
    idCardTeachers: overlays.idCardTeachers,
    onCloseIdCards: overlays.closeIdCardsModal,
    onPrintIdCard: (faculty: Faculty | Teacher) => overlays.openIdCardsModal([faculty]),
  };
}

export const useTeachersPageOverlayProps = useFacultyPageOverlayProps;

