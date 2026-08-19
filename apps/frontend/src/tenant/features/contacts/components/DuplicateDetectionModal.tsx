import { AlertTriangle, Check, Search } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/ErrorState";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { DuplicatePairCard } from "@/tenant/features/contacts/components/DuplicatePairCard";
import type { DuplicatePair } from "@/tenant/features/contacts/components/duplicateDetectionTypes";
import type { DuplicateTierFilter } from "@/tenant/features/contacts/hooks/useDuplicateDetectionState";

export function DuplicateDetectionModal({
  prefs,
  pairsLoading,
  pairsFetching,
  pairsError,
  hasMore,
  activePairs,
  totalPairs,
  tierCounts,
  searchQuery,
  setSearchQuery,
  tierFilter,
  setTierFilter,
  keepIndex,
  totalMerged,
  canWrite,
  onClose,
  onMergePair,
  onDismiss,
  onSelectKeep,
  onLoadMore,
  onRetry,
}: {
  prefs: ContactPreferences;
  pairsLoading: boolean;
  pairsFetching: boolean;
  pairsError: boolean;
  hasMore: boolean;
  activePairs: DuplicatePair[];
  totalPairs: number;
  tierCounts: { all: number; high: number; medium: number; low: number };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tierFilter: DuplicateTierFilter;
  setTierFilter: (tier: DuplicateTierFilter) => void;
  keepIndex: Record<string, number>;
  totalMerged: number;
  canWrite: boolean;
  onClose: () => void;
  onMergePair: (pair: DuplicatePair) => void;
  onDismiss: (pairId: string) => void;
  onSelectKeep: (pairId: string, contactIndex: number) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  const filterTabs: Array<{ id: DuplicateTierFilter; label: string; count: number }> = [
    { id: "all", label: t("contacts.duplicates.filterAll"), count: tierCounts.all },
    { id: "high", label: t("contacts.duplicates.filterHigh"), count: tierCounts.high },
    { id: "medium", label: t("contacts.duplicates.filterMedium"), count: tierCounts.medium },
    { id: "low", label: t("contacts.duplicates.filterLow"), count: tierCounts.low },
  ];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t("contacts.duplicates.title")}
      subtitle={t("contacts.duplicates.potentialFound", { count: totalPairs })}
      icon={AlertTriangle}
      size="lg"
      footer={
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="min-h-11 px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent hover:bg-muted"
        >
          {t("common.close")}
        </Button>
      }
    >
      <div className="space-y-4">
        {totalMerged > 0 && (
          <WarningCallout
            tone="success"
            density="compact"
            icon={Check}
            description={t("contacts.duplicates.countMerged", { count: totalMerged })}
          />
        )}

        {!canWrite && activePairs.length > 0 && (
          <WarningCallout
            tone="warning"
            density="compact"
            description={t("contacts.duplicatesReadOnly")}
          />
        )}

        {/* Filter Toolbar: Search & Confidence Tier Tabs */}
        <div className="space-y-2.5 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("contacts.duplicates.searchPlaceholder")}
              className="pl-9 min-h-10 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
            {filterTabs.map((tab) => {
              const active = tierFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTierFilter(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <Badge
                    pill
                    variant="outline"
                    className={`px-1.5 py-0 text-[10px] font-bold ${
                      active ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : "border-border/60"
                    }`}
                  >
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {pairsError ? (
          <ErrorState
            title={t("contacts.duplicates.scanFailed")}
            description={t("contacts.duplicates.scanFailedHint")}
            onRetry={onRetry}
          />
        ) : pairsLoading ? (
          <ModulePanelSuspenseFallback spinnerClassName="h-8 w-8" />
        ) : activePairs.length === 0 ? (
          <EmptyState
            title={t("contacts.duplicates.allResolved")}
            description={t("contacts.duplicates.listClean")}
            icon={Check}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{t("contacts.duplicates.dismissSessionHint")}</p>
            {activePairs.map((pair) => (
              <DuplicatePairCard
                key={pair.id}
                pair={pair}
                prefs={prefs}
                selectedKeepIndex={keepIndex[pair.id] ?? 0}
                canWrite={canWrite}
                onMerge={() => onMergePair(pair)}
                onDismiss={() => onDismiss(pair.id)}
                onSelectKeep={(contactIndex) => onSelectKeep(pair.id, contactIndex)}
                t={t}
              />
            ))}
          </>
        )}

        {hasMore && !pairsError && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={pairsFetching}
              className="font-semibold"
            >
              {pairsFetching ? t("common.loading") : t("contacts.duplicates.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
