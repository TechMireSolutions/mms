import { useEffect, useMemo, useState } from "react";
import type { Distribution } from '@/lib/data/hasanatData';
import { useTranslation } from "@/hooks/useTranslation";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

type DistributionStatus = Distribution["status"];

export interface UseDistributionManagerStateOptions {
  distributions: Distribution[];
  onUpdate: (dists: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
}

export function useDistributionManagerState({
  distributions,
  onUpdate,
  onFilteredCountChange,
  canWrite = true,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
}: UseDistributionManagerStateOptions) {
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

  return {
    t,
    statusLabels,
    statusConfig,
    showModal,
    setShowModal,
    search,
    setSearch,
    filterStatus,
    selectedIds,
    setSelectedIds,
    filtered,
    toggleStatus,
    handleDistribute,
    changeStatus,
    handleRowTrashAction,
    toggleSelected,
    allFilteredSelected,
    handleBulkAction,
  };
}
