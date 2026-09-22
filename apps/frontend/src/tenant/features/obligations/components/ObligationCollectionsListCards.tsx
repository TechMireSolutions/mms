import React from "react";
import { Printer } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
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

function ObligationCollectionCard({
  collection,
  props,
  reducedMotion,
}: {
  collection: ObligationCollectionListCardsProps["collections"][number];
  props: ObligationCollectionListCardsProps;
  reducedMotion: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    selectedIds,
    isColumnVisible,
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
    onToggleSelectAll: _onToggleSelectAll,
    onToggleSelectedCollection,
    onTrashAction,
    onMessage,
  } = props;

  const helpers = { getContact, getRep, getMujtahid, getObligationType };
  const { sender, obligationType, rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);

  const { isSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: collection,
    selectedIds,
    onToggleSelected: onToggleSelectedCollection,
    onView,
    canSelect: canDelete,
  });

  return (
    <DirectoryEntityCard
      key={collection.id}
      isSelected={isSelected}
      reducedMotion={reducedMotion}
      {...cardProps}
    >
      <DirectoryCardHeader
        id={collection.id}
        displayName={sender?.name || "—"}
        isSelected={isSelected}
        showSelect={canDelete}
        onSelect={onSelect}
        selectAriaLabel={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
        onView={handleView}
        viewAriaLabel={t("obligations.actions.view", { receipt: collection.receipt_no })}
        reducedMotion={reducedMotion}
        subtitle={
          isColumnVisible("receiptNo") ? (
            <p className="mt-0.5 truncate font-mono text-xs font-bold text-primary">{collection.receipt_no}</p>
          ) : undefined
        }
      />

      <DirectoryCardMetaGrid>
        {isColumnVisible("receivedDate") && (
          <DirectoryCardMetaTile label={t("obligations.columns.receivedDate")}>
            {formatDate(collection.received_date)}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("obligationType") && (
          <DirectoryCardMetaTile label={t("obligations.columns.obligationType")}>
            <Badge pill tone="primary" className="px-2 font-bold">{obligationType?.name || "—"}</Badge>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("repMujtahid") && (
          <DirectoryCardMetaTile label={t("obligations.columns.repMujtahid")}>
            <span>{rep?.name || "—"}</span>
            {mujtahid && (
              <span className="block text-xs text-muted-foreground">{mujtahid.name}</span>
            )}
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("amount") && (
          <DirectoryCardMetaTile label={t("obligations.columns.amount")}>
            <span className="font-semibold">{formatObligationCollectionAmount(collection)}</span>
          </DirectoryCardMetaTile>
        )}
        {isColumnVisible("paymentMode") && (
          <DirectoryCardMetaTile label={t("obligations.columns.paymentMode")}>
            <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
          </DirectoryCardMetaTile>
        )}
      </DirectoryCardMetaGrid>

      <DirectoryCardFooterActions
        onView={handleView}
        viewLabel={t("obligations.actions.viewShort")}
        viewAriaLabel={t("obligations.actions.view", { receipt: collection.receipt_no })}
        actions={
          !showDeleted ? (
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={() => onPrint(collection)}
              aria-label={t("obligations.actions.printShort")}
              title={t("obligations.actions.printShort")}
            >
              <Printer className="w-4 h-4" />
            </Button>
          ) : null
        }
        overflowActions={
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
        }
      />
    </DirectoryEntityCard>
  );
}

export function ObligationCollectionsListCards(props: ObligationCollectionListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { collections, selectedIds, canDelete, allVisibleSelected, someVisibleSelected, onToggleSelectAll } = props;

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
      renderItem={(collection) => (
        <ObligationCollectionCard
          key={collection.id}
          collection={collection}
          props={props}
          reducedMotion={reducedMotion}
        />
      )}
    />
  );
}
