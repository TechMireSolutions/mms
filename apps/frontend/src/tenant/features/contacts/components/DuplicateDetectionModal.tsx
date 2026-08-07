import { AlertTriangle, Check } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/ErrorState";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { DuplicatePairCard } from "@/tenant/features/contacts/components/DuplicatePairCard";
import type { DuplicatePair } from "@/tenant/features/contacts/components/duplicateDetectionTypes";

export function DuplicateDetectionModal({
  prefs,
  pairsLoading,
  pairsFetching,
  pairsError,
  hasMore,
  activePairs,
  totalPairs,
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
      <div className="space-y-5">
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
