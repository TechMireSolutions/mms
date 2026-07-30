import { useEffect, useMemo, useState } from "react";
import { Payment } from '@/lib/data/financeData';
import { PAYMENT_METHOD_BADGE, SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { type AppTranslationKey } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PaymentTrackerList, type PaymentTrackerVisibleColumns } from "@/tenant/features/finance/components/PaymentTrackerList";
import { PaymentMethodSummary, PaymentSelectionBar } from "@/tenant/features/finance/components/PaymentTrackerToolbar";

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

  const paymentsByMethod = payments.reduce<Record<string, { amount: number; count: number }>>((amountByMethod, payment) => {
    const current = amountByMethod[payment.method] ?? { amount: 0, count: 0 };
    amountByMethod[payment.method] = {
      amount: current.amount + payment.amount,
      count: current.count + 1,
    };
    return amountByMethod;
  }, {});

  const visibleColumns: PaymentTrackerVisibleColumns = {
    date: isColumnVisible ? isColumnVisible("date") : true,
    student: isColumnVisible ? isColumnVisible("student") : true,
    invoice: isColumnVisible ? isColumnVisible("invoice") : true,
    amount: isColumnVisible ? isColumnVisible("amount") : true,
    method: isColumnVisible ? isColumnVisible("method") : true,
    receivedBy: isColumnVisible ? isColumnVisible("receivedBy") : true,
    note: isColumnVisible ? isColumnVisible("note") : true,
  };

  const visibleColCount =
    (visibleColumns.date ? 1 : 0) +
    (visibleColumns.student ? 1 : 0) +
    (visibleColumns.invoice ? 1 : 0) +
    (visibleColumns.amount ? 1 : 0) +
    (visibleColumns.method ? 1 : 0) +
    (visibleColumns.receivedBy ? 1 : 0) +
    (visibleColumns.note ? 1 : 0) +
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
      <PaymentMethodSummary paymentsByMethod={paymentsByMethod} methodConfig={methodConfig} formatCurrency={formatCurrency} />
      {canDelete && (
        <PaymentSelectionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          onOpenBulkConfirm={() => setConfirmBulkOpen(true)}
        />
      )}
      <PaymentTrackerList
        payments={payments}
        selectedIds={selectedIds}
        visibleColumns={visibleColumns}
        visibleColCount={visibleColCount}
        allSelected={allSelected}
        canDelete={canDelete}
        showDeleted={showDeleted}
        totalPaid={totalPaid}
        methodConfig={methodConfig}
        columnCustomizer={columnCustomizer}
        formatCurrency={formatCurrency}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onTogglePayment={(paymentId, checked) => setSelectedIds((ids) => checked ? [...ids, paymentId] : ids.filter((id) => id !== paymentId))}
        onToggleAll={(checked) => setSelectedIds(checked ? payments.map((payment) => payment.id) : [])}
        onRequestDelete={setPendingDeleteId}
        onRestore={onRestore}
      />
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
