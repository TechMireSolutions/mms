import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import {
  findEnrollmentStudent,
  getEnrollmentStudentDisplayName,
  type EnrollmentListContentProps,
} from "@/tenant/features/enrollments/components/enrollmentListContentShared";

type EnrollmentListCardsProps = Omit<
  EnrollmentListContentProps,
  "filteredCount" | "page" | "pageSize" | "getColumnWidth" | "onColumnResize" | "onPageChange"
>;

export function EnrollmentListCards(props: EnrollmentListCardsProps): React.JSX.Element {
  const {
    enrollments,
    students,
    visibleColumns,
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
    openComposer,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3 md:hidden">
      {enrollments.map((enrollment) => {
        const student = findEnrollmentStudent(enrollment, students);
        const studentDisplayName = getEnrollmentStudentDisplayName(enrollment, students);

        return (
          <motion.article
            key={enrollment.id}
            layout
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              {visibleColumns.student && (
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground">{studentDisplayName}</h4>
                  {student?.grNumber && (
                    <p className="text-xs font-bold text-primary">
                      {t("enrollments.detail.grNumber")}: {student.grNumber}
                    </p>
                  )}
                </div>
              )}
              {visibleColumns.finalFee && (
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(enrollment.finalFee)}
                  {enrollment.discountPct > 0 && (
                    <span
                      className="ms-1 text-xs text-success font-normal"
                      aria-label={t("enrollments.discountPctAria", { pct: enrollment.discountPct })}
                    >
                      –{enrollment.discountPct}%
                    </span>
                  )}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {visibleColumns.session && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("enrollments.columns.session")}</dt>
                  <dd className="truncate text-foreground">{enrollment.sessionName}</dd>
                </div>
              )}
              {visibleColumns.class && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("enrollments.columns.class")}</dt>
                  <dd className="text-foreground">{enrollment.className || "—"}</dd>
                </div>
              )}
              {visibleColumns.enrolledDate && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("enrollments.columns.enrolledDate")}</dt>
                  <dd className="font-mono text-muted-foreground">{formatDate(enrollment.enrolledDate)}</dd>
                </div>
              )}
              {visibleColumns.status && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("enrollments.columns.status")}</dt>
                  <dd><StatusBadge status={enrollment.status} config={statusConfig} size="sm" /></dd>
                </div>
              )}
              {visibleColumns.payment && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("enrollments.columns.payment")}</dt>
                  <dd>
                    {enrollment.paymentStatus
                      ? <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} size="sm" />
                      : "—"}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2">
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
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
