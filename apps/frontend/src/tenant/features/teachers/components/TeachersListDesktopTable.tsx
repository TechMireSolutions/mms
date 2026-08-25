import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
import {
  Table,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { cn } from "@/lib/utils";
import { TeachersListRowActions } from "@/tenant/features/teachers/components/TeachersListRowActions";
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeachersListTypes";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";
import {
  getTeacherVisibleWorkColumns,
  teacherWorkColumnCellClass,
  teacherWorkColumnHeadClass,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";
import { teacherRowIdentity } from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { renderTeacherWorkColumnValue } from "@/tenant/features/teachers/components/teacherWorkColumnCell";

type TeachersListDesktopTableProps = Omit<TeacherListContentProps, never>;

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
  const rowMotion = useListRowMotion({ layout: "position", fade: true, duration: 0.1 });
  const emptyDash = t("teachers.table.emptyDash");

  const visibleColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible);

  const handleSort = (field: string) => onSort(field as TeacherSortField);

  const pageCountLabel = formatDirectoryPageCountLabel(teachers.length, t, {
    singular: "teachers.form.teacher",
    plural: "teachers.table.teachers",
  });

  return (
    <>
      <Table className="table-fixed">
        <ModuleWorkTableHeader
          columns={visibleColumns.map(col => ({
            id: col.key,
            label: col.label,
            headerClassName: col.key !== "name" ? teacherWorkColumnHeadClass(col.key) : undefined
          }))}
          sortField={sortField ?? undefined}
          sortDir={sortDir}
          onSort={handleSort}
          getColumnWidth={(key) => getColumnWidth?.(key) ?? visibleColumns.find(c => c.key === key)?.width}
          setColumnWidth={onColumnResize ?? (() => {})}
          selection={{
            allSelected,
            someSelected,
            onSelectAll,
            ariaLabel: allSelected ? t("common.deselect") : t("teachers.table.selectAll")
          }}
          actionsLabel={t("teachers.table.actions")}
          stickyColumnId="name"
        />
        <TableBody className="divide-y divide-border/50">
          <AnimatePresence>
            {teachers.map((teacher, rowIndex) => {
              const { teacherIdStr, displayName, isSelected } = teacherRowIdentity(teacher, selectedIds, t);
              return (
                <motion.tr
                  key={teacher.id}
                  {...rowMotion(Math.min(rowIndex * 0.03, 0.2))}
                  className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/5" : ""}`}
                >
                  <TableCell
                    className={cn(
                      "w-12 min-w-12 px-4 py-3 sticky start-0 z-20 transition-colors border-e border-border/30",
                      workTableStickyCellBg(isSelected),
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelectOne(teacherIdStr)}
                      aria-label={t("teachers.table.selectTeacher", { name: displayName })}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-4 py-3",
                        col.key === "name" &&
                          "sticky start-12 z-10 transition-colors border-e border-border/30",
                        col.key === "name" && workTableStickyCellBg(isSelected),
                        col.key !== "name" && teacherWorkColumnCellClass(col.key),
                      )}
                    >
                      {col.key === "name" ? (
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar
                            id={teacher.id}
                            name={displayName}
                            avatar={teacher.avatar}
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
                              <p className="text-xs text-muted-foreground truncate">{teacher.employeeId}</p>
                            ) : null}
                            {showDeleted && teacher.deletionReason ? (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {t("teachers.deletionReasonLabel")}: {teacher.deletionReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        renderTeacherWorkColumnValue(teacher, col.key, {
                          t,
                          statusConfig,
                          customFieldsById,
                          emptyFallback: (
                            <span className="text-sm text-muted-foreground">{emptyDash}</span>
                          ),
                        })
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
      <ModuleTableFooterCount
        selectedCount={selectedIds.length}
        selectedCountLabel={t("teachers.selectedCount", { count: selectedIds.length })}
        pageCountLabel={pageCountLabel}
      />
    </>
  );
}
