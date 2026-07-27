import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Search, Eye, XCircle, MessageCircle, MessageSquare, Archive, RotateCcw, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { ListPagination } from "@/components/ui/ListPagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { ENROLLMENT_STATUSES, Enrollment } from '@/lib/data/enrollmentData';
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { formatDate } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const PAGE_SIZE = 12;

interface EnrollmentListProps {
  enrollments: Enrollment[];
  canWrite: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onShowDeletedChange?: (showDeleted: boolean) => void;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

/**
 * Renders a paginated, filterable table list of enrollment records.
 */
export function EnrollmentList({
  enrollments,
  canWrite,
  canDelete = false,
  showDeleted = false,
  onShowDeletedChange,
  onView,
  onCancel,
  onDelete,
  onRestore,
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: EnrollmentListProps): React.ReactElement {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [statusFilter, setStatus]   = useState<string>("all");
  const [sessionFilter, setSession] = useState<string>("all");

  const sessions = useSessionsCollection();

  const baseFiltered = useMemo<Enrollment[]>(() => {
    return enrollments.filter((enrollment) => {
      if (statusFilter !== "all" && enrollment.status !== statusFilter) return false;
      if (sessionFilter !== "all" && enrollment.sessionId !== sessionFilter) return false;
      return true;
    });
  }, [enrollments, statusFilter, sessionFilter]);

  const {
    searchQuery: search,
    currentPage: page,
    setCurrentPage: setPage,
    handleSearchChange,
    paginatedItems: paginatedEnrollments,
    filteredItems: filtered,
  } = useLocalPagination({
    items: baseFiltered,
    pageSize: PAGE_SIZE,
    searchFields: (enrollment) => [enrollment.studentName, enrollment.sessionName],
  });

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    setPage(1);
  }, [showDeleted, setPage]);

  const { data: students = [] } = useStudentsByIds(paginatedEnrollments.map((enrollment) => enrollment.studentId));

  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showSession = isColumnVisible ? isColumnVisible("session") : true;
  const showClass = isColumnVisible ? isColumnVisible("class") : true;
  const showEnrolledDate = isColumnVisible ? isColumnVisible("enrolledDate") : true;
  const showFinalFee = isColumnVisible ? isColumnVisible("finalFee") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showPayment = isColumnVisible ? isColumnVisible("payment") : true;

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    pending: { label: t("enrollments.status.pending"), cls: SEMANTIC_BADGE.warning },
    confirmed: { label: t("enrollments.status.confirmed"), cls: SEMANTIC_BADGE.success },
    cancelled: { label: t("enrollments.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
    completed: { label: t("enrollments.status.completed"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const paymentConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("enrollments.payment.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("enrollments.payment.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("enrollments.payment.overdue"), cls: SEMANTIC_BADGE.destructive },
    unpaid: { label: t("enrollments.payment.unpaid"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  return (
    <section className="space-y-4" aria-label={t("enrollments.list")}>
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder={t("enrollments.searchPlaceholder")}
          className="flex-1 min-w-[180px]"
        />

        {!showDeleted && (
          <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label={t("enrollments.filter.status")}>
            <Button
              variant="ghost"
              onClick={() => { setStatus("all"); setPage(1); }}
              className={`px-3 py-2 transition-colors rounded-none h-auto ${statusFilter === "all" ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {t("enrollments.filter.all")}
            </Button>
            {ENROLLMENT_STATUSES.map((status) => (
              <Button
                key={status.id}
                variant="ghost"
                onClick={() => { setStatus(status.id); setPage(1); }}
                className={`px-3 py-2 transition-colors rounded-none h-auto ${statusFilter === status.id ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              >
                {statusConfig[status.id]?.label ?? status.id}
              </Button>
            ))}
          </div>
        )}

        {!showDeleted && (
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-session" className="sr-only">{t("enrollments.filter.session")}</label>
            <FormSelect
              id="filter-session"
              value={sessionFilter}
              onChange={(value) => { setSession(value); setPage(1); }}
              options={[
                { value: "all", label: t("enrollments.filter.allSessions") },
                ...sessions.map((session) => ({ value: session.id, label: session.name }))
              ]}
              className="w-48 text-sm"
            />
          </div>
        )}

        {canDelete && onShowDeletedChange && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onShowDeletedChange(!showDeleted)}
            aria-pressed={showDeleted}
            className={showDeleted ? "border-destructive/40 text-destructive" : undefined}
          >
            <Archive className="w-3.5 h-3.5 me-1.5" aria-hidden="true" />
            <span>{showDeleted ? t("enrollments.showActive") : t("enrollments.showDeleted")}</span>
          </Button>
        )}

        {columnCustomizer && !showDeleted && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>

      {paginatedEnrollments.length === 0 ? (
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/20 border-b border-border/50">
                <tr>
                  {showStudent && (
                    <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.student")}
                    </ResizableTableHead>
                  )}
                  {showSession && (
                    <ResizableTableHead columnKey="session" width={getColumnWidth?.("session")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.session")}
                    </ResizableTableHead>
                  )}
                  {showClass && (
                    <ResizableTableHead columnKey="class" width={getColumnWidth?.("class")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.class")}
                    </ResizableTableHead>
                  )}
                  {showEnrolledDate && (
                    <ResizableTableHead columnKey="enrolledDate" width={getColumnWidth?.("enrolledDate")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.enrolledDate")}
                    </ResizableTableHead>
                  )}
                  {showFinalFee && (
                    <ResizableTableHead columnKey="finalFee" width={getColumnWidth?.("finalFee")} onResize={onColumnResize} className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.finalFee")}
                    </ResizableTableHead>
                  )}
                  {showStatus && (
                    <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.status")}
                    </ResizableTableHead>
                  )}
                  {showPayment && (
                    <ResizableTableHead columnKey="payment" width={getColumnWidth?.("payment")} onResize={onColumnResize} className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.payment")}
                    </ResizableTableHead>
                  )}
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("enrollments.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {paginatedEnrollments.map((enrollment) => {
                  const student = students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
                  const studentDisplayName = enrollment.studentName?.trim() || student?.name || "";
                  return (
                    <motion.tr key={enrollment.id} layout className="hover:bg-muted/20 transition-colors">
                      {showStudent && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{studentDisplayName}</span>
                            {student?.grNumber && (
                              <span className="text-[10px] text-primary font-bold">GR: {student.grNumber}</span>
                            )}
                          </div>
                        </td>
                      )}
                      {showSession && (
                        <td className="px-3 py-2.5 text-xs text-foreground max-w-[160px] truncate">{enrollment.sessionName}</td>
                      )}
                      {showClass && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{enrollment.className || "—"}</td>
                      )}
                      {showEnrolledDate && (
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDate(enrollment.enrolledDate)}</td>
                      )}
                      {showFinalFee && (
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(enrollment.finalFee)}
                          {enrollment.discountPct > 0 && (
                            <span
                              className="ms-1 text-[10px] text-success font-normal"
                              aria-label={t("enrollments.discountPctAria", { pct: enrollment.discountPct })}
                            >
                              –{enrollment.discountPct}%
                            </span>
                          )}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-3 py-2.5">
                          <StatusBadge status={enrollment.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      {showPayment && (
                        <td className="px-3 py-2.5">
                          {enrollment.paymentStatus
                            ? <StatusBadge status={enrollment.paymentStatus} config={paymentConfig} size="sm" />
                            : "—"}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {showDeleted ? (
                            canDelete && onRestore && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRestore(enrollment.id)}
                                className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                aria-label={t("enrollments.restore")}
                                title={t("enrollments.restore")}
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            )
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const phone = student?.phone || "";
                                  openComposer("whatsapp", [{ id: enrollment.id, name: studentDisplayName, phone, email: student?.email }]);
                                }}
                                className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-success hover:text-success transition-colors"
                                title="WhatsApp Applicant"
                              >
                                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const phone = student?.phone || "";
                                  openComposer("sms", [{ id: enrollment.id, name: studentDisplayName, phone, email: student?.email }]);
                                }}
                                className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-info hover:text-info transition-colors"
                                title="Send SMS"
                              >
                                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onView(enrollment)}
                                className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                aria-label={t("enrollments.actions.view", { name: studentDisplayName })}
                                title={t("enrollments.actions.viewShort")}
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                              {canWrite && enrollment.status !== "cancelled" && enrollment.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onCancel(enrollment.id)}
                                  className="p-1.5 w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label={t("enrollments.actions.cancel", { name: studentDisplayName })}
                                  title={t("enrollments.actions.cancelShort")}
                                >
                                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              )}
                              {canDelete && onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDelete(enrollment.id)}
                                  className="p-1.5 w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label={t("common.delete")}
                                  title={t("common.delete")}
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
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
        total={filtered.length}
        limit={PAGE_SIZE}
        onPageChange={setPage}
        i18nNamespace="enrollments"
        variant="summary"
      />

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </section>
  );
}
