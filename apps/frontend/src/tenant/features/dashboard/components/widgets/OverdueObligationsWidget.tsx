import React, { useState, useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { AlertTriangle, ChevronDown, ChevronUp, Bell, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMoney, formatDate } from "@mms/shared";
import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { UserAvatar } from "@/components/ui/UserAvatar";
import MessageComposer from "@/components/ui/MessageComposer";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export interface OverdueStudent {
  id: number;
  name: string;
  obligationType: string;
  dueDate: string;
  amount: number;
  currency: string;
  daysOverdue: number;
}


/**
 * OverdueObligationsWidget Component
 *
 * Displays a list of overdue obligations requiring follow-up, along with a
 * quick action to send out reminder notifications.
 *
 * @returns {React.ReactElement} The overdue obligations widget.
 */
export default function OverdueObligationsWidget({ title }: { title?: string }) {
  const { t } = useTranslation();
  const overdueStudents = useLiveCollection<OverdueStudent>("overdue_obligations", [], { serverSync: true });
  const { activeCurrency } = useFinanceCurrency();

  const [expanded, setExpanded] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Set<number>>(new Set());
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const {
    searchQuery,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems: paginatedStudents,
    filteredItems: filteredStudents,
    totalPages,
  } = useLocalPagination({
    items: overdueStudents,
    pageSize: 5,
    searchFields: (os) => [os.name, os.obligationType],
  });

  const studentIds = useMemo(
    () => uniqueRegistryIds(overdueStudents.map((os) => os.id)),
    [overdueStudents]
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const totalOverdue = useMemo(
    () => overdueStudents.reduce((sum, overdueStudent) => sum + overdueStudent.amount, 0),
    [overdueStudents]
  );

  const handleRemind = (overdueStudent: OverdueStudent) => {
    const student = students.find((s) => String(s.id) === String(overdueStudent.id));
    const phone = student?.phone || "";
    if (!phone) return;
    openComposer("sms", [{
      id: overdueStudent.id,
      name: overdueStudent.name,
      phone,
      email: student?.email || "",
    }]);
    setRemindedIds((prev) => {
      const next = new Set(prev);
      next.add(overdueStudent.id);
      return next;
    });
  };

  const handleRemindAll = () => {
    const recipients = filteredStudents
      .map((os) => {
        const student = students.find((s) => String(s.id) === String(os.id));
        return {
          id: os.id,
          name: os.name,
          phone: student?.phone || "",
          email: student?.email || "",
        };
      })
      .filter((r) => Boolean(r.phone));

    if (recipients.length === 0) return;

    openComposer("sms", recipients);
    setRemindedIds((prev) => {
      const next = new Set(prev);
      recipients.forEach((r) => next.add(Number(r.id)));
      return next;
    });
  };

  return (
    <WidgetCard ariaLabelledby="overdue-obligations-heading" accentColor="destructive">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-destructive/[0.06] border-b border-destructive/25 ps-6.5 select-none">

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center" aria-hidden="true">
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          </div>
          <div>
            <h3 id="overdue-obligations-heading" className="text-sm font-bold text-destructive m-0">
              {title || t("dashboard.widgets.overdueObligations")}
            </h3>
            <p className="text-[11px] text-destructive/80 font-semibold mt-0.5 m-0 uppercase tracking-wider tabular-nums">
              {t("dashboard.widgets.studentsCount", { count: filteredStudents.length })} · {formatMoney(totalOverdue, overdueStudents[0]?.currency || activeCurrency.code)} {t("finance.report.outstanding")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleRemindAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors h-auto cursor-pointer"
          >
            <Bell className="w-3 h-3" aria-hidden="true" />
            {t("dashboard.widgets.remindAll")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label="Toggle overdue obligations list"
            className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/15 text-destructive hover:text-destructive transition-colors shadow-none cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </Button>
        </div>
      </header>

      {/* Table */}
      {expanded && (
        <>
          {/* Search bar */}
          <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
            <SearchBar
              placeholder={t("contacts.searchPlaceholder") || "Search student or obligation..."}
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border/45 bg-muted/30 hover:bg-transparent">
                  <TableHead scope="col" className="px-5 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.redemption.student")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("nav.obligations")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.dueDate")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.amount")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.distribution.status")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground select-none">
                      {t("finance.report.noInvoicesMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((overdueStudent) => {
                    const reminded = remindedIds.has(overdueStudent.id);
                    const urgencyStatus = overdueStudent.daysOverdue >= 30 ? "critical" : overdueStudent.daysOverdue >= 14 ? "high" : "moderate";
                    return (
                      <TableRow key={overdueStudent.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar id={overdueStudent.id} name={overdueStudent.name} className="w-7 h-7 rounded-full text-[10px] font-bold" />
                            <span className="font-semibold text-foreground text-xs">{overdueStudent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs text-foreground font-medium">{overdueStudent.obligationType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div>
                            <p className="text-xs text-foreground font-semibold m-0 tabular-nums">{formatDate(overdueStudent.dueDate)}</p>
                            <p className="text-[10px] text-destructive font-bold mt-0.5 m-0 uppercase tracking-wide tabular-nums">
                              {t("dashboard.widgets.daysOverdue", { count: overdueStudent.daysOverdue })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            {formatMoney(overdueStudent.amount, overdueStudent.currency || activeCurrency.code)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-center">
                          <StatusBadge
                            status={urgencyStatus}
                            config={{
                              critical: {
                                label: t("dashboard.widgets.urgency.critical"),
                                cls: SEMANTIC_BADGE.destructive,
                              },
                              high: {
                                label: t("dashboard.widgets.urgency.high"),
                                cls: SEMANTIC_BADGE.warning,
                              },
                              moderate: {
                                label: t("dashboard.widgets.urgency.moderate"),
                                cls: SEMANTIC_BADGE.warning,
                              },
                            }}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 text-center">
                          {(() => {
                            const student = students.find((s) => String(s.id) === String(overdueStudent.id));
                            const hasPhone = Boolean(student?.phone);
                            return (
                              <Button
                                variant="ghost"
                                onClick={() => handleRemind(overdueStudent)}
                                disabled={reminded || !hasPhone}
                                aria-label={reminded ? `Reminder sent to ${overdueStudent.name}` : `Send reminder to ${overdueStudent.name}`}
                                className={`flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors h-auto shadow-none cursor-pointer ${
                                  reminded
                                    ? "bg-success/10 text-success border border-success/35 cursor-default hover:bg-success/10 hover:text-success"
                                    : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
                                }`}
                              >
                                <Bell className="w-2.5 h-2.5" aria-hidden="true" />
                                {reminded ? t("dashboard.widgets.sent") : t("dashboard.widgets.remind")}
                              </Button>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Footer */}
            <footer className="px-5 py-3.5 border-t border-border/45 flex items-center justify-between bg-muted/10 select-none">
              <div className="flex items-center gap-4">
                <p className="text-[11px] font-bold text-success/90 uppercase tracking-wider m-0">
                  {remindedIds.size > 0 && t("dashboard.widgets.remindersSent", { count: remindedIds.size })}
                </p>
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
              <Link to={ROUTES.obligations} className="text-xs font-bold text-primary hover:underline">
                {t("dashboard.widgets.viewObligations")}
              </Link>
            </footer>
          </div>
        </>
      )}

      {messagingTarget && (
        <MessageComposer
          channel={messagingTarget.channel}
          recipients={messagingTarget.recipients}
          onClose={closeComposer}
        />
      )}
    </WidgetCard>
  );
}
