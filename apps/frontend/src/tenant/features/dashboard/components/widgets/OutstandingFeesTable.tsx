import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Phone, Send, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useFinanceInvoicesCollection } from "@/tenant/features/finance/hooks/useFinanceApi";
import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import MessageComposer from "@/components/ui/MessageComposer";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";

/**
 * OutstandingFeesTable Component
 *
 * Displays a list of recent overdue payments and outstanding fees.
 * Includes quick actions for sending reminders or calling the contacts.
 *
 * @returns {React.ReactElement} The outstanding fees table widget.
 */
export default function OutstandingFeesTable({ title }: { title?: string }) {
  const { t } = useTranslation();
  const invoices = useFinanceInvoicesCollection();
  const { formatCurrency } = useFinanceCurrency();
  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled"),
    [invoices],
  );
  const studentIds = useMemo(
    () => uniqueRegistryIds(unpaidInvoices.map((invoice) => invoice.studentId)),
    [unpaidInvoices],
  );
  const { data: students = [] } = useStudentsByIds(studentIds);

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

  const mappedRows = useMemo(() => {
    return unpaidInvoices.map((invoice) => {
      const student = students.find((studentOption) => String(studentOption.id) === String(invoice.studentId));
      const contact = student?.phone || "+92 300 1234567";
      const amount = invoice.status === "partial" ? (invoice.finalAmt - (invoice.paidAmt || 0)) : invoice.finalAmt;

      const due = new Date(invoice.dueDate);
      const now = new Date();
      const diffMonths = Math.max(1, (now.getFullYear() - due.getFullYear()) * 12 + now.getMonth() - due.getMonth());

      return {
        id: invoice.id,
        studentId: invoice.studentId,
        student: invoice.studentName,
        class: invoice.class || "",
        amount,
        months: diffMonths,
        contact,
        email: student?.email || "",
      };
    });
  }, [unpaidInvoices, students]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return mappedRows;
    const query = searchQuery.toLowerCase();
    return mappedRows.filter(
      (row) =>
        row.student.toLowerCase().includes(query) ||
        row.class.toLowerCase().includes(query)
    );
  }, [mappedRows, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRows.length / pageSize));
  }, [filteredRows]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage]);

  const totalUnpaid = unpaidInvoices.length;

  return (
    <section aria-labelledby="outstanding-fees-heading" className="relative overflow-hidden group/unpaid bg-card/45 backdrop-blur-sm rounded-2xl border border-border shadow-sm hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive/45 transition-colors group-hover/unpaid:bg-destructive" />
      <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between pl-6.5">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
          <h3 id="outstanding-fees-heading" className="text-sm font-semibold text-foreground m-0">
            {title || t("dashboard.widgets.outstandingPayments")}
          </h3>
          <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full" aria-label={t("dashboard.widgets.studentsCount", { count: totalUnpaid })}>
            {t("dashboard.widgets.studentsCount", { count: totalUnpaid })}
          </span>
        </div>
        <Button
          variant="link"
          className="text-[12px] font-semibold h-auto p-0"
          onClick={() => {
            if (filteredRows.length > 0) {
              setMessagingTarget({
                channel: "sms",
                recipients: filteredRows.map((row) => ({
                  id: row.studentId,
                  name: row.student,
                  phone: row.contact,
                  email: row.email,
                })),
              });
            }
          }}
        >
          {t("dashboard.widgets.sendAllReminders")}
        </Button>
      </header>

      <div className="p-3 px-6 border-b border-border/30 flex items-center gap-2 bg-muted/10">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("contacts.searchPlaceholder") || "Search student or class..."}
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
              <th scope="col" className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {t("hasanat.columns.redemption.student")}
              </th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                {t("sessions.report.colClass")}
              </th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                {t("finance.columns.amount")}
              </th>
              <th scope="col" className="text-left px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                {t("finance.metrics.overdue")}
              </th>
              <th scope="col" className="px-3 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                {t("hasanat.columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                  {t("finance.report.noInvoicesMatch")}
                </td>
              </tr>
            ) : (
              paginatedRows.map((outstandingFee, index) => (
                <motion.tr
                  key={outstandingFee.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar id={outstandingFee.studentId} name={outstandingFee.student} className="w-7 h-7 rounded-full text-[10px] font-bold" />
                      <span className="text-[13px] font-medium text-foreground">{outstandingFee.student}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground hidden sm:table-cell">{outstandingFee.class}</td>
                  <td className="px-3 py-3">
                    <span className="text-[13px] font-bold text-destructive">{formatCurrency(outstandingFee.amount)}</span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <StatusBadge
                      status={outstandingFee.months >= 3 ? "overdue" : "warning"}
                      config={{
                        overdue: {
                          label: t("dashboard.widgets.overdueStatus", { count: outstandingFee.months }),
                          cls: "bg-destructive/10 text-destructive border-destructive/20",
                        },
                        warning: {
                          label: t("dashboard.widgets.overdueStatus", { count: outstandingFee.months }),
                          cls: "bg-warning/10 text-warning border-warning/20",
                        },
                      }}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        aria-label={`${t("contacts.detail.call")} ${outstandingFee.student}`}
                        title={t("contacts.detail.call")}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-none"
                        onClick={() => {
                          setMessagingTarget({
                            channel: "whatsapp",
                            recipients: [{
                              id: outstandingFee.studentId,
                              name: outstandingFee.student,
                              phone: outstandingFee.contact,
                              email: outstandingFee.email,
                            }],
                          });
                        }}
                      >
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`${t("dashboard.widgets.sendReminder")} ${outstandingFee.student}`}
                        title={t("dashboard.widgets.sendReminder")}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-none"
                        onClick={() => {
                          setMessagingTarget({
                            channel: "sms",
                            recipients: [{
                              id: outstandingFee.studentId,
                              name: outstandingFee.student,
                              phone: outstandingFee.contact,
                              email: outstandingFee.email,
                            }],
                          });
                        }}
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="px-5 py-3 border-t border-border flex items-center justify-between">
        <Button variant="link" className="text-xs font-medium h-auto p-0">
          {t("dashboard.widgets.viewAllOutstanding")}
        </Button>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[11px] font-medium text-muted-foreground select-none">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-md"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </footer>

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
