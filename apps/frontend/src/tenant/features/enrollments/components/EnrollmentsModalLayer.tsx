import type React from "react";
import { AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FormModal } from "@/components/ui/FormModal";
import { EnrollmentDetail } from "@/tenant/features/enrollments/components/EnrollmentDetail";
import { EnrollmentsListConfirmDialogs } from "@/tenant/features/enrollments/components/EnrollmentsListConfirmDialogs";
import { EnrollmentWizard } from "@/tenant/features/enrollments/components/EnrollmentWizard";
import type { Enrollment } from "@/lib/data/enrollmentData";

interface EnrollmentsModalLayerProps {
  viewing: Enrollment | null;
  canWrite: boolean;
  showDeleted: boolean;
  showWizard: boolean;
  pendingDeleteId: string | null;
  wizardTitle: string;
  onCloseViewing: () => void;
  onStatusChange: (id: string, newStatus: Enrollment["status"]) => void;
  onCloseWizard: () => void;
  onCompleteWizard: (enrollment: Enrollment) => Promise<void>;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmDelete: (reason?: string) => void;
}

export function EnrollmentsModalLayer({
  viewing,
  canWrite,
  showDeleted,
  showWizard,
  pendingDeleteId,
  wizardTitle,
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
        {viewing && (
          <ErrorBoundary>
            <EnrollmentDetail
              enrollment={viewing}
              canWrite={canWrite && !showDeleted}
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

      <EnrollmentsListConfirmDialogs
        pendingDeleteId={pendingDeleteId}
        onPendingDeleteChange={onPendingDeleteChange}
        onConfirmDelete={onConfirmDelete}
      />
    </>
  );
}
