import { useEffect, useMemo, useState } from "react";
import type { Distribution } from '@/lib/data/hasanatData';
import { HASANAT_MODULE_MANIFEST } from '@mms/shared';
import { useTranslation } from "@/hooks/useTranslation";
import { useDebounce } from "@/hooks/useDebounce";
import { useHasanatContractList } from "@/tenant/features/hasanat/hooks/useHasanatTsrHooks";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

type DistributionStatus = Distribution["status"];

const DISTRIBUTION_SEARCH_DEBOUNCE_MS = 300;

export interface UseDistributionsListStateOptions {
  /** Full list — used by mutation handlers (`handleDistribute`/`changeStatus`) only. */
  distributions: Distribution[];
  onUpdate: (dists: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
}

export function useDistributionsList({
  distributions,
  onUpdate,
  onFilteredCountChange,
  canWrite = true,
  showDeleted = false,
  createRequestKey = 0,
}: UseDistributionsListStateOptions) {
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
  const [listPage, setListPage] = useState(1);

  const debouncedSearch = useDebounce(search, DISTRIBUTION_SEARCH_DEBOUNCE_MS);

  // Server-side filter/page reset whenever a filter dimension changes.
  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterStatus, showDeleted]);

  const pageQuery = useHasanatContractList({
    page: listPage,
    limit: HASANAT_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    status: filterStatus.length ? filterStatus.join(',') : undefined,
    includeDeleted: showDeleted,
  });

  const pageDistributions: Distribution[] = (pageQuery.data?.body?.distributions ?? []) as Distribution[];
  const serverTotal = pageQuery.data?.body?.total ?? 0;
  const serverPage = pageQuery.data?.body?.page ?? listPage;
  const serverLimit = pageQuery.data?.body?.limit ?? HASANAT_MODULE_MANIFEST.defaultPageSize;
  const serverHasMore = pageQuery.data?.body?.hasMore ?? false;

  useEffect(() => {
    onFilteredCountChange?.(serverTotal);
  }, [onFilteredCountChange, serverTotal]);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) {
      setShowModal(true);
    }
  }, [createRequestKey, canWrite, showDeleted]);

  const toggleStatus = (status: DistributionStatus) => setFilterStatus((selectedStatuses) => selectedStatuses.includes(status) ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status) : [...selectedStatuses, status]);

  const handleDistribute = async (dist: Distribution) => {
    await onUpdate([...distributions, dist]);
    setShowModal(false);
  };

  const changeStatus = (id: string, status: DistributionStatus) => {
    void onUpdate(distributions.map((distribution) => distribution.id === id ? { ...distribution, status } : distribution));
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
    setFilterStatus,
    listPage,
    setListPage,
    pageDistributions,
    pageQuery,
    serverTotal,
    serverPage,
    serverLimit,
    serverHasMore,
    toggleStatus,
    handleDistribute,
    changeStatus,
  };
}