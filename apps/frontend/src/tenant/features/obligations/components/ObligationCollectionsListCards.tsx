import React from "react";
import { formatDate } from "@mms/shared";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
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

export function ObligationCollectionsListCards(props: ObligationCollectionListCardsProps): React.JSX.Element {
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
    <ModuleDirectoryCards
      items={collections}
      selectedIds={selectedIds}
      onSelectAll={canDelete ? () => onToggleSelectAll(!allVisibleSelected) : undefined}
      allSelected={allVisibleSelected}
      someSelected={someVisibleSelected}
      selectAllLabel={t("obligations.trash.selectAll")}
      deselectAllLabel={t("common.deselect")}
      selectedCountLabel={t("obligations.trash.selected", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="obligations-select-cards"
      renderItem={(collection) => {
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

            <StatGrid columns="sm2" className="ms-1">
              {isColumnVisible("receivedDate") && (
                <StatRow label={t("obligations.columns.receivedDate")} value={formatDate(collection.received_date)} />
              )}
              {isColumnVisible("obligationType") && (
                <StatRow
                  label={t("obligations.columns.obligationType")}
                  value={<Badge pill tone="primary" className="px-2 font-bold">{obligationType?.name || "—"}</Badge>}
                  dtClassName="mb-1"
                />
              )}
              {isColumnVisible("repMujtahid") && (
                <StatRow
                  label={t("obligations.columns.repMujtahid")}
                  value={
                    <>
                      <span>{rep?.name || "—"}</span>
                      {mujtahid && <span className="block text-xs text-muted-foreground/70">{mujtahid.name}</span>}
                    </>
                  }
                />
              )}
              {isColumnVisible("amount") && (
                <StatRow
                  label={t("obligations.columns.amount")}
                  value={formatObligationCollectionAmount(collection)}
                  ddClassName="font-semibold"
                />
              )}
              {isColumnVisible("paymentMode") && (
                <StatRow
                  label={t("obligations.columns.paymentMode")}
                  value={<StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />}
                  dtClassName="mb-1"
                />
              )}
            </StatGrid>

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
      }}
    />
  );
}
