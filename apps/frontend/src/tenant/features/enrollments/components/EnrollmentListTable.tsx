import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import { renderEnrollmentWorkColumnValue } from "@/tenant/features/enrollments/components/enrollmentWorkColumnCell";
import {
  findEnrollmentStudent,
  type EnrollmentListContentProps,
} from "@/tenant/features/enrollments/components/enrollmentListContentShared";

type EnrollmentListTableProps = Omit<
  EnrollmentListContentProps,
  "filteredCount" | "page" | "pageSize" | "onPageChange"
>;

export function EnrollmentListTable(props: EnrollmentListTableProps): React.JSX.Element {
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

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
          {canSelectEnrollments && (
            <TableHead className="w-12 px-3 py-2.5 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("enrollments.table.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("student") && (
            <ModuleTableHeaderCell columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.student")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("session") && (
            <ModuleTableHeaderCell columnKey="session" width={getColumnWidth?.("session")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.session")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("class") && (
            <ModuleTableHeaderCell columnKey="class" width={getColumnWidth?.("class")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.class")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("enrolledDate") && (
            <ModuleTableHeaderCell columnKey="enrolledDate" width={getColumnWidth?.("enrolledDate")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.enrolledDate")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("finalFee") && (
            <ModuleTableHeaderCell columnKey="finalFee" width={getColumnWidth?.("finalFee")} onResize={onColumnResize} className="px-3 py-2.5 text-end">
              {t("enrollments.columns.finalFee")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.status")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("payment") && (
            <ModuleTableHeaderCell columnKey="payment" width={getColumnWidth?.("payment")} onResize={onColumnResize} className="px-3 py-2.5">
              {t("enrollments.columns.payment")}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase h-auto">
            {t("enrollments.columns.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border">
        {enrollments.map((enrollment) => {
          const student = findEnrollmentStudent(enrollment, students);
          const isSelected = selectedIds.includes(enrollment.id);
          const columnOptions = { t, students, statusConfig, paymentConfig, formatCurrency };

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
                <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[10rem] truncate">
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
