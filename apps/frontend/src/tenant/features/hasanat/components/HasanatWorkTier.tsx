import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributionsList } from "@/tenant/features/hasanat/components/DistributionsList";
import { HasanatDashboard } from "@/tenant/features/hasanat/components/HasanatDashboard";
import { RedemptionTracker } from "@/tenant/features/hasanat/components/RedemptionTracker";
import { StockManager } from "@/tenant/features/hasanat/components/StockManager";
import type { useHasanatDistributionColumnLayout } from "@/tenant/features/hasanat/hooks/useHasanatDistributionColumnLayout";
import type { useHasanatRedemptionColumnLayout } from "@/tenant/features/hasanat/hooks/useHasanatRedemptionColumnLayout";
import type { Denomination, Distribution, StockBatch } from "@/lib/data/hasanatData";

interface WorkTab {
  id: string;
  label: string;
}

interface HasanatWorkTierProps {
  tabs: WorkTab[];
  activeSubTab: string;
  showDeleted: boolean;
  listLoadFailed: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging: boolean;
  createDistributeKey: number;
  denoms: Denomination[];
  batches: StockBatch[];
  distributions: Distribution[];
  distributionColumnLayout: ReturnType<typeof useHasanatDistributionColumnLayout>;
  redemptionColumnLayout: ReturnType<typeof useHasanatRedemptionColumnLayout>;
  onSubTabChange: (tab: string) => void;
  onToggleDeleted: () => void;
  onRetry: () => void;
  onUpdateBatches: (batches: StockBatch[]) => Promise<void>;
  onUpdateDistributions: (distributions: Distribution[]) => Promise<void>;
  onFilteredCountChange: (count: number) => void;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onRowClick?: (id: string) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkRestore: (ids: string[]) => Promise<void>;
  onMessage: (channel: "sms" | "whatsapp" | "email", distributions: Array<{ id: string; recipientName?: string; phone?: string; email?: string }>) => void;
}

export function HasanatWorkTier({
  tabs,
  activeSubTab,
  showDeleted,
  listLoadFailed,
  canWrite,
  canDelete,
  canWriteMessaging,
  createDistributeKey,
  denoms,
  batches,
  distributions,
  distributionColumnLayout,
  redemptionColumnLayout,
  onSubTabChange,
  onToggleDeleted,
  onRetry,
  onUpdateBatches,
  onUpdateDistributions,
  onFilteredCountChange,
  onDelete,
  onRestore,
  onRowClick,
  onBulkDelete,
  onBulkRestore,
  onMessage,
}: HasanatWorkTierProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubTabBar
          tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={activeSubTab}
          onChange={(next) => {
            onSubTabChange(next);
            if (next !== "distribute" && showDeleted) onToggleDeleted();
          }}
        />
        {activeSubTab === "distribute" && canDelete && (
          <ModuleTrashToggle
            showDeleted={showDeleted}
            onToggle={onToggleDeleted}
            showActiveLabel={t("hasanat.trash.showActive")}
            showDeletedLabel={t("hasanat.trash.showDeleted")}
            className="shrink-0"
          />
        )}
      </div>

      {listLoadFailed ? (
        <ErrorState
          title={t("hasanat.loadFailed")}
          description={t("hasanat.loadFailedHint")}
          onRetry={onRetry}
        />
      ) : (
        <>
          {activeSubTab === "overview" && (
            <HasanatDashboard denoms={denoms} batches={batches} distributions={distributions} />
          )}
          {activeSubTab === "stock" && (
            <StockManager batches={batches} denoms={denoms} onUpdate={onUpdateBatches} canWrite={canWrite} />
          )}
          {activeSubTab === "distribute" && (
            <DistributionsList
              distributions={distributions}
              denoms={denoms}
              batches={batches}
              onUpdate={onUpdateDistributions}
              onFilteredCountChange={onFilteredCountChange}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              createRequestKey={createDistributeKey}
              onDelete={onDelete}
              onRestore={onRestore}
            onRowClick={onRowClick}
              onBulkDelete={onBulkDelete}
              onBulkRestore={onBulkRestore}
              isColumnVisible={distributionColumnLayout.isColumnVisible}
              getColumnWidth={distributionColumnLayout.getColumnWidth}
              onColumnResize={distributionColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: distributionColumnLayout.columnRegistry,
                updateUserColumnLayout: distributionColumnLayout.updateUserColumnLayout,
                labels: distributionColumnLayout.customizerLabels,
              }}
              onMessage={canWriteMessaging && !showDeleted ? onMessage : undefined}
            />
          )}
          {activeSubTab === "redemptions" && (
            <RedemptionTracker
              distributions={distributions}
              onUpdateDistributions={onUpdateDistributions}
              onFilteredCountChange={onFilteredCountChange}
              canWrite={canWrite}
              isColumnVisible={redemptionColumnLayout.isColumnVisible}
              getColumnWidth={redemptionColumnLayout.getColumnWidth}
              onColumnResize={redemptionColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: redemptionColumnLayout.columnRegistry,
                updateUserColumnLayout: redemptionColumnLayout.updateUserColumnLayout,
                labels: redemptionColumnLayout.customizerLabels,
              }}
            />
          )}
        </>
      )}
    </ErrorBoundary>
  );
}
