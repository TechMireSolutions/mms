import React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionListCards } from "@/tenant/features/obligations/components/ObligationCollectionListCards";
import { ObligationCollectionListTable } from "@/tenant/features/obligations/components/ObligationCollectionListTable";
import type { ObligationCollectionListContentProps } from "@/tenant/features/obligations/components/obligationCollectionListContentShared";
import { Plus, Receipt } from "lucide-react";

export function ObligationCollectionListContent(props: ObligationCollectionListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { collections, search, typeFilter, canWrite, showDeleted, onAddNew } = props;

  return (
    <section aria-label={t("obligations.collectionsList")}>
      {collections.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("obligations.empty.collectionsTitle")}
          description={
            search || typeFilter !== "all"
              ? t("obligations.empty.collectionsFiltered")
              : t("obligations.empty.collectionsNone")
          }
          action={
            !search && typeFilter === "all" && canWrite && !showDeleted ? (
              <Button
                type="button"
                onClick={onAddNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.newCollection")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {props.viewMode === "cards" ? (
            <ObligationCollectionListCards {...props} />
          ) : (
            <ObligationCollectionListTable {...props} />
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">{t("obligations.recordsShown", { count: collections.length })}</p>
    </section>
  );
}
