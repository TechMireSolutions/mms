import { AlertTriangle, Check, Loader2 } from "lucide-react";
import type { ContactPreferences } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { DuplicatePairCard } from "@/tenant/features/contacts/components/DuplicatePairCard";
import {
  getDuplicateThemeColors,
  type DuplicatePair,
} from "@/tenant/features/contacts/components/duplicateDetectionTypes";

export function DuplicateDetectionModal({
  prefs,
  colors,
  pairsLoading,
  pairsFetching,
  hasMore,
  activePairs,
  keepIndex,
  totalMerged,
  canWrite,
  onClose,
  onMergePair,
  onDismiss,
  onSelectKeep,
  onLoadMore,
}: {
  prefs: ContactPreferences;
  colors: ReturnType<typeof getDuplicateThemeColors>;
  pairsLoading: boolean;
  pairsFetching: boolean;
  hasMore: boolean;
  activePairs: DuplicatePair[];
  keepIndex: Record<string, number>;
  totalMerged: number;
  canWrite: boolean;
  onClose: () => void;
  onMergePair: (pair: DuplicatePair) => void;
  onDismiss: (pairId: string) => void;
  onSelectKeep: (pairId: string, contactIndex: number) => void;
  onLoadMore: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={t("contacts.duplicates.title")}
      subtitle={t("contacts.duplicates.potentialFound", { count: activePairs.length })}
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
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${colors.successBg}`}>
            <Check className={`w-4 h-4 ${colors.successText}`} />
            <p className={`text-xs font-medium ${colors.successText}`}>
              {t("contacts.duplicates.countMerged", { count: totalMerged })}
            </p>
          </div>
        )}

        {!canWrite && activePairs.length > 0 && (
          <div className={`rounded-xl px-4 py-2.5 border ${colors.warningBg}`}>
            <p className={`text-xs ${colors.warningText}`}>{t("contacts.duplicatesReadOnly")}</p>
          </div>
        )}

        {pairsLoading ? (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">{t("common.loading")}</p>
          </div>
        ) : activePairs.length === 0 ? (
          <div className="py-12 text-center">
            <Check className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">{t("contacts.duplicates.allResolved")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("contacts.duplicates.listClean")}</p>
          </div>
        ) : (
          activePairs.map((pair) => (
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
          ))
        )}

        {hasMore && (
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
