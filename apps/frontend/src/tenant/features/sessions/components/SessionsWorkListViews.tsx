import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, RotateCcw, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { SessionCard } from "@/tenant/features/sessions/components/SessionCard";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";

interface SessionsWorkColumnLayout {
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
}

interface SessionsWorkViewProps {
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  onOpenDetail: (session: Session) => void;
  onRequestDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function SessionsWorkCardGrid({
  sessions,
  showDeleted,
  canDelete,
  statusConfig,
  typeConfig,
  onOpenDetail,
  onRequestDelete,
  onRestore,
}: SessionsWorkViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sessions.map((sessionItem) => (
        <SessionCard
          key={sessionItem.id}
          session={sessionItem}
          onClick={() => !showDeleted && onOpenDetail(sessionItem)}
          onDelete={onRequestDelete}
          onRestore={onRestore}
          canDelete={canDelete}
          showDeleted={showDeleted}
          statusConfig={statusConfig}
          typeConfig={typeConfig}
        />
      ))}
    </div>
  );
}

interface SessionsWorkTableProps extends SessionsWorkViewProps {
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  showName: boolean;
  showType: boolean;
  showDuration: boolean;
  showFee: boolean;
  showEnrolled: boolean;
  showStatus: boolean;
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  columnLayout: SessionsWorkColumnLayout;
  onSort: (field: SessionSortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
}

export function SessionsWorkTable({
  sessions,
  showDeleted,
  canDelete,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  showName,
  showType,
  showDuration,
  showFee,
  showEnrolled,
  showStatus,
  sortField,
  sortDir,
  columnLayout,
  statusConfig,
  typeConfig,
  onOpenDetail,
  onSort,
  onToggleSelectAll,
  onToggleSelectedSession,
  onRequestDelete,
  onRestore,
}: SessionsWorkTableProps) {
  const { t } = useTranslation();

  const getSessionEnrollmentTotals = (sessionItem: Session) => {
    const totalEnrolled = sessionItem.classes?.reduce((sum, sessionClass) => sum + sessionClass.enrolled, 0) ?? 0;
    const totalCapacity = sessionItem.classes?.reduce((sum, sessionClass) => sum + sessionClass.capacity, 0) ?? 0;
    return { totalEnrolled, totalCapacity };
  };

  const renderSortIcon = (field: SessionSortField): ReactNode => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="ms-1 h-3 w-3" /> : <ChevronDown className="ms-1 h-3 w-3" />;
  };

  const renderSessionListActions = (sessionId: string) => (
    canDelete ? (
      showDeleted ? (
        <Button type="button" variant="ghost" size="icon" aria-label={t("sessions.restore")} onClick={() => onRestore(sessionId)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => onRequestDelete(sessionId)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    ) : null
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/45 shadow-sm backdrop-blur-xl">
      <div className="space-y-3 p-3 md:hidden">
        {sessions.map((sessionItem, index) => {
          const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(sessionItem);
          return (
            <motion.article
              key={sessionItem.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              className="space-y-3 rounded-xl border border-border bg-card p-3"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => !showDeleted && onOpenDetail(sessionItem)}
                className="h-auto w-full justify-start p-0 text-start font-normal hover:bg-transparent"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    {showName && <h4 className="truncate text-sm font-semibold text-foreground">{sessionItem.name}</h4>}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {showType && <StatusBadge status={sessionItem.type || "other"} config={typeConfig} size="sm" />}
                      {showStatus && <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />}
                    </div>
                  </div>
                  {showFee && (
                    <span className="shrink-0 text-sm font-bold text-foreground">
                      {formatMoney(sessionItem.baseFee, sessionItem.currency)}
                    </span>
                  )}
                </div>
              </Button>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {showDuration && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.duration")}</dt>
                    <dd className="text-foreground">{formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}</dd>
                  </div>
                )}
                {showEnrolled && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.enrolled")}</dt>
                    <dd className="text-foreground">{totalEnrolled}/{totalCapacity || t("common.notSpecified")}</dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                {canSelectSessions ? (
                  <Checkbox
                    checked={selectedIds.includes(sessionItem.id)}
                    onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)}
                    aria-label={sessionItem.name}
                  />
                ) : <span />}
                {renderSessionListActions(sessionItem.id)}
              </div>
            </motion.article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              {canSelectSessions && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                    aria-label={t("sessions.selectedCount", { count: sessions.length })}
                  />
                </th>
              )}
              {showName && (
                <ResizableTableHead columnKey="name" width={columnLayout.getColumnWidth("name")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Button type="button" variant="ghost" className="h-auto min-h-11 px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("name")}>
                    {t("sessions.columns.name")}{renderSortIcon("name")}
                  </Button>
                </ResizableTableHead>
              )}
              {showType && (
                <ResizableTableHead columnKey="type" width={columnLayout.getColumnWidth("type")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Button type="button" variant="ghost" className="h-auto min-h-11 px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("type")}>
                    {t("sessions.columns.type")}{renderSortIcon("type")}
                  </Button>
                </ResizableTableHead>
              )}
              {showDuration && <ResizableTableHead columnKey="duration" width={columnLayout.getColumnWidth("duration")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sessions.columns.duration")}</ResizableTableHead>}
              {showFee && (
                <ResizableTableHead columnKey="fee" width={columnLayout.getColumnWidth("fee")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Button type="button" variant="ghost" className="h-auto min-h-11 px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("baseFee")}>
                    {t("sessions.columns.fee")}{renderSortIcon("baseFee")}
                  </Button>
                </ResizableTableHead>
              )}
              {showEnrolled && <ResizableTableHead columnKey="enrolled" width={columnLayout.getColumnWidth("enrolled")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sessions.columns.enrolled")}</ResizableTableHead>}
              {showStatus && (
                <ResizableTableHead columnKey="status" width={columnLayout.getColumnWidth("status")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Button type="button" variant="ghost" className="h-auto min-h-11 px-1 text-xs font-semibold uppercase tracking-wide" onClick={() => onSort("status")}>
                    {t("sessions.columns.status")}{renderSortIcon("status")}
                  </Button>
                </ResizableTableHead>
              )}
              {canDelete && <th className="w-10 px-4 py-3"><span className="sr-only">{t("common.actions")}</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sessions.map((sessionItem) => {
              const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(sessionItem);
              return (
                <tr key={sessionItem.id} onClick={() => !showDeleted && onOpenDetail(sessionItem)} className="group cursor-pointer transition-colors hover:bg-muted/20">
                  {canSelectSessions && (
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <Checkbox checked={selectedIds.includes(sessionItem.id)} onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)} aria-label={sessionItem.name} />
                    </td>
                  )}
                  {showName && <td className="px-4 py-3 font-semibold text-foreground transition-colors group-hover:text-primary">{sessionItem.name}</td>}
                  {showType && <td className="px-4 py-3"><StatusBadge status={sessionItem.type || "other"} config={typeConfig} size="sm" /></td>}
                  {showDuration && <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}</td>}
                  {showFee && <td className="px-4 py-3 text-xs font-medium">{formatMoney(sessionItem.baseFee, sessionItem.currency)}</td>}
                  {showEnrolled && <td className="px-4 py-3 text-xs text-muted-foreground">{totalEnrolled}/{totalCapacity || t("common.notSpecified")}</td>}
                  {showStatus && <td className="px-4 py-3"><StatusBadge status={sessionItem.status} config={statusConfig} size="sm" /></td>}
                  {canDelete && <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>{renderSessionListActions(sessionItem.id)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
