import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
import {
  getTeacherCustomFieldValue,
  type TeacherListContentProps,
} from "@/tenant/features/teachers/components/teacherListContentShared";

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
    visibleCustomFields,
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
          {isColumnVisible("specialization") && (
            <ResizableTableHead columnKey="specialization" width={getColumnWidth?.("specialization")} onResize={onColumnResize} className="px-4 py-3 text-start hidden sm:table-cell">
              <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort("specialization")}>
                {t("teachers.field.specialization")} {renderSortIcon("specialization")}
              </Button>
            </ResizableTableHead>
          )}
          {isColumnVisible("qualification") && (
            <ResizableTableHead columnKey="qualification" width={getColumnWidth?.("qualification")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
              <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort("qualification")}>
                {t("teachers.field.qualification")} {renderSortIcon("qualification")}
              </Button>
            </ResizableTableHead>
          )}
          {isColumnVisible("joinDate") && (
            <ResizableTableHead columnKey="joinDate" width={getColumnWidth?.("joinDate")} onResize={onColumnResize} className="px-4 py-3 text-start hidden md:table-cell">
              <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort("joinDate")}>
                {t("teachers.field.joinDate")} {renderSortIcon("joinDate")}
              </Button>
            </ResizableTableHead>
          )}
          {isColumnVisible("status") && (
            <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-3 text-start">
              <Button type="button" variant="ghost" className="min-h-11 h-auto px-1 hover:bg-transparent flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground" onClick={() => onSort("status")}>
                {t("teachers.field.status")} {renderSortIcon("status")}
              </Button>
            </ResizableTableHead>
          )}
          {visibleCustomFields.map((field) => (
            <ResizableTableHead key={field.id} columnKey={`custom:${field.id}`} width={getColumnWidth?.(`custom:${field.id}`)} onResize={onColumnResize} className="px-4 py-3 text-start hidden lg:table-cell">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {field.label ?? field.id}
              </span>
            </ResizableTableHead>
          ))}
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
          const displayName = teacher.name || t("teachers.contactMissing");
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
              {isColumnVisible("specialization") && (
                <TableCell className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{teacher.specialization ?? t("common.notSpecified")}</TableCell>
              )}
              {isColumnVisible("qualification") && (
                <TableCell className="px-4 py-3 text-muted-foreground hidden md:table-cell">{teacher.qualification ?? t("common.notSpecified")}</TableCell>
              )}
              {isColumnVisible("joinDate") && (
                <TableCell className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {teacher.joinDate ? formatDate(teacher.joinDate) : t("common.notSpecified")}
                </TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-4 py-3">
                  <StatusBadge status={teacher.status} config={statusConfig} />
                </TableCell>
              )}
              {visibleCustomFields.map((field) => (
                <TableCell key={field.id} className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {getTeacherCustomFieldValue(teacher, field, t)}
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
