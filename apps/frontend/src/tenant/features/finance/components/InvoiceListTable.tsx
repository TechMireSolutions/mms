import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { InvoiceListRowActions } from "@/tenant/features/finance/components/InvoiceListRowActions";
import { renderInvoiceWorkColumnValue } from "@/tenant/features/finance/components/invoiceWorkColumnCell";
import type { InvoiceListContentProps } from "@/tenant/features/finance/components/invoiceListContentShared";

type InvoiceListTableProps = InvoiceListContentProps;

export function InvoiceListTable(props: InvoiceListTableProps): React.JSX.Element {
  const {
    invoices,
    selectedIds,
    isColumnVisible,
    canSelectInvoices,
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    canWriteMessaging,
    showDeleted,
    statusConfig,
    formatCurrency,
    getColumnWidth,
    onColumnResize,
    onView,
    onRecord,
    onRequestDelete,
    onRestore,
    onToggleSelectAll,
    onToggleSelectedInvoice,
    openComposer,
  } = props;
  const { t } = useTranslation();

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("finance.invoices")}</caption>
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
          {canSelectInvoices && (
            <TableHead className="w-10 px-3 py-2.5 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("finance.table.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("invoice") && (
            <ModuleTableHeaderCell columnKey="invoice" width={getColumnWidth?.("invoice")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.invoice")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("student") && (
            <ModuleTableHeaderCell columnKey="student" width={getColumnWidth?.("student")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.student")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("sessionClass") && (
            <ModuleTableHeaderCell columnKey="sessionClass" width={getColumnWidth?.("sessionClass")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.sessionClass")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("baseFee") && (
            <ModuleTableHeaderCell columnKey="baseFee" width={getColumnWidth?.("baseFee")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.baseFee")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("discount") && (
            <ModuleTableHeaderCell columnKey="discount" width={getColumnWidth?.("discount")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.discount")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("final") && (
            <ModuleTableHeaderCell columnKey="final" width={getColumnWidth?.("final")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.final")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.status")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("dueDate") && (
            <ModuleTableHeaderCell columnKey="dueDate" width={getColumnWidth?.("dueDate")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("finance.columns.dueDate")}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-4 py-2.5 w-10 h-auto">
            <span className="sr-only">{t("common.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/50">
        {invoices.map((invoice) => {
            const isSelected = selectedIds.includes(invoice.id);
            return (
              <TableRow
                key={invoice.id}
                className={`group transition-colors hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}
              >
                {canSelectInvoices && (
                  <TableCell className="px-3 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelectedInvoice(invoice.id, checked === true)}
                      aria-label={t("finance.table.selectInvoice", { id: invoice.id })}
                    />
                  </TableCell>
                )}
                {isColumnVisible("invoice") && (
                  <TableCell className="px-4 py-3">
                    {renderInvoiceWorkColumnValue(invoice, "invoice", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("student") && (
                  <TableCell className="px-4 py-3">
                    {renderInvoiceWorkColumnValue(invoice, "student", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("sessionClass") && (
                  <TableCell className="px-4 py-3">
                    {renderInvoiceWorkColumnValue(invoice, "sessionClass", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("baseFee") && (
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {renderInvoiceWorkColumnValue(invoice, "baseFee", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("discount") && (
                  <TableCell className="px-4 py-3">
                    {renderInvoiceWorkColumnValue(invoice, "discount", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("final") && (
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {renderInvoiceWorkColumnValue(invoice, "final", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("status") && (
                  <TableCell className="px-4 py-3">
                    {renderInvoiceWorkColumnValue(invoice, "status", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                {isColumnVisible("dueDate") && (
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    {renderInvoiceWorkColumnValue(invoice, "dueDate", { t, statusConfig, formatCurrency })}
                  </TableCell>
                )}
                <TableCell className="px-4 py-3">
                  <InvoiceListRowActions
                    invoice={invoice}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    canWriteMessaging={canWriteMessaging}
                    showDeleted={showDeleted}
                    triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
                    onView={onView}
                    onRecord={onRecord}
                    onRequestDelete={onRequestDelete}
                    onRestore={onRestore}
                    openComposer={openComposer}
                  />
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
