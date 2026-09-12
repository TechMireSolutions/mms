import React from "react";
import { Printer } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work";
import type { ObligationCollection } from "@/lib/data/obligationsData";
import {
  formatObligationCollectionAmount,
  getObligationCollectionResolvedFields,
  type ObligationCollectionListContentProps,
} from "@/tenant/features/obligations/components/obligationCollectionListContentShared";

type ObligationCollectionsListDesktopTableProps = Omit<
  ObligationCollectionListContentProps,
  "search" | "typeFilter" | "onAddNew"
>;

export function ObligationCollectionsListDesktopTable(props: ObligationCollectionsListDesktopTableProps): React.JSX.Element {
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
    getColumnWidth,
    onColumnResize,
    onView,
    onPrint,
    onToggleSelectAll,
    onToggleSelectedCollection,
    onTrashAction,
    onMessage,
  } = props;
  const { t } = useTranslation();
  const helpers = React.useMemo(() => ({ getContact, getRep, getMujtahid, getObligationType }), [getContact, getRep, getMujtahid, getObligationType]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const columns = React.useMemo<WorkBatchTableColumn<ObligationCollection>[]>(() => {
    const cols: WorkBatchTableColumn<ObligationCollection>[] = [];

    if (isColumnVisible("receiptNo")) {
      cols.push({
        id: "receiptNo",
        label: t("obligations.columns.receiptNo"),
        render: (collection) => (
          <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
        ),
      });
    }

    if (isColumnVisible("receivedDate")) {
      cols.push({
        id: "receivedDate",
        label: t("obligations.columns.receivedDate"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (collection) => formatDate(collection.received_date),
      });
    }

    if (isColumnVisible("sender")) {
      cols.push({
        id: "sender",
        label: t("obligations.columns.sender"),
        cellClassName: "font-semibold text-foreground whitespace-nowrap",
        render: (collection) => {
          const { sender } = getObligationCollectionResolvedFields(collection, helpers);
          return sender?.name || "—";
        },
      });
    }

    if (isColumnVisible("obligationType")) {
      cols.push({
        id: "obligationType",
        label: t("obligations.columns.obligationType"),
        render: (collection) => {
          const { obligationType } = getObligationCollectionResolvedFields(collection, helpers);
          return (
            <Badge as="span" pill tone="primary" className="px-2 font-bold">
              {obligationType?.name || "—"}
            </Badge>
          );
        },
      });
    }

    if (isColumnVisible("repMujtahid")) {
      cols.push({
        id: "repMujtahid",
        label: t("obligations.columns.repMujtahid"),
        cellClassName: "text-xs text-muted-foreground",
        render: (collection) => {
          const { rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);
          return (
            <>
              <span>{rep?.name || "—"}</span>
              {mujtahid && <span className="text-xs block text-muted-foreground/70">{mujtahid.name}</span>}
            </>
          );
        },
      });
    }

    if (isColumnVisible("amount")) {
      cols.push({
        id: "amount",
        label: t("obligations.columns.amount"),
        cellClassName: "font-semibold text-foreground whitespace-nowrap",
        render: (collection) => formatObligationCollectionAmount(collection),
      });
    }

    if (isColumnVisible("paymentMode")) {
      cols.push({
        id: "paymentMode",
        label: t("obligations.columns.paymentMode"),
        render: (collection) => (
          <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
        ),
      });
    }

    return cols;
  }, [helpers, isColumnVisible, paymentModeConfig, t]);

  return (
    <WorkBatchTable
      data={collections}
      columns={columns}
      caption={t("obligations.collectionsList")}
      className="table-fixed"
      bordered={false}
      selection={
        canDelete
          ? {
              selectedIds,
              onSelectOne: (id) => onToggleSelectedCollection(String(id), !selectedSet.has(String(id))),
              onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              selectAllAriaLabel: t("obligations.trash.selectAll"),
              selectRowAriaLabel: (collection) =>
                t("obligations.trash.selectCollection", { receipt: collection.receipt_no }),
            }
          : undefined
      }
      columnResize={{
        getColumnWidth: (key) => getColumnWidth?.(key),
        onColumnResize,
      }}
      renderRowActions={(collection) => (
        <div className="flex items-center gap-1 justify-end">
          {!showDeleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPrint(collection)}
              aria-label={t("obligations.actions.printShort")}
              title={t("obligations.actions.printShort")}
            >
              <Printer className="w-4 h-4" />
            </Button>
          )}
          <ObligationCollectionRowActions
            collection={collection}
            canWrite={canWrite}
            canDelete={canDelete}
            showDeleted={showDeleted}
            onView={onView}
            onPrint={onPrint}
            onMessage={onMessage}
            onTrashAction={onTrashAction}
            triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
          />
        </div>
      )}
      actionsLabel={t("obligations.table.actions")}
    />
  );
}
