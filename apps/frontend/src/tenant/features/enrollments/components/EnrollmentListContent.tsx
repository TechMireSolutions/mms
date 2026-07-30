import { Card } from "@/components/ui/card";
import { ListPagination } from "@/components/ui/ListPagination";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { EnrollmentRowActions } from "@/tenant/features/enrollments/components/EnrollmentRowActions";
import { formatDate, type Student, type toMessagingRecipient } from "@mms/shared";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

type MessageChannel = "whatsapp" | "sms" | "email";

export interface EnrollmentListVisibleColumns {
  student: boolean;
  session: boolean;
  class: boolean;
  enrolledDate: boolean;
  finalFee: boolean;
  status: boolean;
  payment: boolean;
}

interface EnrollmentListContentProps {
  enrollments: Enrollment[];
  filteredCount: number;
  page: number;
  pageSize: number;
  students: Student[];
  visibleColumns: EnrollmentListVisibleColumns;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  paymentConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (value: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onPageChange: (page: number) => void;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: MessageChannel, recipients: ReturnType<typeof toMessagingRecipient>[]) => void;
}

export function EnrollmentListContent({
  enrollments,
  filteredCount,
  page,
  pageSize,
  students,
  visibleColumns,
  canWrite,
  canDelete,
  showDeleted,
  statusConfig,
  paymentConfig,
  formatCurrency,
  getColumnWidth,
  onColumnResize,
  onPageChange,
  onView,
  onCancel,
  onDelete,
  onRestore,
  openComposer,
}: EnrollmentListContentProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card" role="status">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">
            {showDeleted ? t("enrollments.empty.trashTitle") : t("enrollments.empty.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {showDeleted ? t("enrollments.empty.trashSubtitle") : t("enrollments.empty.description")}
          </p>
        </div>
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <div className="space-y-3 p-3 md:hidden">
            {enrollments.map((enrollment) => {
              const student = students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
              const studentDisplayName = enrollment.studentName?.trim() || student?.name || "";

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
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/20 border-b border-border/50">
                <tr>
                  {visibleColumns.student && (
                    <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.student")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.session && (
                    <ResizableTableHead columnKey="session" width={getColumnWidth?.("session")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.session")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.class && (
                    <ResizableTableHead columnKey="class" width={getColumnWidth?.("class")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.class")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.enrolledDate && (
                    <ResizableTableHead columnKey="enrolledDate" width={getColumnWidth?.("enrolledDate")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.enrolledDate")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.finalFee && (
                    <ResizableTableHead columnKey="finalFee" width={getColumnWidth?.("finalFee")} onResize={onColumnResize} className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.finalFee")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.status && (
                    <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.status")}
                    </ResizableTableHead>
                  )}
                  {visibleColumns.payment && (
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
                  const student = students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
                  const studentDisplayName = enrollment.studentName?.trim() || student?.name || "";

                  return (
                    <motion.tr key={enrollment.id} layout className="hover:bg-muted/20 transition-colors">
                      {visibleColumns.student && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{studentDisplayName}</span>
                            {student?.grNumber && (
                              <span className="text-xs text-primary font-bold">GR: {student.grNumber}</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.session && (
                        <td className="px-3 py-2.5 text-xs text-foreground max-w-[10rem] truncate">{enrollment.sessionName}</td>
                      )}
                      {visibleColumns.class && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{enrollment.className || "—"}</td>
                      )}
                      {visibleColumns.enrolledDate && (
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDate(enrollment.enrolledDate)}</td>
                      )}
                      {visibleColumns.finalFee && (
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
                      {visibleColumns.status && (
                        <td className="px-3 py-2.5">
                          <StatusBadge status={enrollment.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      {visibleColumns.payment && (
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
        </Card>
      )}

      <ListPagination
        page={page}
        total={filteredCount}
        limit={pageSize}
        onPageChange={onPageChange}
        i18nNamespace="enrollments"
        variant="summary"
      />
    </>
  );
}
