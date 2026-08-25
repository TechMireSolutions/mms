import type React from "react";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { InvoicesRowActions } from "@/tenant/features/finance/components/InvoicesRowActions";
import { getInvoiceVisibleWorkColumns } from "@/tenant/features/finance/components/invoiceListVisibleColumns";
import { renderInvoiceWorkColumnValue } from "@/tenant/features/finance/components/invoiceWorkColumnCell";
import type { InvoicesListContentProps } from "@/tenant/features/finance/components/invoicesListShared";

type InvoicesListCardsProps = Omit<
  InvoicesListContentProps,
  "visibleColCount" | "getColumnWidth" | "onColumnResize"
>;

export function InvoicesListCards(props: InvoicesListCardsProps): React.JSX.Element {
  const {
    invoices,
    isColumnVisible,
    columnRegistry,
    canSelectInvoices,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    canWriteMessaging,
    showDeleted,
    statusConfig,
    formatCurrency,
    onView,
    onRecord,
    onRequestDelete,
    onRestore,
    onToggleSelectAll,
    onToggleSelectedInvoice,
    openComposer,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(invoices.length, t, {
    singular: "finance.item.invoice",
    plural: "finance.item.invoices",
  });

  return (
    <ModuleDirectoryCards
      items={invoices}
      selectedIds={selectedIds}
      onSelectAll={canSelectInvoices ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
      allSelected={allVisibleSelected}
      someSelected={someVisibleSelected}
      selectAllLabel={t("finance.table.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("finance.trash.selected", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="finance-invoices"
      renderItem={(invoice) => {
        const isSelected = selectedIds.includes(invoice.id);
        const visibleColumns = getInvoiceVisibleWorkColumns(columnRegistry, isColumnVisible, {
          excludeFace: true,
        });

        return (
          <DirectoryEntityCard key={invoice.id} isSelected={isSelected} reducedMotion={reducedMotion}>
            <DirectoryCardHeader
              id={invoice.id}
              displayName={invoice.studentName}
              isSelected={isSelected}
              showSelect={canSelectInvoices}
              onSelect={() => onToggleSelectedInvoice(invoice.id, !isSelected)}
              selectAriaLabel={t("finance.table.selectInvoice", { id: invoice.id })}
              onView={() => onView(invoice)}
              viewAriaLabel={`${t("finance.table.viewProfile")} - ${invoice.studentName}`}
              reducedMotion={reducedMotion}
              subtitle={
                <p className="font-mono text-xs text-muted-foreground truncate">{invoice.id}</p>
              }
            />

            <DirectoryCardMetadata
              columns={visibleColumns}
              keyFor={(col) => col.key}
              labelFor={(col) => col.label}
              renderValue={(col) =>
                renderInvoiceWorkColumnValue(invoice, col.key, {
                  t,
                  statusConfig,
                  formatCurrency,
                  emptyFallback: null,
                })
              }
            />

            <DirectoryCardFooter
              trailing={
                <>
                  <DirectoryCardViewButton
                    label={t("finance.table.viewProfile")}
                    ariaLabel={`${t("finance.table.viewProfile")} - ${invoice.studentName}`}
                    onClick={() => onView(invoice)}
                  />
                  <InvoicesRowActions
                    invoice={invoice}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    canWriteMessaging={canWriteMessaging}
                    showDeleted={showDeleted}
                    hideViewItem
                    triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
                    onView={onView}
                    onRecord={onRecord}
                    onRequestDelete={onRequestDelete}
                    onRestore={onRestore}
                    openComposer={openComposer}
                  />
                </>
              }
            />
          </DirectoryEntityCard>
        );
      }}
    />
  );
}

