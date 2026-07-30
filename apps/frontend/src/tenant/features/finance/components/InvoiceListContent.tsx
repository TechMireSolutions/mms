import type React from "react";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import type { StandardMessagingRecipient } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Invoice } from "@/lib/data/financeData";
import { InvoiceListRowActions, type InvoiceMessageChannel } from "@/tenant/features/finance/components/InvoiceListRowActions";

export interface InvoiceListVisibleColumns {
  invoice: boolean;
  student: boolean;
  sessionClass: boolean;
  baseFee: boolean;
  discount: boolean;
  final: boolean;
  status: boolean;
  dueDate: boolean;
}

interface InvoiceListContentProps {
  invoices: Invoice[];
  selectedIds: string[];
  visibleColumns: InvoiceListVisibleColumns;
  visibleColCount: number;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging: boolean;
  showDeleted: boolean;
  allSelected: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleSelected: (id: string, checked: boolean) => void;
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  onRequestDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  openComposer: (channel: InvoiceMessageChannel, recipients: StandardMessagingRecipient[]) => void;
}

export function InvoiceListContent({
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
}: InvoiceListContentProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
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
                  {visibleColumns.student && <h4 className="truncate text-sm font-semibold text-foreground">{invoice.studentName}</h4>}
                  {visibleColumns.invoice && <p className="truncate font-mono text-xs text-muted-foreground">{invoice.id}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {visibleColumns.final && <span className="text-sm font-bold text-foreground">{formatCurrency(invoice.finalAmt)}</span>}
                  {visibleColumns.status && <StatusBadge status={invoice.status} config={statusConfig} size="sm" />}
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {visibleColumns.sessionClass && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.sessionClass")}</dt>
                    <dd className="text-foreground">{invoice.class}</dd>
                    <dd className="text-xs text-muted-foreground">{invoice.session}</dd>
                  </div>
                )}
                {visibleColumns.baseFee && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.baseFee")}</dt>
                    <dd className="text-foreground">{formatCurrency(invoice.baseFee)}</dd>
                  </div>
                )}
                {visibleColumns.discount && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.discount")}</dt>
                    <dd className="text-foreground">
                      {invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}
                    </dd>
                    {invoice.discountAmt > 0 ? <dd className="text-xs text-muted-foreground">{invoice.discountType}</dd> : null}
                  </div>
                )}
                {visibleColumns.dueDate && (
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
    </Card>
  );
}
