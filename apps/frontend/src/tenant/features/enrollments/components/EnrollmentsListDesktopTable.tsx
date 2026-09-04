import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import { renderEnrollmentWorkColumnValue } from "@/tenant/features/enrollments/components/enrollmentWorkColumnCell";
import {
  findEnrollmentStudent,
  type EnrollmentListContentProps,
} from "@/tenant/features/enrollments/components/enrollmentListContentShared";

export type EnrollmentsListDesktopTableProps = Omit<
  EnrollmentListContentProps,
  "filteredCount" | "page" | "pageSize" | "onPageChange"
>;

export function EnrollmentsListDesktopTable(props: EnrollmentsListDesktopTableProps): React.JSX.Element {
  const {
    enrollments,
    students,
    isColumnVisible,
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
    getColumnWidth,
    onColumnResize,
    onView,
    onCancel,
    onDelete,
    onRestore,
    onToggleSelectAll,
    onToggleSelectedEnrollment,
    openComposer,
  } = props;
  const { t } = useTranslation();

  const studentsById = new Map<string, (typeof students)[number]>();
  for (const s of students) {
    studentsById.set(String(s.id), s);
  }
  const selectedIdsSet = new Set(selectedIds);
  const columnOptions = { t, students: studentsById, statusConfig, paymentConfig, formatCurrency };

  return (
    <Table className="table-fixed">
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("student") ? { id: "student", label: t("enrollments.columns.student") } : null,
          isColumnVisible("session") ? { id: "session", label: t("enrollments.columns.session") } : null,
          isColumnVisible("class") ? { id: "class", label: t("enrollments.columns.class") } : null,
          isColumnVisible("enrolledDate") ? { id: "enrolledDate", label: t("enrollments.columns.enrolledDate") } : null,
          isColumnVisible("finalFee") ? { id: "finalFee", label: t("enrollments.columns.finalFee"), headerClassName: "text-end" } : null,
          isColumnVisible("status") ? { id: "status", label: t("enrollments.columns.status") } : null,
          isColumnVisible("payment") ? { id: "payment", label: t("enrollments.columns.payment") } : null,
        ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canSelectEnrollments ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("enrollments.table.selectAll")
        } : undefined}
        actionsLabel={t("enrollments.columns.actions")}
        stickyColumnId={canSelectEnrollments ? "student" : undefined}
      />
      <TableBody className="divide-y divide-border">
        {enrollments.map((enrollment) => {
          const student = findEnrollmentStudent(enrollment, studentsById);
          const isSelected = selectedIdsSet.has(enrollment.id);

          return (
            <TableRow
              key={enrollment.id}
              className={`group transition-colors hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}
            >
              {canSelectEnrollments && (
                <TableCell className="px-3 py-2.5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelectedEnrollment(enrollment.id, checked === true)}
                    aria-label={t("enrollments.table.selectEnrollment", { name: enrollment.studentName })}
                  />
                </TableCell>
              )}
              {isColumnVisible("student") && (
                <TableCell className="px-3 py-2.5 whitespace-nowrap">
                  {renderEnrollmentWorkColumnValue(enrollment, "student", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("session") && (
                <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-cell-sm truncate">
                  {renderEnrollmentWorkColumnValue(enrollment, "session", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("class") && (
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {renderEnrollmentWorkColumnValue(enrollment, "class", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("enrolledDate") && (
                <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {renderEnrollmentWorkColumnValue(enrollment, "enrolledDate", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("finalFee") && (
                <TableCell className="px-3 py-2.5 text-end font-semibold text-foreground whitespace-nowrap">
                  {renderEnrollmentWorkColumnValue(enrollment, "finalFee", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-3 py-2.5">
                  {renderEnrollmentWorkColumnValue(enrollment, "status", columnOptions)}
                </TableCell>
              )}
              {isColumnVisible("payment") && (
                <TableCell className="px-3 py-2.5">
                  {renderEnrollmentWorkColumnValue(enrollment, "payment", columnOptions)}
                </TableCell>
              )}
              <TableCell className="px-3 py-2.5 text-end">
                <EnrollmentRowActions
                  enrollment={enrollment}
                  student={student}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  showDeleted={showDeleted}
                  triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
                  onView={onView}
                  onCancel={onCancel}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  openComposer={openComposer}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
