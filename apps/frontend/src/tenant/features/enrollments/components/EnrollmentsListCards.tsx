import React from "react";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import { getEnrollmentVisibleWorkColumns } from "@/tenant/features/enrollments/components/enrollmentListVisibleColumns";
import { renderEnrollmentWorkColumnValue } from "@/tenant/features/enrollments/components/enrollmentWorkColumnCell";
import {
  findEnrollmentStudent,
  getEnrollmentStudentDisplayName,
  type EnrollmentListContentProps,
} from "@/tenant/features/enrollments/components/enrollmentListContentShared";

type EnrollmentListCardsProps = Omit<
  EnrollmentListContentProps,
  "filteredCount" | "page" | "pageSize" | "getColumnWidth" | "onColumnResize" | "onPageChange"
>;

export function EnrollmentsListCards(props: EnrollmentListCardsProps): React.JSX.Element {
  const {
    enrollments,
    students,
    isColumnVisible,
    columnRegistry,
    canSelectEnrollments,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    showDeleted,
    statusConfig,
    paymentConfig,
    formatCurrency,
    onView,
    onCancel,
    onDelete,
    onRestore,
    onToggleSelectAll,
    onToggleSelectedEnrollment,
    openComposer,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(enrollments.length, t, {
    singular: "enrollments.item.enrollment",
    plural: "enrollments.item.enrollments",
  });

  return (
    <ModuleDirectoryCards
      items={enrollments}
      selectedIds={selectedIds}
      onSelectAll={canSelectEnrollments ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
      allSelected={allVisibleSelected}
      someSelected={someVisibleSelected}
      selectAllLabel={t("enrollments.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("enrollments.selectedCount", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="enrollments-cards"
      renderItem={(enrollment) => {
        const isSelected = selectedIds.includes(enrollment.id);
        const student = findEnrollmentStudent(enrollment, students);
        const studentDisplayName = getEnrollmentStudentDisplayName(enrollment, students);
        const visibleColumns = getEnrollmentVisibleWorkColumns(columnRegistry, isColumnVisible, {
          excludeFace: true,
        });

        return (
          <DirectoryEntityCard key={enrollment.id} isSelected={isSelected} reducedMotion={reducedMotion}>
            <DirectoryCardHeader
              id={enrollment.id}
              displayName={studentDisplayName || enrollment.studentName}
              isSelected={isSelected}
              showSelect={canSelectEnrollments}
              onSelect={() => onToggleSelectedEnrollment(enrollment.id, !isSelected)}
              selectAriaLabel={t("enrollments.table.selectEnrollment", { name: studentDisplayName })}
              onView={() => onView(enrollment)}
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

            <DirectoryCardFooter
              trailing={
                <>
                  <DirectoryCardViewButton
                    label={t("enrollments.actions.viewShort")}
                    ariaLabel={`${t("enrollments.table.viewProfile")} - ${studentDisplayName}`}
                    onClick={() => onView(enrollment)}
                  />
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
                </>
              }
            />
          </DirectoryEntityCard>
        );
      }}
    />
  );
}

