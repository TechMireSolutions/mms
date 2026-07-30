import type React from "react";
import { AnimatePresence } from "framer-motion";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FormModal } from "@/components/ui/FormModal";
import { EnrollmentDetail } from "@/tenant/features/enrollments/components/EnrollmentDetail";
import { EnrollmentWizard } from "@/tenant/features/enrollments/components/EnrollmentWizard";
import type { Enrollment } from "@/lib/data/enrollmentData";

interface EnrollmentsModalLayerProps {
  viewing: Enrollment | null;
  canWrite: boolean;
  showDeleted: boolean;
  showWizard: boolean;
  pendingDeleteId: string | null;
  wizardTitle: string;
  confirmDeleteTitle: string;
  confirmDeleteDescription: string;
  confirmLabel: string;
  cancelLabel: string;
  onCloseViewing: () => void;
  onStatusChange: (id: string, newStatus: Enrollment["status"]) => void;
  onCloseWizard: () => void;
  onCompleteWizard: (enrollment: Enrollment) => Promise<void>;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
}

export function EnrollmentsModalLayer({
  viewing,
  canWrite,
  showDeleted,
  showWizard,
  pendingDeleteId,
  wizardTitle,
  confirmDeleteTitle,
  confirmDeleteDescription,
  confirmLabel,
  cancelLabel,
  onCloseViewing,
  onStatusChange,
  onCloseWizard,
  onCompleteWizard,
  onPendingDeleteChange,
  onConfirmDelete,
}: EnrollmentsModalLayerProps): React.JSX.Element {
  return (
    <>
      <AnimatePresence>
        {viewing && !showDeleted && (
          <ErrorBoundary>
            <EnrollmentDetail
              enrollment={viewing}
              canWrite={canWrite}
              onClose={onCloseViewing}
              onStatusChange={onStatusChange}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>

      <FormModal
        open={showWizard}
        onClose={onCloseWizard}
        title={wizardTitle}
        size="xl"
        hideFooter
        panelClassName="h-[88vh] max-h-[43.75rem]"
      >
        <ErrorBoundary>
          <EnrollmentWizard
            onComplete={onCompleteWizard}
            onCancel={onCloseWizard}
          />
        </ErrorBoundary>
      </FormModal>

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) onPendingDeleteChange(null);
        }}
        title={confirmDeleteTitle}
        description={confirmDeleteDescription}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={() => {
          if (pendingDeleteId) onConfirmDelete(pendingDeleteId);
          onPendingDeleteChange(null);
        }}
      />
    </>
  );
}
