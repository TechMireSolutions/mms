import React from "react";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { InvoiceListRowActions } from "@/tenant/features/finance/components/InvoiceListRowActions";
import type { InvoiceListContentProps } from "@/tenant/features/finance/components/invoiceListContentShared";

type InvoiceListTableProps = InvoiceListContentProps;

export function InvoiceListTable(props: InvoiceListTableProps): React.JSX.Element {
  const {
    invoices,
    selectedIds,
    visibleColumns,
    visibleColCount,
    canWrite,
    canDelete,
    canWriteMessaging,
    showDeleted,
    allSelected,
    statusConfig,
    formatCurrency,
    getColumnWidth,
    onColumnResize,
    onSelectAll,
    onToggleSelected,
    onView,
    onRecord,
    onRequestDelete,
    onRestore,
    openComposer,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm table-fixed">
        <caption className="sr-only">{t("finance.invoices")}</caption>
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {canDelete && (
              <th scope="col" className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                  aria-label={t("finance.trash.selectAll")}
                />
              </th>
            )}
            {visibleColumns.invoice && (
              <ResizableTableHead columnKey="invoice" width={getColumnWidth?.("invoice")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.invoice")}
              </ResizableTableHead>
            )}
            {visibleColumns.student && (
              <ResizableTableHead columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.student")}
              </ResizableTableHead>
            )}
            {visibleColumns.sessionClass && (
              <ResizableTableHead columnKey="sessionClass" width={getColumnWidth?.("sessionClass")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.sessionClass")}
              </ResizableTableHead>
            )}
            {visibleColumns.baseFee && (
              <ResizableTableHead columnKey="baseFee" width={getColumnWidth?.("baseFee")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.baseFee")}
              </ResizableTableHead>
            )}
            {visibleColumns.discount && (
              <ResizableTableHead columnKey="discount" width={getColumnWidth?.("discount")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.discount")}
              </ResizableTableHead>
            )}
            {visibleColumns.final && (
              <ResizableTableHead columnKey="final" width={getColumnWidth?.("final")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.final")}
              </ResizableTableHead>
            )}
            {visibleColumns.status && (
              <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.status")}
              </ResizableTableHead>
            )}
            {visibleColumns.dueDate && (
              <ResizableTableHead columnKey="dueDate" width={getColumnWidth?.("dueDate")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("finance.columns.dueDate")}
              </ResizableTableHead>
            )}
            <th scope="col" className="px-4 py-2.5 w-10">
              <span className="sr-only">{t("common.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {invoices.length === 0 ? (
            <tr><td colSpan={visibleColCount} className="py-4"><EmptyState icon={ReceiptText} title={t("finance.empty.invoicesTitle")} description={t("finance.empty.invoicesSubtitle")} compact /></td></tr>
          ) : (
            invoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-muted/20 transition-colors group"
              >
                {canDelete && (
                  <td className="px-3 py-3">
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={(checked) => onToggleSelected(invoice.id, Boolean(checked))}
                      aria-label={t("finance.trash.selectInvoice", { id: invoice.id })}
                    />
                  </td>
                )}
                {visibleColumns.invoice && (
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-semibold text-muted-foreground">{invoice.id}</span>
                  </td>
                )}
                {visibleColumns.student && (
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{invoice.studentName}</p>
                  </td>
                )}
                {visibleColumns.sessionClass && (
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground m-0">{invoice.class}</p>
                    <p className="text-xs text-muted-foreground m-0">{invoice.session}</p>
                  </td>
                )}
                {visibleColumns.baseFee && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-foreground">{formatCurrency(invoice.baseFee)}</span>
                  </td>
                )}
                {visibleColumns.discount && (
                  <td className="px-4 py-3">
                    {invoice.discountAmt > 0 ? (
                      <div>
                        <span className="text-sm text-warning font-medium">-{formatCurrency(invoice.discountAmt)}</span>
                        <p className="text-xs text-muted-foreground m-0">{invoice.discountType}</p>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                  </td>
                )}
                {visibleColumns.final && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.finalAmt)}</span>
                    {invoice.paidAmt && invoice.status === "partial" && (
                      <p className="text-xs text-info m-0">{t("finance.paidAmount", { amount: formatCurrency(invoice.paidAmt) })}</p>
                    )}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} config={statusConfig} size="sm" />
                  </td>
                )}
                {visibleColumns.dueDate && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-sm ${invoice.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{formatDate(invoice.dueDate)}</span>
                  </td>
                )}
                <td className="px-4 py-3">
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
                    className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity"
                  />
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
