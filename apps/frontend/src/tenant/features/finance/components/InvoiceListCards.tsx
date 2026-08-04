import React from "react";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { InvoiceListRowActions } from "@/tenant/features/finance/components/InvoiceListRowActions";
import type { InvoiceListContentProps } from "@/tenant/features/finance/components/invoiceListContentShared";

type InvoiceListCardsProps = Omit<
  InvoiceListContentProps,
  "allSelected" | "visibleColCount" | "getColumnWidth" | "onColumnResize" | "onSelectAll"
>;

export function InvoiceListCards(props: InvoiceListCardsProps): React.JSX.Element {
  const {
    invoices,
    selectedIds,
    isColumnVisible,
    canWrite,
    canDelete,
    canWriteMessaging,
    showDeleted,
    statusConfig,
    formatCurrency,
    onToggleSelected,
    onView,
    onRecord,
    onRequestDelete,
    onRestore,
    openComposer,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3">
      {invoices.length === 0 ? (
        <EmptyState icon={ReceiptText} title={t("finance.empty.invoicesTitle")} description={t("finance.empty.invoicesSubtitle")} compact />
      ) : (
        invoices.map((invoice, index) => (
          <motion.article
            key={invoice.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                {isColumnVisible("student") && <h4 className="truncate text-sm font-semibold text-foreground">{invoice.studentName}</h4>}
                {isColumnVisible("invoice") && <p className="truncate font-mono text-xs text-muted-foreground">{invoice.id}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {isColumnVisible("final") && <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.finalAmt)}</span>}
                {isColumnVisible("status") && <StatusBadge status={invoice.status} config={statusConfig} size="sm" />}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {isColumnVisible("sessionClass") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.sessionClass")}</dt>
                  <dd className="text-foreground">{invoice.class}</dd>
                  <dd className="text-xs text-muted-foreground">{invoice.session}</dd>
                </div>
              )}
              {isColumnVisible("baseFee") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.baseFee")}</dt>
                  <dd className="text-foreground">{formatCurrency(invoice.baseFee)}</dd>
                </div>
              )}
              {isColumnVisible("discount") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.discount")}</dt>
                  <dd className="text-foreground">
                    {invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}
                  </dd>
                  {invoice.discountAmt > 0 ? <dd className="text-xs text-muted-foreground">{invoice.discountType}</dd> : null}
                </div>
              )}
              {isColumnVisible("dueDate") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.dueDate")}</dt>
                  <dd className={invoice.status === "overdue" ? "font-semibold text-destructive" : "text-foreground"}>
                    {formatDate(invoice.dueDate)}
                  </dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
              {canDelete ? (
                <Checkbox
                  checked={selectedIds.includes(invoice.id)}
                  onCheckedChange={(checked) => onToggleSelected(invoice.id, Boolean(checked))}
                  aria-label={t("finance.trash.selectInvoice", { id: invoice.id })}
                />
              ) : <span />}
              <InvoiceListRowActions
                invoice={invoice}
                canWrite={canWrite}
                canDelete={canDelete}
                canWriteMessaging={canWriteMessaging}
                showDeleted={showDeleted}
                onView={onView}
                onRecord={onRecord}
                onRequestDelete={onRequestDelete}
                onRestore={onRestore}
                openComposer={openComposer}
                className="flex flex-wrap items-center gap-1"
              />
            </div>
          </motion.article>
        ))
      )}
    </div>
  );
}
