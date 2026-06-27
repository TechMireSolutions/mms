import React, { useState, useMemo, useEffect } from "react";
import { Search, Eye, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ENROLLMENT_STATUSES, STATUS_MAP, Enrollment, EnrollmentStatus } from '@/lib/data/enrollmentData';
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsByIds } from "@/hooks/useStudents";
import { ModuleColumnCustomizer } from "../ui/ModuleColumnCustomizer";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { useSessionsCollection } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "../ui/FormSelect";

const PAGE_SIZE = 12;

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (cols: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface EnrollmentListProps {
  enrollments: Enrollment[];
  canWrite: boolean;
  onView: (enrollment: Enrollment) => void;
  onCancel: (id: string) => void;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
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
    return enrollments.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (sessionFilter !== "all" && e.sessionId !== sessionFilter) return false;
      if (trimmed && !e.studentName.toLowerCase().includes(trimmed.toLowerCase()) &&
          !e.sessionName.toLowerCase().includes(trimmed.toLowerCase())) return false;
      return true;
    });
  }, [enrollments, search, statusFilter, sessionFilter]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { data: students = [] } = useStudentsByIds(paginated.map((enr) => enr.studentId));

  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showSession = isColumnVisible ? isColumnVisible("session") : true;
  const showClass = isColumnVisible ? isColumnVisible("class") : true;
  const showEnrolledDate = isColumnVisible ? isColumnVisible("enrolledDate") : true;
  const showFinalFee = isColumnVisible ? isColumnVisible("finalFee") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showPayment = isColumnVisible ? isColumnVisible("payment") : true;

  const statusInfo = (s: string): EnrollmentStatus => STATUS_MAP[s] || { id: s as EnrollmentStatus["id"], label: s, color: "bg-muted text-muted-foreground border-border" };

  const paymentColor = (s: string): string => {
    if (s === "paid")    return "text-success";
    if (s === "pending") return "text-warning";
    if (s === "overdue") return "text-destructive";
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
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" aria-hidden="true" />
          <Input
            type="search"
            value={search === " " ? "" : search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("enrollments.searchPlaceholder")}
            aria-label={t("enrollments.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl"
          />
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold" role="group" aria-label={t("enrollments.filter.status")}>
          <Button
            variant="ghost"
            onClick={() => { setStatus("all"); setPage(1); }}
            className={`px-3 py-2 transition-colors rounded-none h-auto ${statusFilter === "all" ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {t("enrollments.filter.all")}
          </Button>
          {ENROLLMENT_STATUSES.map((s) => (
            <Button
              key={s.id}
              variant="ghost"
              onClick={() => { setStatus(s.id); setPage(1); }}
              className={`px-3 py-2 transition-colors rounded-none h-auto ${statusFilter === s.id ? `${s.color} border-0 hover:bg-transparent` : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-session" className="sr-only">{t("enrollments.filter.session")}</label>
          <FormSelect
            id="filter-session"
            value={sessionFilter}
            onChange={(val) => { setSession(val); setPage(1); }}
            options={[
              { value: "all", label: t("enrollments.filter.allSessions") },
              ...sessions.map((s) => ({ value: s.id, label: s.name }))
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

      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card" role="status">
          <Search className="w-10 h-10 text-muted-foreground/30 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground">{t("enrollments.empty.title")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("enrollments.empty.description")}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/40 backdrop-blur-xl shadow-sm">
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
                 {paginated.map((enr) => {
                  const s = statusInfo(enr.status);
                  const student = students.find((st) => String(st.id) === String(enr.studentId));
                  return (
                    <motion.tr key={enr.id} layout className="hover:bg-muted/20 transition-colors">
                      {showStudent && (
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{enr.studentName}</span>
                            {student?.grNumber && (
                              <span className="text-[10px] text-primary font-bold">GR: {student.grNumber}</span>
                            )}
                          </div>
                        </td>
                      )}
                      {showSession && (
                        <td className="px-3 py-2.5 text-xs text-foreground max-w-[160px] truncate">{enr.sessionName}</td>
                      )}
                      {showClass && (
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{enr.className || "—"}</td>
                      )}
                      {showEnrolledDate && (
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{enr.enrolledDate}</td>
                      )}
                      {showFinalFee && (
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                          PKR {enr.finalFee?.toLocaleString()}
                          {enr.discountPct > 0 && (
                            <span className="ml-1 text-[10px] text-success font-normal" aria-label={`Discount percentage: ${enr.discountPct} percent`}>–{enr.discountPct}%</span>
                          )}
                        </td>
                      )}
                      {showStatus && (
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                      )}
                      {showPayment && (
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold capitalize ${paymentColor(enr.paymentStatus)}`}>
                            {enr.paymentStatus || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(enr)}
                            className="p-1.5 w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            aria-label={t("enrollments.actions.view", { name: enr.studentName })}
                            title={t("enrollments.actions.viewShort")}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          {canWrite && enr.status !== "cancelled" && enr.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onCancel(enr.id)}
                              className="p-1.5 w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={t("enrollments.actions.cancel", { name: enr.studentName })}
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
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground" role="navigation" aria-label={t("enrollments.pagination.label")}>
        <span>{t("enrollments.pagination.summary", { count: filtered.length, page, totalPages })}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label={t("enrollments.pagination.previous")}
            className="p-1.5 w-8 h-8 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label={t("enrollments.pagination.next")}
            className="p-1.5 w-8 h-8 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
