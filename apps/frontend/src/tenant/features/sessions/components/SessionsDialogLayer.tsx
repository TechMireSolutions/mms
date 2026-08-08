import { AnimatePresence } from "framer-motion";
import type { Session } from "@/lib/data/sessionsData";
import { SessionDetail } from "@/tenant/features/sessions/components/SessionDetail";
import { SessionForm } from "@/tenant/features/sessions/components/SessionForm";
import { SessionsListConfirmDialogs } from "@/tenant/features/sessions/components/SessionsListConfirmDialogs";

interface SessionsDialogLayerProps {
  showForm: boolean;
  editSession: Session | null;
  detailSession: Session | null;
  canDelete: boolean;
  pendingDeleteId: string | null;
  confirmBulkDeleteOpen: boolean;
  confirmBulkRestoreOpen: boolean;
  selectedCount: number;
  onCloseForm: () => void;
  onSave: (session: Session) => Promise<void>;
  onCloseDetail: () => void;
  onUpdate: (session: Session) => Promise<void>;
  onEdit: (session: Session) => void;
  onRestore: (sessionId: string) => void | Promise<void>;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmDelete: (reason?: string) => void;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onConfirmBulkDelete: (reason?: string) => void;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => void;
}

export function SessionsDialogLayer({
  showForm,
  editSession,
  detailSession,
  canDelete,
  pendingDeleteId,
  confirmBulkDeleteOpen,
  confirmBulkRestoreOpen,
  selectedCount,
  onCloseForm,
  onSave,
  onCloseDetail,
  onUpdate,
  onEdit,
  onRestore,
  onPendingDeleteChange,
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
        {detailSession ? (
          <SessionDetail
            session={detailSession}
            onClose={onCloseDetail}
            onUpdate={onUpdate}
            onEdit={onEdit}
            canDelete={canDelete}
            onRestore={onRestore}
          />
        ) : null}
      </AnimatePresence>

      <SessionsListConfirmDialogs
        selectedCount={selectedCount}
        confirmBulkDeleteOpen={confirmBulkDeleteOpen}
        confirmBulkRestoreOpen={confirmBulkRestoreOpen}
        pendingDeleteId={pendingDeleteId}
        onBulkDeleteOpenChange={onBulkDeleteOpenChange}
        onBulkRestoreOpenChange={onBulkRestoreOpenChange}
        onPendingDeleteChange={onPendingDeleteChange}
        onConfirmBulkDelete={onConfirmBulkDelete}
        onConfirmBulkRestore={onConfirmBulkRestore}
        onConfirmDelete={onConfirmDelete}
      />
    </>
  );
}
