import { useEffect, useState } from "react";
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { Denomination, Distribution, StockBatch } from '@/lib/data/hasanatData';
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ListPagination } from "@/components/ui/ListPagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributeModal } from "./DistributeModal";
import { DistributionsListContent } from "./DistributionsListContent";
import { DistributionsListFilters } from "./DistributionsListFilters";
import { HasanatBulkActionBar } from "./HasanatBulkActionBar";
import { useDistributionSelection } from "@/tenant/features/hasanat/hooks/useDistributionSelection";
import { useDistributionsList } from "../hooks/useDistributionsList";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

export interface DistributionsListProps {
  distributions: Distribution[];
  denoms: Denomination[];
  batches: StockBatch[];
  onUpdate: (dists: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
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
  onRowClick?: (id: string) => void;
}

/**
 * DistributionsList Component
 *
 * Renders the ledger interface for tracking physical reward cards distributed to students or faculty.
 * Enables searching and filtering distributions by keyword or status (e.g., active, redeemed, returned),
 * updating distribution statuses, and launching a modal to issue new cards to recipients.
 *
 * @param props - Component properties.
 * @returns React element representing the card distribution manager UI.
 */
export function DistributionsList({
  distributions,
  denoms,
  batches,
  onUpdate,
  onFilteredCountChange,
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  onToggleDeleted,
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
  onRowClick,
}: DistributionsListProps) {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const {
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
  } = useDistributionsList({
    distributions,
    onUpdate,
    onFilteredCountChange,
    canWrite,
    showDeleted,
    createRequestKey,
  });

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedDistribution,
  } = useDistributionSelection(pageDistributions);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted, listPage, search, filterStatus, setSelectedIds]);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);

  return (
    <section aria-label={t("hasanat.distribution.aria")} className="space-y-4">
      <DistributionsListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        filterStatus={filterStatus}
        statusLabels={statusLabels}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onClearStatuses={() => setFilterStatus([])}
        onOpenModal={() => setShowModal(true)}
      />

      {canBulkTrash && (
        <HasanatBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDelete}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {pageQuery.isError ? (
        <ErrorState
          title={t('hasanat.loadFailed')}
          description={t('hasanat.loadFailedHint')}
          onRetry={() => { void pageQuery.refetch(); }}
        />
      ) : pageDistributions.length > 0 && (
        <DistributionsListContent
          viewMode={viewMode}
          distributions={pageDistributions}
          denoms={denoms}
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          isColumnVisible={columnVisible}
          statusLabels={statusLabels}
          statusConfig={statusConfig}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          canRestoreRows={!!onRestore}
          canDeleteRows={!!onDelete}
          onMessage={onMessage}
          onRowClick={onRowClick}
          onChangeStatus={changeStatus}
          onToggleSelectedDistribution={toggleSelectedDistribution}
          onToggleSelectAll={toggleSelectAll}
          onTrashAction={(id) => {
            if (showDeleted) void onRestore?.(id);
            else setPendingTrashId(id);
          }}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
        />
      )}

      <ListPagination
        page={serverPage}
        total={serverTotal}
        limit={serverLimit}
        hasMore={serverHasMore}
        onPageChange={setListPage}
        i18nNamespace="hasanat"
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

      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => { if (!open) setPendingTrashId(null); }}
        title={t('hasanat.trash.deleteTitle')}
        description={t('hasanat.trash.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t('hasanat.trash.restore') : t('hasanat.trash.deleteTitle')}
        description={t(showDeleted ? 'hasanat.trash.bulkRestoreConfirm' : 'hasanat.trash.bulkDeleteConfirm', { count: selectedIds.length })}
        confirmLabel={showDeleted ? t('hasanat.trash.restore') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkTrash}
      />
    </section>
  );
}
