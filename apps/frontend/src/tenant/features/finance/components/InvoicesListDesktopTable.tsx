import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { InvoicesRowActions } from "@/tenant/features/finance/components/InvoicesRowActions";
import { renderInvoiceWorkColumnValue } from "@/tenant/features/finance/components/invoiceWorkColumnCell";
import type { InvoicesListContentProps } from "@/tenant/features/finance/components/invoicesListShared";

export type InvoicesListDesktopTableProps = InvoicesListContentProps;

export function InvoicesListDesktopTable(props: InvoicesListDesktopTableProps): React.JSX.Element {
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
  const selectedIdsSet = new Set(selectedIds);

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("finance.invoices")}</caption>
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("invoice") ? { id: "invoice", label: t("finance.columns.invoice") } : null,
          isColumnVisible("student") ? { id: "student", label: t("finance.columns.student") } : null,
          isColumnVisible("sessionClass") ? { id: "sessionClass", label: t("finance.columns.sessionClass") } : null,
          isColumnVisible("baseFee") ? { id: "baseFee", label: t("finance.columns.baseFee") } : null,
          isColumnVisible("discount") ? { id: "discount", label: t("finance.columns.discount") } : null,
          isColumnVisible("final") ? { id: "final", label: t("finance.columns.final") } : null,
          isColumnVisible("status") ? { id: "status", label: t("finance.columns.status") } : null,
          isColumnVisible("dueDate") ? { id: "dueDate", label: t("finance.columns.dueDate") } : null,
        ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canSelectInvoices ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("finance.table.selectAll")
        } : undefined}
        actionsLabel={t("common.actions")}
      />
      <TableBody className="divide-y divide-border/50">
        {invoices.map((invoice) => {
            const isSelected = selectedIdsSet.has(invoice.id);
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
                  <InvoicesRowActions
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
