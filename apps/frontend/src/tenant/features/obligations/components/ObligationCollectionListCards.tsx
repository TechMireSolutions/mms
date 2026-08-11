import React from "react";
import { formatDate } from "@mms/shared";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
import {
  formatObligationCollectionAmount,
  getObligationCollectionResolvedFields,
  type ObligationCollectionListContentProps,
} from "@/tenant/features/obligations/components/obligationCollectionListContentShared";

type ObligationCollectionListCardsProps = Omit<
  ObligationCollectionListContentProps,
  "search" | "typeFilter" | "onAddNew" | "getColumnWidth" | "onColumnResize"
>;

export function ObligationCollectionListCards(props: ObligationCollectionListCardsProps): React.JSX.Element {
  const {
    collections,
    selectedIds,
    isColumnVisible,
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    showDeleted,
    paymentModeConfig,
    getContact,
    getRep,
    getMujtahid,
    getObligationType,
    onView,
    onPrint,
    onToggleSelectAll,
    onToggleSelectedCollection,
    onTrashAction,
    onMessage,
  } = props;
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const helpers = { getContact, getRep, getMujtahid, getObligationType };

  const pageCountLabel = formatDirectoryPageCountLabel(collections.length, t, {
    singular: "obligations.item.collection",
    plural: "obligations.item.collections",
  });

  return (
    <>
      {canDelete && collections.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="obligations-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t("obligations.trash.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("obligations.trash.selected", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {collections.map((collection) => {
          const { sender, obligationType, rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);
          const isSelected = selectedIds.includes(collection.id);

          return (
            <DirectoryEntityCard key={collection.id} isSelected={isSelected} reducedMotion={reducedMotion}>
              <DirectoryCardHeader
                id={collection.id}
                displayName={sender?.name || "—"}
                isSelected={isSelected}
                showSelect={canDelete}
                onSelect={() => onToggleSelectedCollection(collection.id, !isSelected)}
                selectAriaLabel={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                onView={() => onView(collection)}
                viewAriaLabel={t("obligations.actions.view", { receipt: collection.receipt_no })}
                reducedMotion={reducedMotion}
                subtitle={
                  isColumnVisible("receiptNo") ? (
                    <p className="mt-0.5 truncate font-mono text-xs font-bold text-primary">{collection.receipt_no}</p>
                  ) : undefined
                }
              />

              <dl className="ms-1 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {isColumnVisible("receivedDate") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.receivedDate")}</dt>
                    <dd className="text-foreground">{formatDate(collection.received_date)}</dd>
                  </div>
                )}
                {isColumnVisible("obligationType") && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.obligationType")}</dt>
                    <dd>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                        {obligationType?.name || "—"}
                      </span>
                    </dd>
                  </div>
                )}
                {isColumnVisible("repMujtahid") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.repMujtahid")}</dt>
                    <dd className="text-foreground">
                      <span>{rep?.name || "—"}</span>
                      {mujtahid && <span className="block text-xs text-muted-foreground/70">{mujtahid.name}</span>}
                    </dd>
                  </div>
                )}
                {isColumnVisible("amount") && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.amount")}</dt>
                    <dd className="font-semibold text-foreground">{formatObligationCollectionAmount(collection)}</dd>
                  </div>
                )}
                {isColumnVisible("paymentMode") && (
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.paymentMode")}</dt>
                    <dd><StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" /></dd>
                  </div>
                )}
              </dl>

              <DirectoryCardFooter
                trailing={
                  <>
                    <DirectoryCardViewButton
                      label={t("obligations.actions.viewShort")}
                      ariaLabel={t("obligations.actions.view", { receipt: collection.receipt_no })}
                      onClick={() => onView(collection)}
                    />
                    <ObligationCollectionRowActions
                      collection={collection}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      showDeleted={showDeleted}
                      hideViewItem
                      onView={onView}
                      onPrint={onPrint}
                      onMessage={onMessage}
                      onTrashAction={onTrashAction}
                      triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
                    />
                  </>
                }
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
