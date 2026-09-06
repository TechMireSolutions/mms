import React from "react";
import { User, Users2 } from "lucide-react";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { DistributionsRowActions } from "@/tenant/features/hasanat/components/DistributionsRowActions";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work";
import type { Distribution } from "@/lib/data/hasanatData";
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
    onRowClick,
  } = props;
  const { t } = useTranslation();
  const statuses = React.useMemo(() => getDistributionStatuses(statusConfig), [statusConfig]);
  const denomsById = React.useMemo(() => {
    const map = new Map<string, (typeof denoms)[number]>();
    for (const d of denoms) {
      map.set(d.id, d);
    }
    return map;
  }, [denoms]);
  const selectedIdsSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const columns = React.useMemo<WorkBatchTableColumn<Distribution>[]>(() => {
    const cols: WorkBatchTableColumn<Distribution>[] = [];

    if (isColumnVisible("card")) {
      cols.push({
        id: "card",
        label: t("hasanat.columns.distribution.card"),
        render: (distribution) => {
          const denomination = getDistributionDenomination(denomsById, distribution.denominationId);
          return (
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
              <div>
                <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{distribution.denominationName}</p>
                {denomination && (
                  <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>
                    {t("hasanat.form.pointsShort", { points: denomination.points })}
                  </p>
                )}
              </div>
            </div>
          );
        },
      });
    }

    if (isColumnVisible("recipient")) {
      cols.push({
        id: "recipient",
        label: t("hasanat.columns.distribution.recipient"),
        render: (distribution) => (
          <div className="flex items-center gap-1.5">
            {distribution.recipientType === "faculty" ? (
              <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            ) : (
              <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{distribution.recipientName}</span>
          </div>
        ),
      });
    }

    if (isColumnVisible("recipientClass")) {
      cols.push({
        id: "recipientClass",
        label: t("hasanat.columns.distribution.recipientClass"),
        cellClassName: "text-sm text-muted-foreground",
        render: (distribution) => distribution.recipientClass || "—",
      });
    }

    if (isColumnVisible("quantity")) {
      cols.push({
        id: "quantity",
        label: t("hasanat.columns.distribution.quantity"),
        render: (distribution) => <span className="text-sm font-bold text-foreground">{distribution.quantity}</span>,
      });
    }

    if (isColumnVisible("reason")) {
      cols.push({
        id: "reason",
        label: t("hasanat.columns.distribution.reason"),
        cellClassName: "max-w-cell-sm",
        render: (distribution) => <p className="text-sm text-muted-foreground truncate m-0">{distribution.reason}</p>,
      });
    }

    if (isColumnVisible("issuedDate")) {
      cols.push({
        id: "issuedDate",
        label: t("hasanat.columns.distribution.issuedDate"),
        cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
        render: (distribution) => distribution.issuedDate,
      });
    }

    if (isColumnVisible("issuedBy")) {
      cols.push({
        id: "issuedBy",
        label: t("hasanat.columns.distribution.issuedBy"),
        cellClassName: "text-sm text-muted-foreground whitespace-nowrap",
        render: (distribution) => distribution.issuedBy || "—",
      });
    }

    if (isColumnVisible("status")) {
      cols.push({
        id: "status",
        label: t("hasanat.columns.distribution.status"),
        render: (distribution) => <StatusBadge status={distribution.status} config={statusConfig} size="sm" />,
      });
    }

    return cols;
  }, [denomsById, isColumnVisible, statusConfig, t]);

  return (
    <WorkBatchTable
      data={distributions}
      columns={columns}
      caption={t("hasanat.distribution.aria")}
      className="table-fixed"
      tableBodyClassName="divide-y divide-border/50"
      bordered={false}
      onRowClick={onRowClick ? (d) => onRowClick(d.id) : undefined}
      selection={
        canDelete
          ? {
              selectedIds,
              onSelectOne: (id) => onToggleSelectedDistribution(String(id), !selectedIdsSet.has(String(id))),
              onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              selectAllAriaLabel: t("hasanat.trash.selectAll"),
              selectRowAriaLabel: (distribution) =>
                t("hasanat.trash.selectDistribution", {
                  name: distribution.recipientName || distribution.id,
                }),
            }
          : undefined
      }
      columnResize={{
        getColumnWidth: (key) => getColumnWidth?.(key),
        onColumnResize,
      }}
      renderRowActions={(distribution) => (
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
      )}
      actionsLabel={t("hasanat.columns.actions")}
    />
  );
}
