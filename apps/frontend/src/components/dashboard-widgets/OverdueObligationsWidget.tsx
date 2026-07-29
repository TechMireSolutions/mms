import React, { useState, useMemo } from "react";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { AlertTriangle, ChevronDown, ChevronUp, Bell, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { formatMoney, formatDate, formatDateToIso, getOutstandingAmountForInvoice } from "@mms/shared";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { UserAvatar } from "@/components/ui/UserAvatar";
import MessageComposer from "@/components/ui/MessageComposer";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export interface OverdueStudent {
  id: string;
  name: string;
  obligationType: string;
  dueDate: string;
  amount: number;
  currency: string;
  daysOverdue: number;
}

function daysBetweenUtc(dueDate: string, todayIso: string): number {
  const due = Date.parse(`${dueDate.slice(0, 10)}T00:00:00Z`);
  const today = Date.parse(`${todayIso}T00:00:00Z`);
  if (Number.isNaN(due) || Number.isNaN(today)) return 0;
  return Math.max(0, Math.floor((today - due) / 86_400_000));
}

function OverdueUrgencyBadge({
  daysOverdue,
  t,
}: {
  daysOverdue: number;
  t: TranslationFunction;
}) {
  const urgencyStatus = daysOverdue >= 30 ? "critical" : daysOverdue >= 14 ? "high" : "moderate";
  return (
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
  );
}

function OverdueRemindButton({
  overdueStudent,
  reminded,
  hasPhone,
  onRemind,
  t,
  className,
}: {
  overdueStudent: OverdueStudent;
  reminded: boolean;
  hasPhone: boolean;
  onRemind: (overdueStudent: OverdueStudent) => void;
  t: TranslationFunction;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => onRemind(overdueStudent)}
      disabled={reminded || !hasPhone}
      aria-label={reminded ? t("dashboard.widgets.reminderSentTo", { name: overdueStudent.name }) : t("dashboard.widgets.sendReminderTo", { name: overdueStudent.name })}
      className={
        className
        ?? `flex items-center gap-1 mx-auto px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-11 shadow-none cursor-pointer ${
          reminded
            ? "bg-success/10 text-success border border-success/35 cursor-default hover:bg-success/10 hover:text-success"
            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
        }`
      }
    >
      <Bell className="w-2.5 h-2.5" aria-hidden="true" />
      {reminded ? t("dashboard.widgets.sent") : t("dashboard.widgets.remind")}
    </Button>
  );
}

/**
 * Overdue fee obligations follow-up widget — derived from finance invoices (Query).
 */
export default function OverdueObligationsWidget({ title }: { title?: string }) {
  const { t } = useTranslation();
  const invoices = useFinanceInvoicesCollection();
  const { activeCurrency, formatCurrency } = useFinanceCurrency();

  const overdueStudents = useMemo(() => {
    const todayIso = formatDateToIso(new Date());
    const rows: OverdueStudent[] = [];

    invoices.forEach((invoice) => {
      if (invoice.status === "paid" || invoice.status === "cancelled") return;
      if (!invoice.dueDate || invoice.dueDate.slice(0, 10) >= todayIso) return;
      const amount = getOutstandingAmountForInvoice(invoice);
      if (amount <= 0) return;

      rows.push({
        id: String(invoice.studentId),
        name: invoice.studentName,
        obligationType: invoice.class || t("finance.metrics.overdue"),
        dueDate: invoice.dueDate,
        amount,
        currency: activeCurrency.code,
        daysOverdue: daysBetweenUtc(invoice.dueDate, todayIso),
      });
    });

    return rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices, activeCurrency.code, t]);

  const [expanded, setExpanded] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

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
    searchFields: (overdueStudent) => [overdueStudent.name, overdueStudent.obligationType],
  });

  const studentIds = useMemo(
    () => uniqueRegistryIds(overdueStudents.map((overdueStudent) => overdueStudent.id)),
    [overdueStudents],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

  const totalOverdue = useMemo(
    () => overdueStudents.reduce((sum, overdueStudent) => sum + overdueStudent.amount, 0),
    [overdueStudents],
  );

  const handleRemind = (overdueStudent: OverdueStudent) => {
    const student = students.find((entry) => String(entry.id) === String(overdueStudent.id));
    const phone = student?.phone || "";
    if (!phone) return;
    openComposer("sms", [{
      id: overdueStudent.id,
      name: overdueStudent.name,
      phone,
      email: student?.email || "",
      amount: overdueStudent.amount,
      dueDate: overdueStudent.dueDate,
    }]);
    setRemindedIds((prev) => {
      const next = new Set(prev);
      next.add(overdueStudent.id);
      return next;
    });
  };

  const handleRemindAll = () => {
    const recipients = filteredStudents
      .map((overdueStudent) => {
        const student = students.find((entry) => String(entry.id) === String(overdueStudent.id));
        return {
          id: overdueStudent.id,
          name: overdueStudent.name,
          phone: student?.phone || "",
          email: student?.email || "",
          amount: overdueStudent.amount,
          dueDate: overdueStudent.dueDate,
        };
      })
      .filter((recipient) => Boolean(recipient.phone));

    if (recipients.length === 0) return;

    openComposer("sms", recipients);
    setRemindedIds((prev) => {
      const next = new Set(prev);
      recipients.forEach((recipient) => next.add(String(recipient.id)));
      return next;
    });
  };

  return (
    <WidgetCard ariaLabelledby="overdue-obligations-heading" accentColor="destructive">
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 ps-6.5 bg-destructive/[0.06] border-b border-destructive/25 select-none">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15" aria-hidden="true">
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 id="overdue-obligations-heading" className="truncate text-sm font-bold text-destructive m-0">
              {title || t("dashboard.widgets.overdueObligations")}
            </h3>
            <p className="text-xs text-destructive/80 font-semibold mt-0.5 m-0 uppercase tracking-wider tabular-nums">
              {t("dashboard.widgets.studentsCount", { count: filteredStudents.length })} · {formatCurrency(totalOverdue)} {t("finance.report.outstanding")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canWriteMessaging && (
            <Button
              variant="destructive"
              onClick={handleRemindAll}
              className="flex items-center gap-1.5 min-h-11 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              <Bell className="w-3 h-3" aria-hidden="true" />
              {t("dashboard.widgets.remindAll")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={t("dashboard.widgets.toggleOverdueList")}
            className="rounded-lg hover:bg-destructive/15 text-destructive hover:text-destructive transition-colors shadow-none cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
          </Button>
        </div>
      </header>

      {expanded && (
        <>
          <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
            <SearchBar
              placeholder={t("contacts.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 max-w-sm"
            />
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {paginatedStudents.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground select-none">
                {t("finance.report.noInvoicesMatch")}
              </p>
            ) : (
              paginatedStudents.map((overdueStudent, index) => {
                const reminded = remindedIds.has(overdueStudent.id);
                const student = students.find((entry) => String(entry.id) === String(overdueStudent.id));
                const hasPhone = Boolean(student?.phone);
                return (
                  <motion.article
                    key={`${overdueStudent.id}-${overdueStudent.dueDate}-${overdueStudent.amount}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className="space-y-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar id={overdueStudent.id} name={overdueStudent.name} className="w-7 h-7 rounded-full text-xs font-bold shrink-0" />
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-foreground m-0">{overdueStudent.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Scale className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                            <p className="truncate text-xs text-muted-foreground m-0">{overdueStudent.obligationType}</p>
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-foreground tabular-nums">
                        {formatMoney(overdueStudent.amount, overdueStudent.currency || activeCurrency.code)}
                      </span>
                    </div>
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.dueDate")}</dt>
                        <dd className="text-xs text-foreground font-semibold m-0 tabular-nums">{formatDate(overdueStudent.dueDate)}</dd>
                        <dd className="text-xs text-destructive font-bold mt-0.5 m-0 uppercase tracking-wide tabular-nums">
                          {t("dashboard.widgets.daysOverdue", { count: overdueStudent.daysOverdue })}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                      <OverdueUrgencyBadge daysOverdue={overdueStudent.daysOverdue} t={t} />
                      {canWriteMessaging && (
                        <OverdueRemindButton
                          overdueStudent={overdueStudent}
                          reminded={reminded}
                          hasPhone={hasPhone}
                          onRemind={handleRemind}
                          t={t}
                          className={`flex items-center gap-1 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors min-h-11 shadow-none cursor-pointer ${
                            reminded
                              ? "bg-success/10 text-success border border-success/35 cursor-default hover:bg-success/10 hover:text-success"
                              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
                          }`}
                        />
                      )}
                    </div>
                  </motion.article>
                );
              })
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border/45 bg-muted/30 hover:bg-transparent">
                  <TableHead scope="col" className="px-5 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.redemption.student")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("nav.obligations")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.dueDate")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-end text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.amount")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.distribution.status")}
                  </TableHead>
                  {canWriteMessaging && (
                    <TableHead scope="col" className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                      {t("hasanat.columns.actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWriteMessaging ? 6 : 5} className="text-center py-8 text-xs text-muted-foreground select-none">
                      {t("finance.report.noInvoicesMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((overdueStudent) => {
                    const reminded = remindedIds.has(overdueStudent.id);
                    const student = students.find((entry) => String(entry.id) === String(overdueStudent.id));
                    const hasPhone = Boolean(student?.phone);
                    return (
                      <TableRow key={`${overdueStudent.id}-${overdueStudent.dueDate}-${overdueStudent.amount}`} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar id={overdueStudent.id} name={overdueStudent.name} className="w-7 h-7 rounded-full text-xs font-bold" />
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
                            <p className="text-xs text-destructive font-bold mt-0.5 m-0 uppercase tracking-wide tabular-nums">
                              {t("dashboard.widgets.daysOverdue", { count: overdueStudent.daysOverdue })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-end">
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            {formatMoney(overdueStudent.amount, overdueStudent.currency || activeCurrency.code)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-center">
                          <OverdueUrgencyBadge daysOverdue={overdueStudent.daysOverdue} t={t} />
                        </TableCell>
                        {canWriteMessaging && (
                          <TableCell className="px-3 py-3 text-center">
                            <OverdueRemindButton
                              overdueStudent={overdueStudent}
                              reminded={reminded}
                              hasPhone={hasPhone}
                              onRemind={handleRemind}
                              t={t}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <footer className="px-5 py-3.5 border-t border-border/45 flex items-center justify-between bg-muted/10 select-none">
            <div className="flex items-center gap-4">
              <p className="text-xs font-bold text-success/90 uppercase tracking-wider m-0">
                {remindedIds.size > 0 && t("dashboard.widgets.remindersSent", { count: remindedIds.size })}
              </p>
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            <Link to={ROUTES.finance} className="inline-flex min-h-11 items-center text-xs font-bold text-primary hover:underline">
              {t("dashboard.widgets.viewAllOutstanding")}
            </Link>
          </footer>
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
