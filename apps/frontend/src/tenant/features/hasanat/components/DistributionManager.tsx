import { Trash2 } from "lucide-react";
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import type { Denomination, Distribution, StockBatch } from '@/lib/data/hasanatData';
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { BulkSelectionClearAction, BulkSelectionRestoreAction } from "@/components/ui/BulkSelectionActions";
import { Button } from "@/components/ui/button";
import { DistributeModal } from "./DistributeModal";
import { DistributionManagerList } from "./DistributionManagerList";
import { DistributionManagerToolbar } from "./DistributionManagerToolbar";
import { useDistributionManagerState } from "./useDistributionManagerState";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

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
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const {
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
    toggleSelectAll,
    allFilteredSelected,
    handleBulkAction,
  } = useDistributionManagerState({
    distributions,
    onUpdate,
    onFilteredCountChange,
    canWrite,
    showDeleted,
    createRequestKey,
    onDelete,
    onRestore,
    onBulkDelete,
    onBulkRestore,
  });

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  return (
    <section aria-label={t("hasanat.distribution.aria")} className="space-y-4">
      {canDelete && (
        <BulkSelectionBar
          placement="inline"
          tone="glass"
          selectedCount={selectedIds.length}
          countLabel={t("hasanat.trash.selected", { count: selectedIds.length })}
          trailing={
            <BulkSelectionClearAction
              label={t("common.deselect")}
              onClick={() => setSelectedIds([])}
            />
          }
        >
          {showDeleted ? (
            <BulkSelectionRestoreAction
              label={t("hasanat.trash.restore")}
              onClick={() => { void handleBulkAction(); }}
            />
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => { void handleBulkAction(); }}
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.delete")}
            </Button>
          )}
        </BulkSelectionBar>
      )}

      <DistributionManagerToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        filterStatus={filterStatus}
        statusLabels={statusLabels}
        statusConfig={statusConfig}
        canWrite={canWrite}
        showDeleted={showDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onOpenModal={() => setShowModal(true)}
      />

      <DistributionManagerList
        viewMode={viewMode}
        distributions={filtered}
        denoms={denoms}
        selectedIds={selectedIds}
        allFilteredSelected={allFilteredSelected}
        isColumnVisible={columnVisible}
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
        onToggleAll={() => toggleSelectAll()}
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
