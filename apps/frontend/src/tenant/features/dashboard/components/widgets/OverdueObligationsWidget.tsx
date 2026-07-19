import React, { useState, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Bell, Scale, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMoney, formatDate } from "@mms/shared";
import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { UserAvatar } from "@/components/ui/UserAvatar";
import MessageComposer from "@/components/ui/MessageComposer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";

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

  const [expanded, setExpanded] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Set<number>>(new Set());
  const [messagingTarget, setMessagingTarget] = useState<{
    channel: 'sms' | 'whatsapp' | 'email';
    recipients: { id: string | number; name: string; phone: string; email?: string }[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return overdueStudents;
    const query = searchQuery.toLowerCase();
    return overdueStudents.filter(
      (os) =>
        os.name.toLowerCase().includes(query) ||
        os.obligationType.toLowerCase().includes(query)
    );
  }, [overdueStudents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage]);

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
    setMessagingTarget({
      channel: "sms",
      recipients: [{
        id: overdueStudent.id,
        name: overdueStudent.name,
        phone: student?.phone || "+92 300 1234567",
        email: student?.email || "",
      }],
    });
    setRemindedIds((prev) => {
      const next = new Set(prev);
      next.add(overdueStudent.id);
      return next;
    });
  };

  const handleRemindAll = () => {
    const recipients = filteredStudents.map((os) => {
      const student = students.find((s) => String(s.id) === String(os.id));
      return {
        id: os.id,
        name: os.name,
        phone: student?.phone || "+92 300 1234567",
        email: student?.email || "",
      };
    });
    setMessagingTarget({
      channel: "sms",
      recipients,
    });
    setRemindedIds((prev) => {
      const next = new Set(prev);
      filteredStudents.forEach((os) => next.add(os.id));
      return next;
    });
  };

  return (
    <section aria-labelledby="overdue-obligations-heading" className="relative overflow-hidden group/overdue rounded-2xl border border-destructive/30 bg-card/45 backdrop-blur-sm shadow-sm hover:-translate-y-0.5 hover:border-destructive/50 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive/50 transition-colors group-hover/overdue:bg-destructive" />
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-destructive/10 border-b border-destructive/30 pl-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center" aria-hidden="true">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 id="overdue-obligations-heading" className="text-sm font-bold text-destructive m-0">
              {title || t("dashboard.widgets.overdueObligations")}
            </h3>
            <p className="text-xs text-destructive m-0">
              {t("dashboard.widgets.studentsCount", { count: filteredStudents.length })} · {formatMoney(totalOverdue, overdueStudents[0]?.currency)} {t("finance.report.outstanding")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={handleRemindAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors h-auto"
          >
            <Bell className="w-3 h-3" aria-hidden="true" />
            {t("dashboard.widgets.remindAll")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label="Toggle overdue obligations list"
            className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/15 text-destructive hover:text-destructive transition-colors shadow-none"
          >
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </Button>
        </div>
      </header>

      {/* Table */}
      {expanded && (
        <>
          {/* Search bar */}
          <div className="px-5 py-2.5 border-b border-border bg-card/20 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("contacts.searchPlaceholder") || "Search student or obligation..."}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8 text-xs h-8.5 rounded-lg border-border/60 focus-visible:ring-1 focus-visible:ring-ring bg-background/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("hasanat.columns.redemption.student")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("nav.obligations")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("finance.columns.dueDate")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("finance.columns.amount")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("hasanat.columns.distribution.status")}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {t("hasanat.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      {t("finance.report.noInvoicesMatch")}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((overdueStudent) => {
                    const reminded = remindedIds.has(overdueStudent.id);
                    const urgencyStatus = overdueStudent.daysOverdue >= 30 ? "critical" : overdueStudent.daysOverdue >= 14 ? "high" : "moderate";
                    return (
                      <tr key={overdueStudent.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <UserAvatar id={overdueStudent.id} name={overdueStudent.name} className="w-7 h-7 rounded-full text-[10px] font-bold" />
                            <span className="font-medium text-foreground text-xs">{overdueStudent.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs text-foreground">{overdueStudent.obligationType}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div>
                            <p className="text-xs text-foreground m-0">{formatDate(overdueStudent.dueDate)}</p>
                            <p className="text-[10px] text-destructive font-semibold m-0">
                              {t("dashboard.widgets.daysOverdue", { count: overdueStudent.daysOverdue })}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-bold text-foreground">
                            {formatMoney(overdueStudent.amount, overdueStudent.currency)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge
                            status={urgencyStatus}
                            config={{
                              critical: {
                                label: t("dashboard.widgets.urgency.critical"),
                                cls: "bg-destructive/15 text-destructive border-destructive/30",
                              },
                              high: {
                                label: t("dashboard.widgets.urgency.high"),
                                cls: "bg-warning/15 text-warning border-warning/30",
                              },
                              moderate: {
                                label: t("dashboard.widgets.urgency.moderate"),
                                cls: "bg-warning/15 text-warning border-warning/30",
                              },
                            }}
                            size="sm"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleRemind(overdueStudent)}
                            disabled={reminded}
                            aria-label={reminded ? `Reminder sent to ${overdueStudent.name}` : `Send reminder to ${overdueStudent.name}`}
                            className={`flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors h-auto shadow-none ${
                              reminded
                                ? "bg-success/10 text-success border border-success/30 cursor-default hover:bg-success/10 hover:text-success"
                                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
                            }`}
                          >
                            <Bell className="w-2.5 h-2.5" aria-hidden="true" />
                            {reminded ? t("dashboard.widgets.sent") : t("dashboard.widgets.remind")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Footer */}
            <footer className="px-4 py-2.5 border-t border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-4">
                <p className="text-xs text-muted-foreground m-0">
                  {remindedIds.size > 0 && t("dashboard.widgets.remindersSent", { count: remindedIds.size })}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 w-7 rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[11px] font-bold text-muted-foreground select-none">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 w-7 rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <Link to={ROUTES.obligations} className="text-xs font-semibold text-primary hover:underline">
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
          onClose={() => setMessagingTarget(null)}
        />
      )}
    </section>
  );
}
