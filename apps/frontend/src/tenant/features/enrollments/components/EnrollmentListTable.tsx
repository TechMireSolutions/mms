import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import {
  findEnrollmentStudent,
  getEnrollmentStudentDisplayName,
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
    openComposer,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-muted/20 border-b border-border/50">
          <tr>
            {isColumnVisible("student") && (
              <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.student")}
              </ResizableTableHead>
            )}
            {isColumnVisible("session") && (
              <ResizableTableHead columnKey="session" width={getColumnWidth?.("session")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.session")}
              </ResizableTableHead>
            )}
            {isColumnVisible("class") && (
              <ResizableTableHead columnKey="class" width={getColumnWidth?.("class")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.class")}
              </ResizableTableHead>
            )}
            {isColumnVisible("enrolledDate") && (
              <ResizableTableHead columnKey="enrolledDate" width={getColumnWidth?.("enrolledDate")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.enrolledDate")}
              </ResizableTableHead>
            )}
            {isColumnVisible("finalFee") && (
              <ResizableTableHead columnKey="finalFee" width={getColumnWidth?.("finalFee")} onResize={onColumnResize} className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.finalFee")}
              </ResizableTableHead>
            )}
            {isColumnVisible("status") && (
              <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.status")}
              </ResizableTableHead>
            )}
            {isColumnVisible("payment") && (
              <ResizableTableHead columnKey="payment" width={getColumnWidth?.("payment")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("enrollments.columns.payment")}
              </ResizableTableHead>
            )}
            <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
              {t("enrollments.columns.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.map((enrollment) => {
            const student = findEnrollmentStudent(enrollment, students);
            const studentDisplayName = getEnrollmentStudentDisplayName(enrollment, students);

            return (
              <motion.tr key={enrollment.id} layout className="hover:bg-muted/20 transition-colors">
                {isColumnVisible("student") && (
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{studentDisplayName}</span>
                      {student?.grNumber && (
                        <span className="text-xs text-primary font-bold">GR: {student.grNumber}</span>
                      )}
                    </div>
                  </td>
                )}
                {isColumnVisible("session") && (
                  <td className="px-3 py-2.5 text-xs text-foreground max-w-[10rem] truncate">{enrollment.sessionName}</td>
                )}
                {isColumnVisible("class") && (
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{enrollment.className || "—"}</td>
                )}
                {isColumnVisible("enrolledDate") && (
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDate(enrollment.enrolledDate)}</td>
                )}
                {isColumnVisible("finalFee") && (
                  <td className="px-3 py-2.5 text-end font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(enrollment.finalFee)}
                    {enrollment.discountPct > 0 && (
                      <span
                        className="ms-1 text-xs text-success font-normal"
                        aria-label={t("enrollments.discountPctAria", { pct: enrollment.discountPct })}
                      >
                        –{enrollment.discountPct}%
                      </span>
                    )}
                  </td>
                )}
                {isColumnVisible("status") && (
                  <td className="px-3 py-2.5">
                    <StatusBadge status={enrollment.status} config={statusConfig} size="sm" />
                  </td>
                )}
                {isColumnVisible("payment") && (
                  <td className="px-3 py-2.5">
                    {enrollment.paymentStatus
                      ? <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} size="sm" />
                      : "—"}
                  </td>
                )}
                <td className="px-3 py-2.5 text-end">
                  <EnrollmentRowActions
                    enrollment={enrollment}
                    student={student}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    onView={onView}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    openComposer={openComposer}
                  />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
