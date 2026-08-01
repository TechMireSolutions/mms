import { type ReactNode } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import {
  getSessionEnrollmentTotals,
  type SessionsWorkColumnLayout,
} from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";

interface SessionsWorkTableDesktopProps {
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
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
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  onOpenDetail: (session: Session) => void;
  onSort: (field: SessionSortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
  onRequestDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function SessionsWorkTableDesktop({
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
}: SessionsWorkTableDesktopProps) {
  const { t } = useTranslation();

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
    <div className="overflow-x-auto">
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
  );
}
