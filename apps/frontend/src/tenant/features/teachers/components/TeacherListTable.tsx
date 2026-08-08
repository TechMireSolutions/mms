import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { TeacherListRowActions } from "@/tenant/features/teachers/components/TeacherListRowActions";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeacherListTypes";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";
import {
  getTeacherVisibleWorkColumns,
  teacherWorkColumnCellClass,
  teacherWorkColumnHeadClass,
  toTeacherListSortField,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import { resolveTeacherDisplayName } from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { renderTeacherWorkColumnValue } from "@/tenant/features/teachers/components/teacherWorkColumnCell";

type TeacherListTableProps = Omit<TeacherListContentProps, never>;

export function TeacherListTable(props: TeacherListTableProps): React.JSX.Element {
  const {
    teachers,
    selectedIds,
    allSelected,
    someSelected,
    showSelectColumn,
    showActionsColumn,
    showDeleted,
    canWrite,
    canDelete,
    isColumnVisible,
    columnRegistry,
    customFieldsById,
    statusConfig,
    sortField,
    sortDir,
    getColumnWidth,
    onColumnResize,
    onSort,
    onSelectAll,
    onSelectOne,
    onView,
    onEdit,
    onRequestDelete,
    onRestore,
    onSms,
    onWhatsApp,
    onEmail,
  } = props;
  const { t } = useTranslation();

  const visibleColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });

  const renderSortIcon = (field: TeacherSortField) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-25" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  return (
    <Table className="table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow>
          {showSelectColumn && (
            <TableHead className="w-10 px-4 py-3">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
          )}
          <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-3 text-start">
            <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort("name")}>
              {t("teachers.field.name")} {renderSortIcon("name")}
            </Button>
          </ResizableTableHead>
          {visibleColumns.map((col) => {
            const sortKey = toTeacherListSortField(col.key);
            return (
              <ResizableTableHead
                key={col.key}
                columnKey={col.key}
                width={getColumnWidth?.(col.key)}
                onResize={onColumnResize}
                className={teacherWorkColumnHeadClass(col.key)}
              >
                {sortKey ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    onClick={() => onSort(sortKey)}
                  >
                    {col.label} {renderSortIcon(sortKey)}
                  </Button>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </span>
                )}
              </ResizableTableHead>
            );
          })}
          {showActionsColumn && (
            <TableHead className="px-4 py-3 w-10">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teachers.map((teacher) => {
          const teacherIdStr = String(teacher.id);
          const displayName = resolveTeacherDisplayName(teacher, t);
          const isSelected = selectedIds.includes(teacherIdStr);
          return (
            <TableRow key={teacher.id} className={`hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/[0.015]" : ""}`}>
              {showSelectColumn && (
                <TableCell className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectOne(teacherIdStr)}
                  />
                </TableCell>
              )}
              <TableCell className="px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto flex items-center gap-3 min-w-0 text-start w-full p-0 shadow-none hover:bg-transparent"
                  onClick={() => onView(teacher)}
                >
                  <UserAvatar id={teacher.id} name={displayName} className="h-8 w-8 rounded-full text-xs font-semibold" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate hover:text-primary transition-colors">{displayName}</p>
                    {teacher.employeeId && (
                      <p className="text-xs text-muted-foreground">{teacher.employeeId}</p>
                    )}
                  </div>
                </Button>
              </TableCell>
              {visibleColumns.map((col) => (
                <TableCell key={col.key} className={teacherWorkColumnCellClass(col.key)}>
                  {renderTeacherWorkColumnValue(teacher, col.key, {
                    t,
                    statusConfig,
                    customFieldsById,
                  })}
                </TableCell>
              ))}
              {showActionsColumn && (
                <TableCell className="px-4 py-3">
                  <TeacherListRowActions
                    teacher={teacher}
                    teacherId={teacherIdStr}
                    showDeleted={showDeleted}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    onEdit={onEdit}
                    onRequestDelete={onRequestDelete}
                    onView={onView}
                    onRestore={onRestore}
                    onSms={onSms}
                    onWhatsApp={onWhatsApp}
                    onEmail={onEmail}
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
