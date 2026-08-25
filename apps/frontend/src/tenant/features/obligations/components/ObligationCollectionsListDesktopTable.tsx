import React from "react";
import { formatDate } from "@mms/shared";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
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
  const helpers = { getContact, getRep, getMujtahid, getObligationType };

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("obligations.collectionsList")}</caption>
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("receiptNo") ? { id: "receiptNo", label: t("obligations.columns.receiptNo") } : null,
          isColumnVisible("receivedDate") ? { id: "receivedDate", label: t("obligations.columns.receivedDate") } : null,
          isColumnVisible("sender") ? { id: "sender", label: t("obligations.columns.sender") } : null,
          isColumnVisible("obligationType") ? { id: "obligationType", label: t("obligations.columns.obligationType") } : null,
          isColumnVisible("repMujtahid") ? { id: "repMujtahid", label: t("obligations.columns.repMujtahid") } : null,
          isColumnVisible("amount") ? { id: "amount", label: t("obligations.columns.amount") } : null,
          isColumnVisible("paymentMode") ? { id: "paymentMode", label: t("obligations.columns.paymentMode") } : null,
        ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canDelete ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("obligations.trash.selectAll")
        } : undefined}
        actionsLabel={t("obligations.table.actions")}
      />
      <TableBody className="divide-y divide-border">
        {collections.map((collection) => {
          const { sender, obligationType, rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);

          return (
            <TableRow key={collection.id} className="group hover:bg-muted/20 transition-colors">
              {canDelete && (
                <TableCell className="px-3 py-2.5 w-10">
                  <div className="flex justify-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(collection.id)}
                      onChange={(e) => onToggleSelectedCollection(collection.id, e.target.checked)}
                      aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                      className="cursor-pointer"
                    />
                  </div>
                </TableCell>
              )}
              {isColumnVisible("receiptNo") && (
                <TableCell className="px-3 py-2.5">
                  <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
                </TableCell>
              )}
              {isColumnVisible("receivedDate") && (
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(collection.received_date)}</TableCell>
              )}
              {isColumnVisible("sender") && (
                <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</TableCell>
              )}
              {isColumnVisible("obligationType") && (
                <TableCell className="px-3 py-2.5">
                  <Badge as="span" pill tone="primary" className="px-2 font-bold">{obligationType?.name || "—"}</Badge>
                </TableCell>
              )}
              {isColumnVisible("repMujtahid") && (
                <TableCell className="px-3 py-2.5 text-xs text-muted-foreground">
                  <span>{rep?.name || "—"}</span>
                  {mujtahid && <span className="text-xs block text-muted-foreground/70">{mujtahid.name}</span>}
                </TableCell>
              )}
              {isColumnVisible("amount") && (
                <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{formatObligationCollectionAmount(collection)}</TableCell>
              )}
              {isColumnVisible("paymentMode") && (
                <TableCell className="px-3 py-2.5">
                  <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
                </TableCell>
              )}
              <TableCell className="px-3 py-2.5 text-end">
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
