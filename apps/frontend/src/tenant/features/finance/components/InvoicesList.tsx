import React, { useEffect, useMemo, useState } from "react";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import type { Invoice } from "@/lib/data/financeData";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useInvoiceSelection } from "@/tenant/features/finance/hooks/useInvoiceSelection";
import { FinanceBulkActionBar } from "@/tenant/features/finance/components/FinanceBulkActionBar";
import { InvoicesListContent } from "@/tenant/features/finance/components/InvoicesListContent";
import { InvoicesListFilters } from "@/tenant/features/finance/components/InvoicesListFilters";
import { getInvoiceVisibleWorkColumns } from "@/tenant/features/finance/components/invoiceListVisibleColumns";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

interface InvoicesListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  canWriteMessaging?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkRestore?: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onBulkPrintReceipts?: (invoices: Invoice[]) => void;
  isBulkStatusPending?: boolean;
  selectionResetKey?: string;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function InvoicesList({
  invoices,
  onView,
  onRecord,
  canWrite = true,
  canDelete = false,
  canWriteMessaging = false,
  showDeleted = false,
  onToggleDeleted,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
  onBulkPrintReceipts,
  isBulkStatusPending = false,
  selectionResetKey,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: InvoicesListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { formatCurrency } = useFinanceCurrency();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;
  const columnRegistry = columnCustomizer?.columnRegistry ?? [];

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const normalizedSearch = search.toLowerCase();
      const matchSearch = !normalizedSearch
        || invoice.studentName.toLowerCase().includes(normalizedSearch)
        || invoice.id.toLowerCase().includes(normalizedSearch)
        || invoice.session.toLowerCase().includes(normalizedSearch);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(invoice.status);
      return matchSearch && matchStatus;
    });
  }, [invoices, search, filterStatus]);

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedInvoice,
    clearSelection,
  } = useInvoiceSelection(filtered);

  useEffect(() => setSelectedIds([]), [selectionResetKey, showDeleted, setSelectedIds]);

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("finance.invoiceStatus.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("finance.invoiceStatus.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("finance.invoiceStatus.overdue"), cls: SEMANTIC_BADGE.destructive },
    partial: { label: t("finance.invoiceStatus.partial"), cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const visibleColCount =
    getInvoiceVisibleWorkColumns(columnRegistry, columnVisible).length
    + (canDelete ? 1 : 0)
    + 1;

  const toggleStatus = (status: string) => setFilterStatus((currentStatuses) => currentStatuses.includes(status)
    ? currentStatuses.filter((selectedStatus) => selectedStatus !== status)
    : [...currentStatuses, status]);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((ids) => (checked
      ? ids.includes(id) ? ids : [...ids, id]
      : ids.filter((selectedId) => selectedId !== id)));
  };

  return (
    <section aria-label={t("finance.invoices")} className="space-y-4">
      <InvoicesListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        filterStatus={filterStatus}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onClearStatuses={() => setFilterStatus([])}
      />

      {canDelete && (
        <FinanceBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDelete}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={clearSelection}
          onBulkStatusChange={onBulkStatusChange ? (status) => onBulkStatusChange(selectedIds, status) : undefined}
          onBulkPrintReceipts={onBulkPrintReceipts ? () => onBulkPrintReceipts(filtered.filter((inv) => selectedIds.includes(inv.id))) : undefined}
          isBulkStatusPending={isBulkStatusPending}
          statusBadgeConfig={statusConfig}
        />
      )}

      <InvoicesListContent
        viewMode={viewMode}
        invoices={filtered}
        selectedIds={selectedIds}
        isColumnVisible={columnVisible}
        visibleColCount={visibleColCount}
        columnRegistry={columnRegistry}
        canSelectInvoices={canDelete}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={canWriteMessaging}
        showDeleted={showDeleted}
        statusConfig={statusConfig}
        formatCurrency={formatCurrency}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectedInvoice={toggleSelected}
        onView={onView}
        onRecord={onRecord}
        onRequestDelete={onDelete ? setPendingDeleteId : undefined}
        onRestore={onRestore}
        openComposer={openComposer}
      />

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
      <ConfirmAlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("finance.trash.deleteTitle")}
        description={t("finance.trash.deleteInvoiceConfirm")}
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
          clearSelection();
          setConfirmBulkOpen(false);
        }}
      />
    </section>
  );
}
