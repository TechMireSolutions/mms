import React, { useMemo } from "react";
import type { Teacher } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { WorkBatchTable, type WorkBatchTableColumn } from "@/components/common/work/WorkBatchTable";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { TeachersListRowActions } from "@/tenant/features/faculty/components/FacultyListRowActions";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import type { TeacherSortField } from "@/tenant/features/faculty/components/facultyListTypes";
import type { TeacherListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";
import {
  getTeacherVisibleWorkColumns,
  teacherWorkColumnHeadClass,
  teacherWorkColumnCellClass,
} from "@/tenant/features/faculty/components/facultyListVisibleColumns";
import { teacherRowIdentity } from "@/tenant/features/faculty/components/facultyFieldDisplay";
import { renderTeacherWorkColumnValue } from "@/tenant/features/faculty/components/facultyWorkColumnCell";

export type TeachersListDesktopTableProps = TeacherListContentProps;

export function TeachersListDesktopTable(props: TeachersListDesktopTableProps): React.JSX.Element {
  const {
    teachers,
    selectedIds,
    allSelected,
    someSelected,
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
  const emptyDash = t("teachers.table.emptyDash");

  const visibleColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible);

  const handleSort = (field: string) => onSort(field as TeacherSortField);

  const pageCountLabel = formatDirectoryPageCountLabel(teachers.length, t, {
    singular: "teachers.form.teacher",
    plural: "teachers.table.teachers",
  });
  
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const batchColumns = useMemo<WorkBatchTableColumn<Teacher>[]>(() => {
    return visibleColumns.map((col) => ({
      id: col.key,
      label: col.label,
      sortField: col.key,
      width: getColumnWidth?.(col.key) ?? col.width,
      headerClassName: col.key !== "name" ? teacherWorkColumnHeadClass(col.key) : undefined,
      cellClassName: col.key !== "name" ? teacherWorkColumnCellClass(col.key) : undefined,
      render: (teacher) => {
        if (col.key === "name") {
          const { displayName } = teacherRowIdentity(teacher, selectedSet, t);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                id={teacher.id}
                name={displayName}
                avatar={teacher.avatar}
                gender={teacher.gender}
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onView(teacher)}
                  className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  title={displayName}
                >
                  <span className="block truncate">{displayName}</span>
                </Button>
                {teacher.employeeId ? (
                  <p className="text-xs text-muted-foreground truncate" title={teacher.employeeId}>
                    {teacher.employeeId}
                  </p>
                ) : null}
                {showDeleted && teacher.deletionReason ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" title={teacher.deletionReason}>
                    {t("teachers.deletionReasonLabel")}: {teacher.deletionReason}
                  </p>
                ) : null}
              </div>
            </div>
          );
        }

        return renderTeacherWorkColumnValue(teacher, col.key, {
          t,
          statusConfig,
          customFieldsById,
          emptyFallback: (
            <span className="text-sm text-muted-foreground">{emptyDash}</span>
          ),
        });
      },
    }));
  }, [
    visibleColumns,
    getColumnWidth,
    selectedSet,
    t,
    onView,
    showDeleted,
    statusConfig,
    customFieldsById,
    emptyDash,
  ]);

  return (
    <>
      <WorkBatchTable
        data={teachers}
        columns={batchColumns}
        selection={{
          selectedIds: selectedSet,
          onSelectOne: (id) => onSelectOne(id),
          onSelectAll,
          allSelected,
          someSelected,
          selectAllAriaLabel: allSelected ? t("common.deselect") : t("teachers.table.selectAll"),
          selectRowAriaLabel: (teacher) => t("teachers.table.selectTeacher", { name: teacher.name ?? "Teacher" }),
        }}
        sort={{
          field: sortField ?? undefined,
          dir: sortDir,
          onSort: handleSort,
        }}
        columnResize={{
          getColumnWidth,
          onColumnResize,
        }}
        actionsLabel={t("teachers.table.actions")}
        renderRowActions={(teacher) => {
          const { teacherIdStr } = teacherRowIdentity(teacher, selectedSet, t);
          return (
            <TeachersListRowActions
              teacher={teacher}
              teacherId={teacherIdStr}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
              onView={onView}
              onRestore={onRestore}
              onSms={onSms}
              onWhatsApp={onWhatsApp}
              onEmail={onEmail}
            />
          );
        }}
        stickyColumnId="name"
      />
      <ModuleTableFooterCount
        selectedCount={selectedIds.length}
        selectedCountLabel={t("teachers.selectedCount", { count: selectedIds.length })}
        pageCountLabel={pageCountLabel}
      />
    </>
  );
}

export type FacultyListDesktopTableProps = TeachersListDesktopTableProps;
export const FacultyListDesktopTable = TeachersListDesktopTable;

