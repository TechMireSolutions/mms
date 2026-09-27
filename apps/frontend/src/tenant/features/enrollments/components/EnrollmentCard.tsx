import React from "react";
import type { ModuleColumnRegistryEntry, Student } from "@mms/shared";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import { renderEnrollmentWorkColumnValue } from "@/tenant/features/enrollments/components/enrollmentWorkColumnCell";
import type { EnrollmentListContentProps } from "@/tenant/features/enrollments/components/enrollmentListContentShared";

export interface EnrollmentCardProps {
  enrollment: Enrollment;
  student?: Student;
  studentDisplayName: string;
  selectedIds: string[];
  canSelectEnrollments: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  reducedMotion: boolean;
  visibleColumns: ModuleColumnRegistryEntry[];
  students: Student[];
  statusConfig: Record<string, StatusBadgeConfigItem>;
  paymentConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (value: number) => string;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onToggleSelectedEnrollment: (id: string, checked: boolean) => void;
  openComposer: EnrollmentListContentProps["openComposer"];
}

export function EnrollmentCard({
  enrollment,
  student,
  studentDisplayName,
  selectedIds,
  canSelectEnrollments,
  canWrite = false,
  canDelete = false,
  showDeleted = false,
  reducedMotion,
  visibleColumns,
  students,
  statusConfig,
  paymentConfig,
  formatCurrency,
  onView,
  onCancel,
  onDelete,
  onRestore,
  onToggleSelectedEnrollment,
  openComposer,
}: EnrollmentCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: enrollment,
    selectedIds,
    onToggleSelected: onToggleSelectedEnrollment,
    onView,
    canSelect: canSelectEnrollments,
  });

  return (
    <DirectoryEntityCard isSelected={isSelected} reducedMotion={reducedMotion} {...cardProps}>
      <DirectoryCardHeader
        id={enrollment.id}
        displayName={studentDisplayName || enrollment.studentName}
        isSelected={isSelected}
        showSelect={canSelectEnrollments}
        onSelect={onSelect}
        selectAriaLabel={t("enrollments.table.selectEnrollment", { name: studentDisplayName })}
        onView={handleView}
        viewAriaLabel={`${t("enrollments.table.viewProfile")} - ${studentDisplayName}`}
        reducedMotion={reducedMotion}
        subtitle={
          student?.grNumber ? (
            <p className="text-xs font-bold text-primary">
              {t("enrollments.detail.grNumber")}: {student.grNumber}
            </p>
          ) : undefined
        }
      />

      <DirectoryCardMetadata
        columns={visibleColumns}
        keyFor={(col) => col.key}
        labelFor={(col) => col.label}
        renderValue={(col) =>
          renderEnrollmentWorkColumnValue(enrollment, col.key, {
            t,
            students,
            statusConfig,
            paymentConfig,
            formatCurrency,
            emptyFallback: null,
          })
        }
      />

      <DirectoryCardFooterActions
        onView={handleView}
        viewLabel={t("enrollments.actions.viewShort")}
        viewAriaLabel={`${t("enrollments.table.viewProfile")} - ${studentDisplayName}`}
        overflowActions={
          <EnrollmentRowActions
            enrollment={enrollment}
            student={student}
            canWrite={canWrite}
            canDelete={canDelete}
            showDeleted={showDeleted}
            hideViewItem
            triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
            onView={onView}
            onCancel={onCancel}
            onDelete={onDelete}
            onRestore={onRestore}
            openComposer={openComposer}
          />
        }
      />
    </DirectoryEntityCard>
  );
}
