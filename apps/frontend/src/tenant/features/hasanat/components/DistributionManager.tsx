import { useEffect, useMemo, useState } from "react";
import type { Denomination, Distribution, StockBatch } from '@/lib/data/hasanatData';
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { DistributeModal } from "./DistributeModal";
import { DistributionManagerList, type DistributionVisibleColumns } from "./DistributionManagerList";
import { DistributionManagerToolbar } from "./DistributionManagerToolbar";


export interface DistributionManagerProps {
  distributions: Distribution[];
  denoms: Denomination[];
  batches: StockBatch[];
  onUpdate: (dists: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', distributions: Distribution[]) => void;
}

type DistributionStatus = Distribution["status"];

/**
 * DistributionManager Component
 *
 * Renders the ledger interface for tracking physical reward cards distributed to students or faculty.
 * Enables searching and filtering distributions by keyword or status (e.g., active, redeemed, returned),
 * updating distribution statuses, and launching a modal to issue new cards to recipients.
 *
 * @param props - Component properties.
 * @returns React element representing the card distribution manager UI.
 */
export function DistributionManager({
  distributions,
  denoms,
  batches,
  onUpdate,
  onFilteredCountChange,
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
}: DistributionManagerProps) {
  const { t } = useTranslation();
  const statusLabels = useMemo(
    () => ({
      active: t('hasanat.status.active'),
      redeemed: t('hasanat.status.redeemed'),
      returned: t('hasanat.status.returned'),
    }),
    [t],
  );
  const statusConfig = useMemo<Record<DistributionStatus, StatusBadgeConfigItem>>(() => ({
    active:   { label: statusLabels.active,   cls: SEMANTIC_BADGE.info },
    redeemed: { label: statusLabels.redeemed, cls: 'bg-primary/10 text-primary border-primary/20' },
    returned: { label: statusLabels.returned, cls: SEMANTIC_BADGE.muted },
  }), [statusLabels]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DistributionStatus[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return distributions.filter((distribution) => {
      const query = search.toLowerCase();
      const matchSearch = !query
        || (distribution.recipientName || "").toLowerCase().includes(query)
        || distribution.denominationName.toLowerCase().includes(query)
        || distribution.reason?.toLowerCase().includes(query);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(distribution.status);
      return matchSearch && matchStatus;
    });
  }, [distributions, search, filterStatus]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) {
      setShowModal(true);
    }
  }, [createRequestKey, canWrite, showDeleted]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const visibleColumns: DistributionVisibleColumns = {
    card: isColumnVisible ? isColumnVisible("card") : true,
    recipient: isColumnVisible ? isColumnVisible("recipient") : true,
    recipientClass: isColumnVisible ? isColumnVisible("recipientClass") : true,
    quantity: isColumnVisible ? isColumnVisible("quantity") : true,
    reason: isColumnVisible ? isColumnVisible("reason") : true,
    issuedDate: isColumnVisible ? isColumnVisible("issuedDate") : true,
    issuedBy: isColumnVisible ? isColumnVisible("issuedBy") : true,
    status: isColumnVisible ? isColumnVisible("status") : true,
  };

  const toggleStatus = (status: DistributionStatus) => setFilterStatus((selectedStatuses) => selectedStatuses.includes(status) ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status) : [...selectedStatuses, status]);

  const handleDistribute = async (dist: Distribution) => {
    await onUpdate([...distributions, dist]);
    setShowModal(false);
  };

  const changeStatus = (id: string, status: DistributionStatus) => {
    void onUpdate(distributions.map((distribution) => distribution.id === id ? { ...distribution, status } : distribution));
  };

  const handleRowTrashAction = async (id: string) => {
    if (showDeleted) {
      if (!confirm(t("hasanat.trash.bulkRestoreConfirm", { count: 1 }))) return;
      await onRestore?.(id);
      return;
    }
    if (!confirm(t("hasanat.trash.deleteConfirm"))) return;
    await onDelete?.(id);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((distribution) => selectedIds.includes(distribution.id));

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("hasanat.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("hasanat.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  return (
    <section aria-label={t("hasanat.distribution.aria")} className="space-y-4">
      <DistributionManagerToolbar
        search={search}
        filterStatus={filterStatus}
        statusLabels={statusLabels}
        statusConfig={statusConfig}
        selectedCount={selectedIds.length}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onBulkAction={() => { void handleBulkAction(); }}
        onOpenModal={() => setShowModal(true)}
      />

      <DistributionManagerList
        distributions={filtered}
        denoms={denoms}
        selectedIds={selectedIds}
        allFilteredSelected={allFilteredSelected}
        visibleColumns={visibleColumns}
        statusLabels={statusLabels}
        statusConfig={statusConfig}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        canRestoreRows={!!onRestore}
        canDeleteRows={!!onDelete}
        onMessage={onMessage}
        onChangeStatus={changeStatus}
        onToggleSelected={toggleSelected}
        onToggleAll={(checked) => {
          if (checked) setSelectedIds(filtered.map((distribution) => distribution.id));
          else setSelectedIds([]);
        }}
        onRowTrashAction={(id) => { void handleRowTrashAction(id); }}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
      />

      {canWrite && !showDeleted && (
        <DistributeModal
          open={showModal}
          denoms={denoms}
          batches={batches}
          onClose={() => setShowModal(false)}
          onSave={handleDistribute}
        />
      )}
    </section>
  );
}
