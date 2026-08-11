import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type { Session } from "@/lib/data/sessionsData";
import type { SessionsWorkColumnLayout } from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";
import { renderSessionWorkColumnValue } from "@/tenant/features/sessions/components/sessionWorkColumnCell";
import { SessionListRowActions } from "@/tenant/features/sessions/components/SessionListRowActions";

interface SessionsWorkTableDesktopProps {
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

export function SessionsWorkTableDesktop({
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
}: SessionsWorkTableDesktopProps) {
  const { t } = useTranslation();
  const handleSort = (field: string) => onSort(field as SessionSortField);

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
          {canSelectSessions && (
            <TableHead className="w-12 px-4 py-3 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("sessions.table.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("name") && (
            <ModuleTableHeaderCell columnKey="name" sortKey="name" activeSortField={sortField} sortDir={sortDir} onSort={handleSort} width={columnLayout.getColumnWidth("name")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.name")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("type") && (
            <ModuleTableHeaderCell columnKey="type" sortKey="type" activeSortField={sortField} sortDir={sortDir} onSort={handleSort} width={columnLayout.getColumnWidth("type")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.type")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("duration") && (
            <ModuleTableHeaderCell columnKey="duration" width={columnLayout.getColumnWidth("duration")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.duration")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("fee") && (
            <ModuleTableHeaderCell columnKey="fee" sortKey="baseFee" activeSortField={sortField} sortDir={sortDir} onSort={handleSort} width={columnLayout.getColumnWidth("fee")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.fee")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("enrolled") && (
            <ModuleTableHeaderCell columnKey="enrolled" width={columnLayout.getColumnWidth("enrolled")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.enrolled")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" sortKey="status" activeSortField={sortField} sortDir={sortDir} onSort={handleSort} width={columnLayout.getColumnWidth("status")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 whitespace-nowrap">
              {t("sessions.columns.status")}
            </ModuleTableHeaderCell>
          )}
          {canDelete && <TableHead className="w-10 px-4 py-3 h-auto"><span className="sr-only">{t("common.actions")}</span></TableHead>}
        </TableRow>
      </TableHeader>
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
  );
}
