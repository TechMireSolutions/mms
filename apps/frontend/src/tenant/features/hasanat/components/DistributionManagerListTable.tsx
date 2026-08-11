import type React from "react";
import { motion } from "framer-motion";
import { User, Users2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { DistributionRowActions } from "@/tenant/features/hasanat/components/DistributionRowActions";
import {
  getDistributionDenomination,
  getDistributionStatuses,
  type DistributionManagerListProps,
} from "@/tenant/features/hasanat/components/distributionManagerListShared";

type DistributionManagerListTableProps = DistributionManagerListProps;

export function DistributionManagerListTable(props: DistributionManagerListTableProps): React.JSX.Element {
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
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
          {canDelete && (
            <TableHead className="px-3 py-2.5 w-10 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("hasanat.trash.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("card") && (
            <ModuleTableHeaderCell columnKey="card" width={getColumnWidth?.("card")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.card")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("recipient") && (
            <ModuleTableHeaderCell columnKey="recipient" width={getColumnWidth?.("recipient")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.recipient")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("recipientClass") && (
            <ModuleTableHeaderCell columnKey="recipientClass" width={getColumnWidth?.("recipientClass")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.recipientClass")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("quantity") && (
            <ModuleTableHeaderCell columnKey="quantity" width={getColumnWidth?.("quantity")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.quantity")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("reason") && (
            <ModuleTableHeaderCell columnKey="reason" width={getColumnWidth?.("reason")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.reason")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("issuedDate") && (
            <ModuleTableHeaderCell columnKey="issuedDate" width={getColumnWidth?.("issuedDate")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.issuedDate")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("issuedBy") && (
            <ModuleTableHeaderCell columnKey="issuedBy" width={getColumnWidth?.("issuedBy")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.issuedBy")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("hasanat.columns.distribution.status")}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-4 py-2.5 text-end h-auto">
            <span className="sr-only">{t("hasanat.columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/50">
        {distributions.map((distribution, index) => {
          const denomination = getDistributionDenomination(denoms, distribution.denominationId);
          return (
            <motion.tr key={distribution.id} {...rowMotion(index * 0.03)} className="hover:bg-muted/20 transition-colors group">
              {canDelete && (
                <TableCell className="px-3 py-3">
                  <Checkbox
                    checked={selectedIds.includes(distribution.id)}
                    onCheckedChange={(checked) => onToggleSelectedDistribution(distribution.id, checked === true)}
                    aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                  />
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
                <TableCell className="px-4 py-3 max-w-[10rem]">
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
                <DistributionRowActions
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
