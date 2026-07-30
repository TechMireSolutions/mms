import { AnimatePresence } from "framer-motion";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { Session } from "@/lib/data/sessionsData";
import { SessionDetail } from "@/tenant/features/sessions/components/SessionDetail";
import { SessionForm } from "@/tenant/features/sessions/components/SessionForm";

interface SessionsDialogLayerProps {
  showForm: boolean;
  editSession: Session | null;
  detailSession: Session | null;
  showDeleted: boolean;
  pendingDeleteId: string | null;
  confirmBulkDeleteOpen: boolean;
  confirmBulkRestoreOpen: boolean;
  selectedCount: number;
  t: TranslationFunction;
  onCloseForm: () => void;
  onSave: (session: Session) => Promise<void>;
  onCloseDetail: () => void;
  onUpdate: (session: Session) => Promise<void>;
  onEdit: (session: Session) => void;
  onPendingDeleteOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onConfirmBulkDelete: () => void;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => void;
}

export function SessionsDialogLayer({
  showForm,
  editSession,
  detailSession,
  showDeleted,
  pendingDeleteId,
  confirmBulkDeleteOpen,
  confirmBulkRestoreOpen,
  selectedCount,
  t,
  onCloseForm,
  onSave,
  onCloseDetail,
  onUpdate,
  onEdit,
  onPendingDeleteOpenChange,
  onConfirmDelete,
  onBulkDeleteOpenChange,
  onConfirmBulkDelete,
  onBulkRestoreOpenChange,
  onConfirmBulkRestore,
}: SessionsDialogLayerProps): React.JSX.Element {
  return (
    <>
      <AnimatePresence>
        <SessionForm
          open={showForm}
          session={editSession}
          onClose={onCloseForm}
          onSave={onSave}
        />
        {detailSession && !showDeleted && (
          <SessionDetail
            session={detailSession}
            onClose={onCloseDetail}
            onUpdate={onUpdate}
            onEdit={onEdit}
          />
        )}
      </AnimatePresence>

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={onPendingDeleteOpenChange}
        title={t("sessions.confirmDeleteTitle")}
        description={t("sessions.confirmDeleteDescription")}
        confirmLabel={t("sessions.archive")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmDelete}
      />
      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={onBulkDeleteOpenChange}
        title={t("sessions.confirmDeleteTitle")}
        description={t("sessions.bulkDeleteConfirm", { count: selectedCount })}
        confirmLabel={t("sessions.archive")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmBulkDelete}
      />
      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={onBulkRestoreOpenChange}
        title={t("sessions.restore")}
        description={t("sessions.bulkRestoreConfirm", { count: selectedCount })}
        confirmLabel={t("sessions.restore")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmBulkRestore}
      />
    </>
  );
}
