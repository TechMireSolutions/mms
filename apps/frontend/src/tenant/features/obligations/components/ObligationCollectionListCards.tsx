import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionRowActions } from "@/tenant/features/obligations/components/ObligationCollectionRowActions";
import {
  formatObligationCollectionAmount,
  getObligationCollectionResolvedFields,
  type ObligationCollectionListContentProps,
} from "@/tenant/features/obligations/components/obligationCollectionListContentShared";

type ObligationCollectionListCardsProps = Omit<
  ObligationCollectionListContentProps,
  "search" | "typeFilter" | "allFilteredSelected" | "onAddNew" | "getColumnWidth" | "onColumnResize" | "onSelectAll"
>;

export function ObligationCollectionListCards(props: ObligationCollectionListCardsProps): React.JSX.Element {
  const {
    collections,
    selectedIds,
    visibleColumns,
    canDelete,
    showDeleted,
    paymentModeConfig,
    getContact,
    getRep,
    getMujtahid,
    getObligationType,
    onView,
    onPrint,
    onToggleSelected,
    onDelete,
    onRestore,
    onMessage,
  } = props;
  const { t } = useTranslation();
  const helpers = { getContact, getRep, getMujtahid, getObligationType };

  return (
    <div className="space-y-3 p-3">
      {collections.map((collection, index) => {
        const { sender, obligationType, rep, mujtahid } = getObligationCollectionResolvedFields(collection, helpers);
        const isSelected = selectedIds.includes(collection.id);

        return (
          <motion.article
            key={collection.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`space-y-3 rounded-xl border border-border bg-card p-3 ${isSelected ? "ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {visibleColumns.receiptNo && (
                  <p className="font-mono text-xs font-bold text-primary">{collection.receipt_no}</p>
                )}
                {visibleColumns.sender && (
                  <p className="truncate text-sm font-semibold text-foreground">{sender?.name || "—"}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {visibleColumns.amount && (
                  <span className="text-sm font-bold text-foreground">
                    {formatObligationCollectionAmount(collection)}
                  </span>
                )}
                {canDelete && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelected(collection.id, checked === true)}
                    aria-label={t("obligations.trash.selectCollection", { receipt: collection.receipt_no })}
                  />
                )}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {visibleColumns.receivedDate && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.receivedDate")}</dt>
                  <dd className="text-foreground">{formatDate(collection.received_date)}</dd>
                </div>
              )}
              {visibleColumns.obligationType && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.obligationType")}</dt>
                  <dd>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                      {obligationType?.name || "—"}
                    </span>
                  </dd>
                </div>
              )}
              {visibleColumns.repMujtahid && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.columns.repMujtahid")}</dt>
                  <dd className="text-foreground">
                    <span>{rep?.name || "—"}</span>
                    {mujtahid && <span className="block text-xs text-muted-foreground/70">{mujtahid.name}</span>}
                  </dd>
                </div>
              )}
              {visibleColumns.paymentMode && (
                <div>
                  <dt className="mb-1 text-xs font-semibold text-muted-foreground">{t("obligations.columns.paymentMode")}</dt>
                  <dd><StatusBadge status={collection.payment_mode} config={paymentModeConfig} size="sm" /></dd>
                </div>
              )}
            </dl>
            <div className="border-t border-border pt-2">
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
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
