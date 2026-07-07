import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Search, Eye, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SearchBar } from "@/components/ui/SearchBar";
import { ListPagination } from "@/components/ui/ListPagination";
import { ENROLLMENT_STATUSES, STATUS_MAP, Enrollment, EnrollmentStatus } from '@/lib/data/enrollmentData';
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";

const PAGE_SIZE = 12;



interface EnrollmentListProps {
  enrollments: Enrollment[];
  canWrite: boolean;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

/**
 * Renders a paginated, filterable table list of enrollment records.
 */
export function EnrollmentList({
  enrollments,
  canWrite,
  onView,
  onCancel,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: EnrollmentListProps): React.ReactElement {
  const { t } = useTranslation();
  const [search, setSearch]         = useState<string>(" ");
  const [statusFilter, setStatus]   = useState<string>("all");
  const [sessionFilter, setSession] = useState<string>("all");
  const [page, setPage]             = useState<number>(1);

  const sessions = useSessionsCollection();

  const filtered = useMemo<Enrollment[]>(() => {
    const trimmed = search.trim();
    return enrollments.filter((enrollment) => {
      if (statusFilter !== "all" && enrollment.status !== statusFilter) return false;
      if (sessionFilter !== "all" && enrollment.sessionId !== sessionFilter) return false;
      if (trimmed && !enrollment.studentName.toLowerCase().includes(trimmed.toLowerCase()) &&
          !enrollment.sessionName.toLowerCase().includes(trimmed.toLowerCase())) return false;
      return true;
    });
  }, [enrollments, search, statusFilter, sessionFilter]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const paginatedEnrollments = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: students = [] } = useStudentsByIds(paginatedEnrollments.map((enrollment) => enrollment.studentId));

  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showSession = isColumnVisible ? isColumnVisible("session") : true;
  const showClass = isColumnVisible ? isColumnVisible("class") : true;
  const showEnrolledDate = isColumnVisible ? isColumnVisible("enrolledDate") : true;
  const showFinalFee = isColumnVisible ? isColumnVisible("finalFee") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showPayment = isColumnVisible ? isColumnVisible("payment") : true;

  const statusInfo = (status: string): EnrollmentStatus => STATUS_MAP[status] || { id: status as EnrollmentStatus["id"], label: status, color: "bg-muted text-muted-foreground border-border" };

  const paymentColor = (status: string): string => {
    if (status === "paid")    return "text-success";
    if (status === "pending") return "text-warning";
    if (status === "overdue") return "text-destructive";
    return "text-muted-foreground";
  };

  // set search state safely
  useEffect(() => {
    if (search === " ") {
      setSearch("");
    }
  }, [search]);

  return (
    <section className="space-y-4" aria-label="Enrollment list interface">
      <div className="flex flex-wrap gap-2 items-center">
        <SearchBar
          value={search === " " ? "" : search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          placeholder={t("enrollments.searchPlaceholder")}
          className="flex-1 min-w-[180px]"
        />

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
              className={`px-3 py-2 transition-colors rounded-none h-auto ${statusFilter === status.id ? `${status.color} border-0 hover:bg-transparent` : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {status.label}
            </Button>
          ))}
        </div>

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

        {columnCustomizer && (
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
          <p className="text-sm font-semibold text-foreground">{t("enrollments.empty.title")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("enrollments.empty.description")}</p>
        </div>
      ) : (
        <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b border-border/50">
                <tr>
                  {showStudent && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.student")}
                    </th>
                  )}
                  {showSession && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.session")}
                    </th>
                  )}
                  {showClass && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.class")}
                    </th>
                  )}
                  {showEnrolledDate && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.enrolledDate")}
                    </th>
                  )}
                  {showFinalFee && (
                    <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.finalFee")}
                    </th>
                  )}
                  {showStatus && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.status")}
                    </th>
                  )}
                  {showPayment && (
                    <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">
                      {t("enrollments.columns.payment")}
                    </th>
                  )}
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">
                    {t("enrollments.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {paginatedEnrollments.map((enrollment) => {
                  const enrollmentStatus = statusInfo(enrollment.status);
                  const student = students.find((candidate) => String(candidate.id) === String(enrollment.studentId));
                  return (
                    <motion.tr key={enrollment.id} layout className="hover:bg-muted/20 transition-colors">
                      {showStudent && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{enrollment.studentName}</span>
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
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{enrollment.enrolledDate}</td>
                      )}
                      {showFinalFee && (
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                          PKR {enrollment.finalFee?.toLocaleString()}
                          {enrollment.discountPct > 0 && (
                            <span className="ml-1 text-[10px] text-success font-normal" aria-label={`Discount percentage: ${enrollment.discountPct} percent`}>–{enrollment.discountPct}%</span>
                          )}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${enrollmentStatus.color}`}>
                            {enrollmentStatus.label}
                          </span>
                        </td>
                      )}
                      {showPayment && (
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold capitalize ${paymentColor(enrollment.paymentStatus)}`}>
                            {enrollment.paymentStatus || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(enrollment)}
                            className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            aria-label={t("enrollments.actions.view", { name: enrollment.studentName })}
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
                              aria-label={t("enrollments.actions.cancel", { name: enrollment.studentName })}
                              title={t("enrollments.actions.cancelShort")}
                            >
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
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
    </section>
  );
}
