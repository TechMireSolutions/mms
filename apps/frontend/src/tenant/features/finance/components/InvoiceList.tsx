import React, { useEffect, useMemo, useState } from "react";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import type { Invoice } from "@/lib/data/financeData";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { InvoiceListContent, type InvoiceListVisibleColumns } from "@/tenant/features/finance/components/InvoiceListContent";
import { InvoiceListSelectionBar } from "@/tenant/features/finance/components/InvoiceListSelectionBar";
import { InvoiceListToolbar } from "@/tenant/features/finance/components/InvoiceListToolbar";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onRecord: (invoice: Invoice) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  canWriteMessaging?: boolean;
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

export function InvoiceList({
  invoices,
  onView,
  onRecord,
  canWrite = true,
  canDelete = false,
  canWriteMessaging = false,
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
}: InvoiceListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  useEffect(() => setSelectedIds([]), [selectionResetKey, showDeleted]);

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("finance.invoiceStatus.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("finance.invoiceStatus.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("finance.invoiceStatus.overdue"), cls: SEMANTIC_BADGE.destructive },
    partial: { label: t("finance.invoiceStatus.partial"), cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const visibleColumns: InvoiceListVisibleColumns = {
    invoice: isColumnVisible ? isColumnVisible("invoice") : true,
    student: isColumnVisible ? isColumnVisible("student") : true,
    sessionClass: isColumnVisible ? isColumnVisible("sessionClass") : true,
    baseFee: isColumnVisible ? isColumnVisible("baseFee") : true,
    discount: isColumnVisible ? isColumnVisible("discount") : true,
    final: isColumnVisible ? isColumnVisible("final") : true,
    status: isColumnVisible ? isColumnVisible("status") : true,
    dueDate: isColumnVisible ? isColumnVisible("dueDate") : true,
  };

  const visibleColCount =
    Object.values(visibleColumns).filter(Boolean).length +
    (canDelete ? 1 : 0) +
    1;

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

  const allSelected = filtered.length > 0 && filtered.every((invoice) => selectedIds.includes(invoice.id));

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
      <InvoiceListToolbar
        search={search}
        filterStatus={filterStatus}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onClearStatuses={() => setFilterStatus([])}
      />

      {canDelete && (
        <InvoiceListSelectionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          onRequestBulkAction={() => setConfirmBulkOpen(true)}
        />
      )}

      <InvoiceListContent
        invoices={filtered}
        selectedIds={selectedIds}
        visibleColumns={visibleColumns}
        visibleColCount={visibleColCount}
        canWrite={canWrite}
        canDelete={canDelete}
        canWriteMessaging={canWriteMessaging}
        showDeleted={showDeleted}
        allSelected={allSelected}
        statusConfig={statusConfig}
        formatCurrency={formatCurrency}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onSelectAll={(checked) => setSelectedIds(checked ? filtered.map((invoice) => invoice.id) : [])}
        onToggleSelected={toggleSelected}
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
          setSelectedIds([]);
          setConfirmBulkOpen(false);
        }}
      />
    </section>
  );
}
