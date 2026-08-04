import React from "react";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
import {
  formatObligationCollectionAmount,
  getObligationCollectionResolvedFields,
  type ObligationCollectionListContentProps,
} from "@/tenant/features/obligations/components/obligationCollectionListContentShared";

type ObligationCollectionListTableProps = Omit<
  ObligationCollectionListContentProps,
  "search" | "typeFilter" | "onAddNew"
>;

export function ObligationCollectionListTable(props: ObligationCollectionListTableProps): React.JSX.Element {
  const {
    collections,
    selectedIds,
    isColumnVisible,
    allFilteredSelected,
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
    onSelectAll,
    onToggleSelected,
    onDelete,
    onRestore,
    onMessage,
  } = props;
  const { t } = useTranslation();
  const helpers = { getContact, getRep, getMujtahid, getObligationType };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <caption className="sr-only">{t("obligations.collectionsList")}</caption>
        <thead className="bg-muted/60 border-b border-border">
          <tr>
            {canDelete && (
              <th scope="col" className="px-3 py-2.5 w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={(checked) => onSelectAll(checked === true)}
                  aria-label={t("obligations.trash.selectAll")}
                />
              </th>
            )}
            {isColumnVisible("receiptNo") && (
              <ResizableTableHead columnKey="receiptNo" width={getColumnWidth?.("receiptNo")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.receiptNo")}
              </ResizableTableHead>
            )}
            {isColumnVisible("receivedDate") && (
              <ResizableTableHead columnKey="receivedDate" width={getColumnWidth?.("receivedDate")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.receivedDate")}
              </ResizableTableHead>
            )}
            {isColumnVisible("sender") && (
              <ResizableTableHead columnKey="sender" width={getColumnWidth?.("sender")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.sender")}
              </ResizableTableHead>
            )}
            {isColumnVisible("obligationType") && (
              <ResizableTableHead columnKey="obligationType" width={getColumnWidth?.("obligationType")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.obligationType")}
              </ResizableTableHead>
            )}
            {isColumnVisible("repMujtahid") && (
              <ResizableTableHead columnKey="repMujtahid" width={getColumnWidth?.("repMujtahid")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.repMujtahid")}
              </ResizableTableHead>
            )}
            {isColumnVisible("amount") && (
              <ResizableTableHead columnKey="amount" width={getColumnWidth?.("amount")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.amount")}
              </ResizableTableHead>
            )}
            {isColumnVisible("paymentMode") && (
              <ResizableTableHead columnKey="paymentMode" width={getColumnWidth?.("paymentMode")} onResize={onColumnResize} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
                {t("obligations.columns.paymentMode")}
              </ResizableTableHead>
            )}
            <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">
              <span className="sr-only">{t("obligations.columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {collections.map((collection) => {
            const { sender, obligationType, rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);

            return (
              <tr key={collection.id} className="hover:bg-muted/20 transition-colors">
                {canDelete && (
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={selectedIds.includes(collection.id)}
                      onCheckedChange={(checked) => onToggleSelected(collection.id, checked === true)}
                      aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                    />
                  </td>
                )}
                {isColumnVisible("receiptNo") && (
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</span>
                  </td>
                )}
                {isColumnVisible("receivedDate") && (
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(collection.received_date)}</td>
                )}
                {isColumnVisible("sender") && (
                  <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{sender?.name || "—"}</td>
                )}
                {isColumnVisible("obligationType") && (
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{obligationType?.name || "—"}</span>
                  </td>
                )}
                {isColumnVisible("repMujtahid") && (
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    <span>{rep?.name || "—"}</span>
                    {mujtahid && <span className="text-xs block text-muted-foreground/70">{mujtahid.name}</span>}
                  </td>
                )}
                {isColumnVisible("amount") && (
                  <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{formatObligationCollectionAmount(collection)}</td>
                )}
                {isColumnVisible("paymentMode") && (
                  <td className="px-3 py-2.5">
                    <StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" />
                  </td>
                )}
                <td className="px-3 py-2.5 text-end">
                  <ObligationCollectionRowActions
                    collection={collection}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    onView={onView}
                    onPrint={onPrint}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onMessage={onMessage}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
