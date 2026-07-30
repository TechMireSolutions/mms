import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { EligibilityCheck } from "@/tenant/features/enrollments/components/EligibilityCheck";
import { EnrollmentList } from "@/tenant/features/enrollments/components/EnrollmentList";
import type { Enrollment } from "@/lib/data/enrollmentData";

type EnrollmentSubTab = {
  id: string;
  label: string;
};

type EnrollmentColumnProps = Pick<
  React.ComponentProps<typeof EnrollmentList>,
  "isColumnVisible" | "getColumnWidth" | "onColumnResize" | "columnCustomizer"
>;

interface EnrollmentsWorkTierProps {
  activeSubTab: string;
  subTabs: EnrollmentSubTab[];
  enrollments: Enrollment[];
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  isWorkListError: boolean;
  loadFailedTitle: string;
  onSubTabChange: (next: string) => void;
  onRetry: () => void;
  onShowDeletedChange: (showDeleted: boolean) => void;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onRestore: (id: string) => void;
  onFilteredCountChange: (count: number) => void;
  columnProps: EnrollmentColumnProps;
}

export function EnrollmentsWorkTier({
  activeSubTab,
  subTabs,
  enrollments,
  canWrite,
  canDelete,
  showDeleted,
  isWorkListError,
  loadFailedTitle,
  onSubTabChange,
  onRetry,
  onShowDeletedChange,
  onView,
  onCancel,
  onDeleteRequest,
  onRestore,
  onFilteredCountChange,
  columnProps,
}: EnrollmentsWorkTierProps): React.JSX.Element {
  return (
    <>
      <SubTabBar
        tabs={subTabs
          .filter((item) => canWrite || item.id !== "eligibility")
          .map((item) => ({ key: item.id, label: item.label }))}
        value={activeSubTab}
        onChange={onSubTabChange}
      />

      {activeSubTab === "list" && (
        <ErrorBoundary>
          {isWorkListError ? (
            <ErrorState
              title={loadFailedTitle}
              onRetry={onRetry}
            />
          ) : (
            <EnrollmentList
              enrollments={enrollments}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              onShowDeletedChange={onShowDeletedChange}
              onView={onView}
              onCancel={onCancel}
              onDelete={onDeleteRequest}
              onRestore={onRestore}
              onFilteredCountChange={onFilteredCountChange}
              {...columnProps}
            />
          )}
        </ErrorBoundary>
      )}

      {activeSubTab === "eligibility" && (
        <ErrorBoundary>
          <EligibilityCheck />
        </ErrorBoundary>
      )}
    </>
  );
}
