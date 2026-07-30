import React from "react";
import { motion } from "framer-motion";
import { User, Users2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributionRowActions } from "@/tenant/features/hasanat/components/DistributionRowActions";
import {
  getDistributionDenomination,
  getDistributionStatuses,
  type DistributionManagerListProps,
} from "@/tenant/features/hasanat/components/distributionManagerListShared";

type DistributionManagerListCardsProps = Omit<
  DistributionManagerListProps,
  "allFilteredSelected" | "getColumnWidth" | "onColumnResize" | "onToggleAll"
>;

export function DistributionManagerListCards(props: DistributionManagerListCardsProps): React.JSX.Element {
  const {
    distributions,
    denoms,
    selectedIds,
    visibleColumns,
    statusLabels,
    statusConfig,
    canWrite,
    canDelete,
    showDeleted,
    canRestoreRows,
    canDeleteRows,
    onMessage,
    onChangeStatus,
    onToggleSelected,
    onRowTrashAction,
  } = props;
  const { t } = useTranslation();
  const statuses = getDistributionStatuses(statusConfig);

  return (
    <div className="space-y-3 p-3 md:hidden">
      {distributions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</p>
      ) : (
        distributions.map((distribution, index) => {
          const denomination = getDistributionDenomination(denoms, distribution.denominationId);
          return (
            <motion.article
              key={distribution.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  {visibleColumns.recipient && (
                    <div className="flex items-center gap-1.5">
                      {distribution.recipientType === "faculty"
                        ? <Users2 className="w-3 h-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                        : <User className="w-3 h-3 shrink-0 text-muted-foreground" aria-hidden="true" />}
                      <h4 className="min-w-0 truncate text-sm font-semibold text-foreground">{distribution.recipientName}</h4>
                    </div>
                  )}
                  {visibleColumns.card && (
                    <div className={`flex items-center gap-2 ${visibleColumns.recipient ? "mt-1" : ""}`}>
                      <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                      <div className="min-w-0">
                        {!visibleColumns.recipient && (
                          <h4 className="truncate text-sm font-semibold text-foreground">{distribution.denominationName}</h4>
                        )}
                        {visibleColumns.recipient && (
                          <p className="truncate text-xs text-muted-foreground">{distribution.denominationName}</p>
                        )}
                        {denomination && (
                          <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>
                            {t("hasanat.form.pointsShort", { points: denomination.points })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {visibleColumns.status && (
                  <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                )}
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {visibleColumns.recipientClass && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.recipientClass")}</dt>
                    <dd className="text-foreground">{distribution.recipientClass || "—"}</dd>
                  </div>
                )}
                {visibleColumns.quantity && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.quantity")}</dt>
                    <dd className="font-bold text-foreground">{distribution.quantity}</dd>
                  </div>
                )}
                {visibleColumns.reason && (
                  <div className={visibleColumns.recipientClass || visibleColumns.quantity ? "" : "sm:col-span-2"}>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.reason")}</dt>
                    <dd className="break-words text-foreground">{distribution.reason || "—"}</dd>
                  </div>
                )}
                {visibleColumns.issuedDate && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.issuedDate")}</dt>
                    <dd className="text-foreground">{distribution.issuedDate}</dd>
                  </div>
                )}
                {visibleColumns.issuedBy && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.issuedBy")}</dt>
                    <dd className="break-words text-foreground">{distribution.issuedBy || "—"}</dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                {canDelete ? (
                  <Checkbox
                    checked={selectedIds.includes(distribution.id)}
                    onCheckedChange={() => onToggleSelected(distribution.id)}
                    aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                  />
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap items-center gap-1">
                  <DistributionRowActions
                    distribution={distribution}
                    statuses={statuses}
                    statusLabels={statusLabels}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    canRestoreRows={canRestoreRows}
                    canDeleteRows={canDeleteRows}
                    onMessage={onMessage}
                    onChangeStatus={onChangeStatus}
                    onRowTrashAction={onRowTrashAction}
                  />
                </div>
              </div>
            </motion.article>
          );
        })
      )}
    </div>
  );
}
