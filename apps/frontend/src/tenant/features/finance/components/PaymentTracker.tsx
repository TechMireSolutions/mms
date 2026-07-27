import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CreditCard, RotateCcw, Trash2 } from "lucide-react";
import { Payment } from '@/lib/data/financeData';
import { PAYMENT_METHOD_BADGE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { formatDate, type AppTranslationKey } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

const METHOD_LABEL_KEYS: Record<string, AppTranslationKey> = {
  Cash: "finance.paymentMethod.cash",
  "Bank Transfer": "finance.paymentMethod.bank_transfer",
  Cheque: "finance.paymentMethod.cheque",
  Online: "finance.paymentMethod.online",
  Card: "finance.paymentMethod.card",
  Other: "finance.paymentMethod.other",
};



interface PaymentTrackerProps {
  payments: Payment[];
  canDelete?: boolean;
  showDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  selectionResetKey?: string;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function PaymentTracker({
  payments,
  canDelete = false,
  showDeleted = false,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: PaymentTrackerProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  useEffect(() => setSelectedIds([]), [selectionResetKey, showDeleted]);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const paymentsByMethod = payments.reduce((amountByMethod, payment) => {
    amountByMethod[payment.method] = (amountByMethod[payment.method] || 0) + payment.amount;
    return amountByMethod;
  }, {} as Record<string, number>);

  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showInvoice = isColumnVisible ? isColumnVisible("invoice") : true;
  const showAmount = isColumnVisible ? isColumnVisible("amount") : true;
  const showMethod = isColumnVisible ? isColumnVisible("method") : true;
  const showReceivedBy = isColumnVisible ? isColumnVisible("receivedBy") : true;
  const showNote = isColumnVisible ? isColumnVisible("note") : true;

  const visibleColCount =
    (showDate ? 1 : 0) +
    (showStudent ? 1 : 0) +
    (showInvoice ? 1 : 0) +
    (showAmount ? 1 : 0) +
    (showMethod ? 1 : 0) +
    (showReceivedBy ? 1 : 0) +
    (showNote ? 1 : 0) +
    (canDelete ? 2 : 0);
  const allSelected = payments.length > 0 && payments.every((payment) => selectedIds.includes(payment.id));

  const methodConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => {
    const entries = Object.keys(PAYMENT_METHOD_BADGE).map((method) => [
      method,
      {
        label: t(METHOD_LABEL_KEYS[method] ?? "finance.paymentMethod.other"),
        cls: PAYMENT_METHOD_BADGE[method] || SEMANTIC_BADGE.muted,
      },
    ] as const);
    return Object.fromEntries(entries);
  }, [t]);

  return (
    <section aria-label={t("finance.payments")} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label={t("finance.paymentsByMethod")}>
        {Object.entries(paymentsByMethod).map(([method, amount]) => (
          <Card key={method} className="p-3">
            <StatusBadge status={method} config={methodConfig} size="sm" />
            <p className="text-[15px] font-bold text-foreground mt-2 m-0">{formatCurrency(amount)}</p>
            <p className="text-[10px] text-muted-foreground m-0">
              {t("finance.paymentCount", { count: payments.filter((payment) => payment.method === method).length })}
            </p>
          </Card>
        ))}
      </div>
      {canDelete && selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium">{t("finance.trash.selected", { count: selectedIds.length })}</span>
          <Button type="button" variant={showDeleted ? "outline" : "destructive"} onClick={() => setConfirmBulkOpen(true)}>
            {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            {showDeleted ? t("finance.trash.restore") : t("common.delete")}
          </Button>
        </div>
      )}

      <Card accentColor="primary" className="p-0 overflow-hidden">
        <header className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between gap-3 pl-6.5">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">{t("finance.paymentLog")}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-success">{t("finance.paymentTotal", { amount: formatCurrency(totalPaid) })}</span>
            {columnCustomizer && (
              <ModuleColumnCustomizer
                columnRegistry={columnCustomizer.columnRegistry}
                updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
                labels={columnCustomizer.labels}
              />
            )}
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <caption className="sr-only">{t("finance.paymentLog")}</caption>
            <thead>
              <tr className="border-b border-border/50">
                {canDelete && (
                  <th scope="col" className="w-10 px-3 py-2.5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => setSelectedIds(checked ? payments.map((payment) => payment.id) : [])}
                      aria-label={t("finance.trash.selectAll")}
                    />
                  </th>
                )}
                {showDate && (
                  <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.paymentDate")}
                  </ResizableTableHead>
                )}
                {showStudent && (
                  <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.student")}
                  </ResizableTableHead>
                )}
                {showInvoice && (
                  <ResizableTableHead columnKey="invoice" width={getColumnWidth?.("invoice")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.invoice")}
                  </ResizableTableHead>
                )}
                {showAmount && (
                  <ResizableTableHead columnKey="amount" width={getColumnWidth?.("amount")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.amount")}
                  </ResizableTableHead>
                )}
                {showMethod && (
                  <ResizableTableHead columnKey="method" width={getColumnWidth?.("method")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.method")}
                  </ResizableTableHead>
                )}
                {showReceivedBy && (
                  <ResizableTableHead columnKey="receivedBy" width={getColumnWidth?.("receivedBy")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("finance.columns.receivedBy")}
                  </ResizableTableHead>
                )}
                {showNote && (
                  <ResizableTableHead columnKey="note" width={getColumnWidth?.("note")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
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
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {canDelete && (
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.includes(payment.id)}
                          onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...ids, payment.id] : ids.filter((id) => id !== payment.id))}
                          aria-label={t("finance.trash.selectPayment", { id: payment.id })}
                        />
                      </td>
                    )}
                    {showDate && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{formatDate(payment.date)}</td>
                    )}
                    {showStudent && (
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground whitespace-nowrap">{payment.studentName}</td>
                    )}
                    {showInvoice && (
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{payment.invoiceId}</td>
                    )}
                    {showAmount && (
                      <td className="px-4 py-3 text-[13px] font-bold text-success whitespace-nowrap">{formatCurrency(payment.amount)}</td>
                    )}
                    {showMethod && (
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.method} config={methodConfig} size="sm" />
                      </td>
                    )}
                    {showReceivedBy && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{payment.receivedBy || "—"}</td>
                    )}
                    {showNote && (
                      <td className="px-4 py-3 text-[12px] text-muted-foreground max-w-[160px] truncate">{payment.note || "—"}</td>
                    )}
                    {canDelete && (
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => showDeleted ? onRestore?.(payment.id) : setPendingDeleteId(payment.id)}
                          aria-label={showDeleted ? t("finance.trash.restore") : t("common.delete")}
                        >
                          {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <ConfirmAlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("finance.trash.deleteTitle")}
        description={t("finance.trash.deletePaymentConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (pendingDeleteId) onDelete?.(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t("finance.trash.restore") : t("finance.trash.deleteTitle")}
        description={t(showDeleted ? "finance.trash.bulkRestoreConfirm" : "finance.trash.bulkDeleteConfirm", { count: selectedIds.length })}
        confirmLabel={showDeleted ? t("finance.trash.restore") : t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (showDeleted) onBulkRestore?.(selectedIds);
          else onBulkDelete?.(selectedIds);
          setSelectedIds([]);
          setConfirmBulkOpen(false);
        }}
      />
    </section>
  );
}
