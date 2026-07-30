import { motion } from "framer-motion";
import { RotateCcw, Trash2 } from "lucide-react";
import { formatDate } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Payment } from "@/lib/data/financeData";
import { PaymentLogHeader } from "@/tenant/features/finance/components/PaymentTrackerToolbar";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";

export interface PaymentTrackerVisibleColumns {
  date: boolean;
  student: boolean;
  invoice: boolean;
  amount: boolean;
  method: boolean;
  receivedBy: boolean;
  note: boolean;
}

interface PaymentTrackerListProps {
  payments: Payment[];
  selectedIds: string[];
  visibleColumns: PaymentTrackerVisibleColumns;
  visibleColCount: number;
  allSelected: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  totalPaid: number;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  columnCustomizer?: ModuleColumnCustomizerProps;
  formatCurrency: (amount: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onRequestDelete: (paymentId: string) => void;
  onRestore?: (paymentId: string) => void;
}

export function PaymentTrackerList({
  payments,
  selectedIds,
  visibleColumns,
  visibleColCount,
  allSelected,
  canDelete,
  showDeleted,
  totalPaid,
  methodConfig,
  columnCustomizer,
  formatCurrency,
  getColumnWidth,
  onColumnResize,
  onTogglePayment,
  onToggleAll,
  onRequestDelete,
  onRestore,
}: PaymentTrackerListProps) {
  const { t } = useTranslation();

  const renderRowAction = (paymentId: string) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => showDeleted ? onRestore?.(paymentId) : onRequestDelete(paymentId)}
      aria-label={showDeleted ? t("finance.trash.restore") : t("common.delete")}
    >
      {showDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );

  return (
    <Card accentColor="primary" className="overflow-hidden p-0">
      <PaymentLogHeader totalPaid={totalPaid} formatCurrency={formatCurrency} columnCustomizer={columnCustomizer} />
      <div className="space-y-3 p-3 md:hidden">
        {payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("finance.empty.payments")}</p>
        ) : (
          payments.map((payment, index) => (
            <motion.article
              key={payment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  {visibleColumns.student && <h4 className="truncate text-sm font-semibold text-foreground">{payment.studentName}</h4>}
                  {visibleColumns.invoice && <p className="truncate font-mono text-xs text-muted-foreground">{payment.invoiceId}</p>}
                </div>
                {visibleColumns.amount && <span className="shrink-0 text-sm font-bold text-success">{formatCurrency(payment.amount)}</span>}
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {visibleColumns.date && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.paymentDate")}</dt>
                    <dd className="text-foreground">{formatDate(payment.date)}</dd>
                  </div>
                )}
                {visibleColumns.method && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("finance.columns.method")}</dt>
                    <dd><StatusBadge status={payment.method} config={methodConfig} size="sm" /></dd>
                  </div>
                )}
                {visibleColumns.receivedBy && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.receivedBy")}</dt>
                    <dd className="break-words text-foreground">{payment.receivedBy || "—"}</dd>
                  </div>
                )}
                {visibleColumns.note && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.note")}</dt>
                    <dd className="break-words text-foreground">{payment.note || "—"}</dd>
                  </div>
                )}
              </dl>
              {canDelete && (
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <Checkbox
                    checked={selectedIds.includes(payment.id)}
                    onCheckedChange={(checked) => onTogglePayment(payment.id, checked === true)}
                    aria-label={t("finance.trash.selectPayment", { id: payment.id })}
                  />
                  {renderRowAction(payment.id)}
                </div>
              )}
            </motion.article>
          ))
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">{t("finance.paymentLog")}</caption>
          <thead>
            <tr className="border-b border-border/50">
              {canDelete && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onToggleAll(checked === true)}
                    aria-label={t("finance.trash.selectAll")}
                  />
                </th>
              )}
              {visibleColumns.date && (
                <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.paymentDate")}
                </ResizableTableHead>
              )}
              {visibleColumns.student && (
                <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.student")}
                </ResizableTableHead>
              )}
              {visibleColumns.invoice && (
                <ResizableTableHead columnKey="invoice" width={getColumnWidth?.("invoice")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.invoice")}
                </ResizableTableHead>
              )}
              {visibleColumns.amount && (
                <ResizableTableHead columnKey="amount" width={getColumnWidth?.("amount")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.amount")}
                </ResizableTableHead>
              )}
              {visibleColumns.method && (
                <ResizableTableHead columnKey="method" width={getColumnWidth?.("method")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.method")}
                </ResizableTableHead>
              )}
              {visibleColumns.receivedBy && (
                <ResizableTableHead columnKey="receivedBy" width={getColumnWidth?.("receivedBy")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.receivedBy")}
                </ResizableTableHead>
              )}
              {visibleColumns.note && (
                <ResizableTableHead columnKey="note" width={getColumnWidth?.("note")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {t("finance.columns.note")}
                </ResizableTableHead>
              )}
              {canDelete && <th scope="col" className="w-12 px-3 py-2.5"><span className="sr-only">{t("common.actions")}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {payments.length === 0 ? (
              <tr><td colSpan={visibleColCount || 1} className="py-10 text-center text-sm text-muted-foreground">{t("finance.empty.payments")}</td></tr>
            ) : (
              payments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="transition-colors hover:bg-muted/20"
                >
                  {canDelete && (
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selectedIds.includes(payment.id)}
                        onCheckedChange={(checked) => onTogglePayment(payment.id, checked === true)}
                        aria-label={t("finance.trash.selectPayment", { id: payment.id })}
                      />
                    </td>
                  )}
                  {visibleColumns.date && <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(payment.date)}</td>}
                  {visibleColumns.student && <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{payment.studentName}</td>}
                  {visibleColumns.invoice && <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{payment.invoiceId}</td>}
                  {visibleColumns.amount && <td className="px-4 py-3 text-sm font-bold text-success whitespace-nowrap">{formatCurrency(payment.amount)}</td>}
                  {visibleColumns.method && <td className="px-4 py-3"><StatusBadge status={payment.method} config={methodConfig} size="sm" /></td>}
                  {visibleColumns.receivedBy && <td className="px-4 py-3 text-sm text-muted-foreground">{payment.receivedBy || "—"}</td>}
                  {visibleColumns.note && <td className="max-w-[10rem] truncate px-4 py-3 text-sm text-muted-foreground">{payment.note || "—"}</td>}
                  {canDelete && <td className="px-3 py-3">{renderRowAction(payment.id)}</td>}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
