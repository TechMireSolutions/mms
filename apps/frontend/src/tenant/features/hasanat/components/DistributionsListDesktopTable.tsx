import type React from "react";
import { motion } from "framer-motion";
import { User, Users2 } from "lucide-react";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import {
  Table,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { DistributionsRowActions } from "@/tenant/features/hasanat/components/DistributionsRowActions";
import {
  getDistributionDenomination,
  getDistributionStatuses,
  type DistributionsListContentProps,
} from "@/tenant/features/hasanat/components/distributionsListShared";

type DistributionsListDesktopTableProps = DistributionsListContentProps;

export function DistributionsListDesktopTable(props: DistributionsListDesktopTableProps): React.JSX.Element {
  const {
    distributions,
    denoms,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    isColumnVisible,
    statusLabels,
    statusConfig,
    canWrite,
    canDelete,
    showDeleted,
    canRestoreRows,
    canDeleteRows,
    onMessage,
    onChangeStatus,
    onToggleSelectedDistribution,
    onToggleSelectAll,
    onTrashAction,
    getColumnWidth,
    onColumnResize,
  } = props;
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ fade: true, duration: 0.1 });
  const statuses = getDistributionStatuses(statusConfig);

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("hasanat.distribution.aria")}</caption>
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("card") ? { id: "card", label: t("hasanat.columns.distribution.card") } : null,
          isColumnVisible("recipient") ? { id: "recipient", label: t("hasanat.columns.distribution.recipient") } : null,
          isColumnVisible("recipientClass") ? { id: "recipientClass", label: t("hasanat.columns.distribution.recipientClass") } : null,
          isColumnVisible("quantity") ? { id: "quantity", label: t("hasanat.columns.distribution.quantity") } : null,
          isColumnVisible("reason") ? { id: "reason", label: t("hasanat.columns.distribution.reason") } : null,
          isColumnVisible("issuedDate") ? { id: "issuedDate", label: t("hasanat.columns.distribution.issuedDate") } : null,
          isColumnVisible("issuedBy") ? { id: "issuedBy", label: t("hasanat.columns.distribution.issuedBy") } : null,
          isColumnVisible("status") ? { id: "status", label: t("hasanat.columns.distribution.status") } : null,
        ].filter((c): c is { id: string; label: string; headerClassName?: string } => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canDelete ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("hasanat.trash.selectAll")
        } : undefined}
        actionsLabel={t("hasanat.columns.actions")}
      />
      <TableBody className="divide-y divide-border/50">
        {distributions.map((distribution, index) => {
          const denomination = getDistributionDenomination(denoms, distribution.denominationId);
          return (
            <motion.tr key={distribution.id} {...rowMotion(index * 0.03)} className="hover:bg-muted/20 transition-colors group">
              {canDelete && (
                <TableCell className="px-3 py-3 w-10">
                  <div className="flex justify-center">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(distribution.id)}
                      onChange={(e) => onToggleSelectedDistribution(distribution.id, e.target.checked)}
                      aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                      className="cursor-pointer"
                    />
                  </div>
                </TableCell>
              )}
              {isColumnVisible("card") && (
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{distribution.denominationName}</p>
                      {denomination && <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>{t("hasanat.form.pointsShort", { points: denomination.points })}</p>}
                    </div>
                  </div>
                </TableCell>
              )}
              {isColumnVisible("recipient") && (
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {distribution.recipientType === "faculty" ? <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> : <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{distribution.recipientName}</span>
                  </div>
                </TableCell>
              )}
              {isColumnVisible("recipientClass") && (
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">{distribution.recipientClass || "—"}</TableCell>
              )}
              {isColumnVisible("quantity") && (
                <TableCell className="px-4 py-3">
                  <span className="text-sm font-bold text-foreground">{distribution.quantity}</span>
                </TableCell>
              )}
              {isColumnVisible("reason") && (
                <TableCell className="px-4 py-3 max-w-cell-sm">
                  <p className="text-sm text-muted-foreground truncate m-0">{distribution.reason}</p>
                </TableCell>
              )}
              {isColumnVisible("issuedDate") && (
                <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{distribution.issuedDate}</TableCell>
              )}
              {isColumnVisible("issuedBy") && (
                <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{distribution.issuedBy || "—"}</TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-4 py-3">
                  <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                </TableCell>
              )}
              <TableCell className="px-4 py-3 text-end">
                <DistributionsRowActions
                  distribution={distribution}
                  statuses={statuses}
                  statusLabels={statusLabels}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  showDeleted={showDeleted}
                  canRestoreRows={canRestoreRows}
                  canDeleteRows={canDeleteRows}
                  triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
                  onMessage={
                    onMessage
                      ? (channel, dist) => onMessage(channel, [dist])
                      : undefined
                  }
                  onChangeStatus={onChangeStatus}
                  onTrashAction={onTrashAction}
                />
              </TableCell>
            </motion.tr>
          );
        })}
      </TableBody>
    </Table>
  );
}
