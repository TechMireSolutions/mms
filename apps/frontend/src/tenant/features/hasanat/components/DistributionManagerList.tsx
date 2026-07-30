import { motion } from "framer-motion";
import { User, Users2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";
import { DistributionRowActions } from "./DistributionRowActions";

type DistributionStatus = Distribution["status"];

export interface DistributionVisibleColumns {
  card: boolean;
  recipient: boolean;
  recipientClass: boolean;
  quantity: boolean;
  reason: boolean;
  issuedDate: boolean;
  issuedBy: boolean;
  status: boolean;
}

interface DistributionManagerListProps {
  distributions: Distribution[];
  denoms: Denomination[];
  selectedIds: string[];
  allFilteredSelected: boolean;
  visibleColumns: DistributionVisibleColumns;
  statusLabels: Record<DistributionStatus, string>;
  statusConfig: Record<DistributionStatus, StatusBadgeConfigItem>;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canRestoreRows: boolean;
  canDeleteRows: boolean;
  onMessage?: (channel: "sms" | "whatsapp" | "email", distributions: Distribution[]) => void;
  onChangeStatus: (id: string, status: DistributionStatus) => void;
  onToggleSelected: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRowTrashAction: (id: string) => void;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
}

export function DistributionManagerList({
  distributions,
  denoms,
  selectedIds,
  allFilteredSelected,
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
  onToggleAll,
  onRowTrashAction,
  getColumnWidth,
  onColumnResize,
}: DistributionManagerListProps) {
  const { t } = useTranslation();
  const statuses = Object.keys(statusConfig) as DistributionStatus[];
  const getDenomination = (id: string) => denoms.find((denomination) => denomination.id === id);

  return (
    <Card accentColor="primary" className="shadow-sm hover:shadow-md border-border/80 p-0 overflow-hidden bg-card/45 backdrop-blur-sm">
      <div className="space-y-3 p-3 md:hidden">
        {distributions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</p>
        ) : (
          distributions.map((distribution, index) => {
            const denomination = getDenomination(distribution.denominationId);
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm table-fixed">
          <caption className="sr-only">{t("hasanat.distribution.aria")}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {canDelete && (
                <th scope="col" className="px-3 py-2.5 w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={(checked) => onToggleAll(checked === true)}
                    aria-label={t("hasanat.trash.selectAll")}
                  />
                </th>
              )}
              {visibleColumns.card && (
                <ResizableTableHead columnKey="card" width={getColumnWidth?.("card")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.card")}
                </ResizableTableHead>
              )}
              {visibleColumns.recipient && (
                <ResizableTableHead columnKey="recipient" width={getColumnWidth?.("recipient")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.recipient")}
                </ResizableTableHead>
              )}
              {visibleColumns.recipientClass && (
                <ResizableTableHead columnKey="recipientClass" width={getColumnWidth?.("recipientClass")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.recipientClass")}
                </ResizableTableHead>
              )}
              {visibleColumns.quantity && (
                <ResizableTableHead columnKey="quantity" width={getColumnWidth?.("quantity")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.quantity")}
                </ResizableTableHead>
              )}
              {visibleColumns.reason && (
                <ResizableTableHead columnKey="reason" width={getColumnWidth?.("reason")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.reason")}
                </ResizableTableHead>
              )}
              {visibleColumns.issuedDate && (
                <ResizableTableHead columnKey="issuedDate" width={getColumnWidth?.("issuedDate")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.issuedDate")}
                </ResizableTableHead>
              )}
              {visibleColumns.issuedBy && (
                <ResizableTableHead columnKey="issuedBy" width={getColumnWidth?.("issuedBy")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.issuedBy")}
                </ResizableTableHead>
              )}
              {visibleColumns.status && (
                <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("hasanat.columns.distribution.status")}
                </ResizableTableHead>
              )}
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <span className="sr-only">{t("hasanat.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {distributions.length === 0 ? (
              <tr><td colSpan={canDelete ? 10 : 9} className="py-10 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</td></tr>
            ) : (
              distributions.map((distribution, index) => {
                const denomination = getDenomination(distribution.denominationId);
                return (
                  <motion.tr key={distribution.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                    {canDelete && (
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.includes(distribution.id)}
                          onCheckedChange={() => onToggleSelected(distribution.id)}
                          aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                        />
                      </td>
                    )}
                    {visibleColumns.card && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{distribution.denominationName}</p>
                            {denomination && <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>{denomination.points} pts</p>}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.recipient && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {distribution.recipientType === "faculty" ? <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> : <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{distribution.recipientName}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.recipientClass && (
                      <td className="px-4 py-3 text-sm text-muted-foreground">{distribution.recipientClass || "—"}</td>
                    )}
                    {visibleColumns.quantity && (
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-foreground">{distribution.quantity}</span>
                      </td>
                    )}
                    {visibleColumns.reason && (
                      <td className="px-4 py-3 max-w-[10rem]">
                        <p className="text-sm text-muted-foreground truncate m-0">{distribution.reason}</p>
                      </td>
                    )}
                    {visibleColumns.issuedDate && (
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{distribution.issuedDate}</td>
                    )}
                    {visibleColumns.issuedBy && (
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{distribution.issuedBy || "—"}</td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity flex items-center justify-end gap-1">
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
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
