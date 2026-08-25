import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import type { SessionsWorkColumnLayout } from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";
import { renderSessionWorkColumnValue } from "@/tenant/features/sessions/components/sessionWorkColumnCell";
import { SessionListRowActions } from "@/tenant/features/sessions/components/SessionListRowActions";

interface SessionsListDesktopTableProps {
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  isColumnVisible: (key: string) => boolean;
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

export function SessionsListDesktopTable({
  sessions,
  showDeleted,
  canDelete,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  isColumnVisible,
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
}: SessionsListDesktopTableProps) {
  const { t } = useTranslation();

  const columns = [
    isColumnVisible("name") ? { id: "name", label: t("sessions.columns.name"), sortField: "name" } : null,
    isColumnVisible("type") ? { id: "type", label: t("sessions.columns.type"), sortField: "type" } : null,
    isColumnVisible("duration") ? { id: "duration", label: t("sessions.columns.duration") } : null,
    isColumnVisible("fee") ? { id: "fee", label: t("sessions.columns.fee"), sortField: "baseFee" } : null,
    isColumnVisible("enrolled") ? { id: "enrolled", label: t("sessions.columns.enrolled") } : null,
    isColumnVisible("status") ? { id: "status", label: t("sessions.columns.status"), sortField: "status" } : null,
  ].filter(Boolean) as { id: string; label: string; sortField?: string }[];

  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      <Table className="table-fixed">
        <ModuleWorkTableHeader
          columns={columns}
          sortField={sortField}
          sortDir={sortDir}
          onSort={(field) => onSort(field as SessionSortField)}
          getColumnWidth={columnLayout.getColumnWidth}
          setColumnWidth={columnLayout.setColumnWidth}
          selection={
            canSelectSessions
              ? {
                  allSelected: allVisibleSelected,
                  someSelected: someVisibleSelected,
                  onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
                  ariaLabel: t("sessions.table.selectAll"),
                }
              : undefined
          }
          actionsLabel={canDelete ? t("common.actions") : undefined}
          stickyColumnId="name"
        />
        <TableBody className="divide-y divide-border/50">
          {sessions.map((sessionItem) => {
            const isSelected = selectedIds.includes(sessionItem.id);
            const columnOptions = { t, statusConfig, typeConfig };
            return (
              <TableRow
                key={sessionItem.id}
                className={`group transition-colors hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}
              >
                {canSelectSessions && (
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)}
                      aria-label={sessionItem.name}
                    />
                  </TableCell>
                )}
                {isColumnVisible("name") && (
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenDetail(sessionItem)}
                      className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                      title={sessionItem.name}
                    >
                      <span className="block truncate">{sessionItem.name}</span>
                    </Button>
                  </TableCell>
                )}
                {isColumnVisible("type") && <TableCell className="px-4 py-3">{renderSessionWorkColumnValue(sessionItem, "type", columnOptions)}</TableCell>}
                {isColumnVisible("duration") && <TableCell className="px-4 py-3 text-xs text-muted-foreground">{renderSessionWorkColumnValue(sessionItem, "duration", columnOptions)}</TableCell>}
                {isColumnVisible("fee") && <TableCell className="px-4 py-3 text-xs font-medium">{renderSessionWorkColumnValue(sessionItem, "fee", columnOptions)}</TableCell>}
                {isColumnVisible("enrolled") && <TableCell className="px-4 py-3 text-xs text-muted-foreground">{renderSessionWorkColumnValue(sessionItem, "enrolled", columnOptions)}</TableCell>}
                {isColumnVisible("status") && <TableCell className="px-4 py-3">{renderSessionWorkColumnValue(sessionItem, "status", columnOptions)}</TableCell>}
                {canDelete && (
                  <TableCell className="px-4 py-3">
                    <SessionListRowActions
                      session={sessionItem}
                      showDeleted={showDeleted}
                      canDelete={canDelete}
                      triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
                      onRequestDelete={onRequestDelete}
                      onRestore={onRestore}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
