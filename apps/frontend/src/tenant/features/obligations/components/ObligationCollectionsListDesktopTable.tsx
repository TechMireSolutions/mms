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
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import {
  formatObligationCollectionAmount,
  getObligationCollectionResolvedFields,
  OBLIGATION_COLLECTION_CURRENCIES,
  type ObligationCollectionListContentProps,
} from "@/tenant/features/obligations/components/obligationCollectionListContentShared";

type ObligationCollectionsListDesktopTableProps = Omit<
  ObligationCollectionListContentProps,
  "search" | "typeFilter" | "onAddNew"
>;

export function ObligationCollectionsListDesktopTable(props: ObligationCollectionsListDesktopTableProps): React.JSX.Element {
  const {
    collections, selectedIds, isColumnVisible, allVisibleSelected, someVisibleSelected,
    canWrite, canDelete, showDeleted, paymentModeConfig, getContact, getRep, getMujtahid,
    getObligationType, getColumnWidth, onColumnResize, onView, onPrint, onToggleSelectAll,
    onToggleSelectedCollection, onTrashAction, onMessage,
  } = props;
  const { t } = useTranslation();
  const helpers = React.useMemo(() => ({ getContact, getRep, getMujtahid, getObligationType }), [getContact, getRep, getMujtahid, getObligationType]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const receiverIds = React.useMemo(() => collections.map((c) => c.received_by).filter(Boolean), [collections]);
  const users = useMergedObligationUsers(receiverIds);
  const userMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      map.set(String(u.id), u.name || u.loginEmail || String(u.id));
    }
    return map;
  }, [users]);

  const columns = React.useMemo<WorkBatchTableColumn<ObligationCollection>[]>(() => {
    const cols: WorkBatchTableColumn<ObligationCollection>[] = [];

    if (isColumnVisible("receiptNo")) {
      cols.push({
        id: "receiptNo",
        label: t("obligations.columns.receiptNo"),
        render: (c) => <span className="font-mono text-xs font-bold text-primary">{c.receipt_no}</span>,
      });
    }
    if (isColumnVisible("receivedDate")) {
      cols.push({
        id: "receivedDate",
        label: t("obligations.columns.receivedDate"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (c) => formatDate(c.received_date),
      });
    }
    if (isColumnVisible("sender")) {
      cols.push({
        id: "sender",
        label: t("obligations.columns.sender"),
        cellClassName: "font-semibold text-foreground",
        render: (c) => getObligationCollectionResolvedFields(c, helpers).sender?.name || "—",
      });
    }
    if (isColumnVisible("obligationType")) {
      cols.push({
        id: "obligationType",
        label: t("obligations.columns.obligationType"),
        render: (c) => (
          <Badge as="span" pill tone="primary" className="px-2 font-bold">
            {getObligationCollectionResolvedFields(c, helpers).obligationType?.name || "—"}
          </Badge>
        ),
      });
    }
    if (isColumnVisible("repMujtahid")) {
      cols.push({
        id: "repMujtahid",
        label: t("obligations.columns.repMujtahid"),
        cellClassName: "text-xs text-muted-foreground",
        render: (c) => {
          const { rep, mujtahid } = getObligationCollectionResolvedFields(c, helpers);
          return (
            <>
              <span>{rep?.name || "—"}</span>
              {mujtahid && <span className="text-xs block text-muted-foreground">{mujtahid.name}</span>}
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
        render: (c) => formatObligationCollectionAmount(c),
      });
    }
    if (isColumnVisible("paymentMode")) {
      cols.push({
        id: "paymentMode",
        label: t("obligations.columns.paymentMode"),
        render: (c) => <StatusBadge status={c.payment_mode} config={paymentModeConfig} size="sm" />,
      });
    }
    if (isColumnVisible("reference")) {
      cols.push({
        id: "reference",
        label: t("obligations.columns.reference"),
        cellClassName: "text-sm text-muted-foreground whitespace-nowrap",
        render: (c) => getContact(c.reference_id)?.name || "—",
      });
    }
    if (isColumnVisible("currency")) {
      cols.push({
        id: "currency",
        label: t("obligations.columns.currency"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (c) => OBLIGATION_COLLECTION_CURRENCIES.find((curr) => curr.id === c.currency_id)?.code || c.currency_id || "—",
      });
    }
    if (isColumnVisible("receivedBy")) {
      cols.push({
        id: "receivedBy",
        label: t("obligations.columns.receivedBy"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (c) => (c.received_by ? userMap.get(String(c.received_by)) || c.received_by : "—"),
      });
    }
    return cols;
  }, [getContact, helpers, isColumnVisible, paymentModeConfig, t, userMap]);

  return (
    <WorkBatchTable
      data={collections}
      columns={columns}
      caption={t("obligations.collectionsList")}
      bordered={false}
      selection={
        canDelete ? {
          selectedIds,
          onSelectOne: (id) => onToggleSelectedCollection(String(id), !selectedSet.has(String(id))),
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          selectAllAriaLabel: t("obligations.trash.selectAll"),
          selectRowAriaLabel: (c) => t("obligations.trash.selectCollection", { receipt: c.receipt_no }),
        } : undefined
      }
      columnResize={{ getColumnWidth: (key) => getColumnWidth?.(key), onColumnResize }}
      actionsHeaderClassName="w-24 min-w-24 text-end px-3 py-3"
      actionsCellClassName="w-24 min-w-24 text-end px-3 py-3"
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
      actionsLabel={t("common.actions")}
    />
  );
}
