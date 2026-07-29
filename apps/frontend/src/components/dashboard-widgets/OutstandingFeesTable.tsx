import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { motion } from "framer-motion";
import { getOutstandingAmountForInvoice } from "@mms/shared";
import { AlertCircle, MessageCircle, Send } from "lucide-react";
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import MessageComposer from "@/components/ui/MessageComposer";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SearchBar } from "@/components/ui/SearchBar";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { ROUTES } from "@/lib/config/routes";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const MotionTableRow = motion.create(TableRow);

interface OutstandingFeeRow {
  id: string;
  studentId: string;
  student: string;
  class: string;
  amount: number;
  months: number;
  contact: string;
  email: string;
  dueDate: string;
}

type OpenComposer = ReturnType<typeof useMessageComposerState>["openComposer"];

function OutstandingFeeMessagingActions({
  row,
  openComposer,
  t,
  className,
}: {
  row: Pick<OutstandingFeeRow, "studentId" | "student" | "contact" | "email" | "amount" | "dueDate">;
  openComposer: OpenComposer;
  t: TranslationFunction;
  className?: string;
}) {
  const recipient = [{
    id: row.studentId,
    name: row.student,
    phone: row.contact,
    email: row.email,
    amount: row.amount,
    dueDate: row.dueDate,
  }];

  return (
    <div className={className ?? "flex items-center justify-end gap-1.5"}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${t("contacts.whatsapp.open")} ${row.student}`}
        title={t("contacts.whatsapp.open")}
        className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-none cursor-pointer"
        disabled={!row.contact}
        onClick={() => openComposer("whatsapp", recipient)}
      >
        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${t("dashboard.widgets.sendReminder")} ${row.student}`}
        title={t("dashboard.widgets.sendReminder")}
        className="rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shadow-none cursor-pointer"
        disabled={!row.contact}
        onClick={() => openComposer("sms", recipient)}
      >
        <Send className="w-3.5 h-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function OutstandingFeeOverdueBadge({
  months,
  t,
}: {
  months: number;
  t: TranslationFunction;
}) {
  return (
    <StatusBadge
      status={months >= 3 ? "overdue" : "warning"}
      config={{
        overdue: {
          label: t("dashboard.widgets.overdueStatus", { count: months }),
          cls: SEMANTIC_BADGE.destructive,
        },
        warning: {
          label: t("dashboard.widgets.overdueStatus", { count: months }),
          cls: SEMANTIC_BADGE.warning,
        },
      }}
      size="sm"
    />
  );
}

/**
 * Outstanding fees table widget with optional messaging CTAs.
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

  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const mappedRows = useMemo(() => {
    return unpaidInvoices.map((invoice) => {
      const student = students.find((studentOption) => String(studentOption.id) === String(invoice.studentId));
      const contact = student?.phone || "";
      const amount = getOutstandingAmountForInvoice(invoice);

      const due = new Date(invoice.dueDate);
      const now = new Date();
      const diffMonths = Math.max(1, (now.getFullYear() - due.getFullYear()) * 12 + (now.getMonth() - due.getMonth()));

      return {
        id: invoice.id,
        studentId: invoice.studentId,
        student: invoice.studentName,
        class: invoice.class || "",
        amount,
        months: diffMonths,
        contact,
        email: student?.email || "",
        dueDate: invoice.dueDate,
      };
    });
  }, [unpaidInvoices, students]);

  const {
    searchQuery,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems: paginatedRows,
    filteredItems: filteredRows,
    totalPages,
  } = useLocalPagination({
    items: mappedRows,
    pageSize: 5,
    searchFields: (row) => [row.student, row.class],
  });

  const totalUnpaid = unpaidInvoices.length;

  return (
    <WidgetCard ariaLabelledby="outstanding-fees-heading" accentColor="destructive">
      <header className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 ps-6.5 border-b border-border/45 select-none">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive" aria-hidden="true" />
          <h3 id="outstanding-fees-heading" className="min-w-0 truncate text-sm font-bold text-foreground m-0">
            {title || t("dashboard.widgets.outstandingPayments")}
          </h3>
          <span
            className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full uppercase tracking-wider"
            aria-label={t("dashboard.widgets.studentsCount", { count: totalUnpaid })}
          >
            {t("dashboard.widgets.studentsCount", { count: totalUnpaid })}
          </span>
        </div>
        {canWriteMessaging && (
          <Button
            variant="link"
            className="min-h-11 h-auto shrink-0 p-0 text-sm font-bold"
            onClick={() => {
              if (filteredRows.length === 0) return;
              const recipients = filteredRows
                .map((row) => ({
                  id: row.studentId,
                  name: row.student,
                  phone: row.contact,
                  email: row.email,
                  amount: row.amount,
                  dueDate: row.dueDate,
                }))
                .filter((recipient) => Boolean(recipient.phone));
              if (recipients.length > 0) {
                openComposer("sms", recipients);
              }
            }}
          >
            {t("dashboard.widgets.sendAllReminders")}
          </Button>
        )}
      </header>

      <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
        <SearchBar
          placeholder={t("contacts.searchPlaceholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1"
        />
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {paginatedRows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground select-none">
            {t("finance.report.noInvoicesMatch")}
          </p>
        ) : (
          paginatedRows.map((outstandingFee, index) => (
            <motion.article
              key={outstandingFee.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar id={outstandingFee.studentId} name={outstandingFee.student} className="w-7 h-7 rounded-full text-xs font-bold shrink-0" />
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-foreground m-0">{outstandingFee.student}</h4>
                    {outstandingFee.class ? (
                      <p className="truncate text-xs text-muted-foreground m-0">{outstandingFee.class}</p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-destructive tabular-nums">{formatCurrency(outstandingFee.amount)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                <OutstandingFeeOverdueBadge months={outstandingFee.months} t={t} />
                {canWriteMessaging && (
                  <OutstandingFeeMessagingActions row={outstandingFee} openComposer={openComposer} t={t} />
                )}
              </div>
            </motion.article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-border/45 bg-muted/30 hover:bg-transparent">
              <TableHead scope="col" className="text-start px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                {t("hasanat.columns.redemption.student")}
              </TableHead>
              <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell h-auto select-none">
                {t("sessions.report.colClass")}
              </TableHead>
              <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                {t("finance.columns.amount")}
              </TableHead>
              <TableHead scope="col" className="text-start px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell h-auto select-none">
                {t("finance.metrics.overdue")}
              </TableHead>
              {canWriteMessaging && (
                <TableHead scope="col" className="px-3 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-end h-auto select-none">
                  {t("hasanat.columns.actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWriteMessaging ? 5 : 4} className="text-center py-8 text-xs text-muted-foreground select-none">
                  {t("finance.report.noInvoicesMatch")}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((outstandingFee, index) => (
                <MotionTableRow
                  key={outstandingFee.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar id={outstandingFee.studentId} name={outstandingFee.student} className="w-7 h-7 rounded-full text-xs font-bold" />
                      <span className="text-sm font-semibold text-foreground">{outstandingFee.student}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm text-muted-foreground/80 font-medium hidden sm:table-cell">{outstandingFee.class}</TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-sm font-bold text-destructive tabular-nums">{formatCurrency(outstandingFee.amount)}</span>
                  </TableCell>
                  <TableCell className="px-3 py-3 hidden md:table-cell">
                    <OutstandingFeeOverdueBadge months={outstandingFee.months} t={t} />
                  </TableCell>
                  {canWriteMessaging && (
                    <TableCell className="px-3 py-3 text-end">
                      <OutstandingFeeMessagingActions row={outstandingFee} openComposer={openComposer} t={t} />
                    </TableCell>
                  )}
                </MotionTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <footer className="px-5 py-3.5 border-t border-border/45 flex items-center justify-between bg-muted/10 select-none">
        <Link to={ROUTES.finance} className="inline-flex min-h-11 items-center text-xs font-bold text-primary hover:underline">
          {t("dashboard.widgets.viewAllOutstanding")}
        </Link>
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </footer>

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
