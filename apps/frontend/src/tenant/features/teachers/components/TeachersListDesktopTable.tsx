import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence } from "framer-motion";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { TeachersListDesktopTableRow } from "@/tenant/features/teachers/components/TeachersListDesktopTableRow";
import type { TeacherSortField } from "@/tenant/features/teachers/components/teachersListTypes";
import type { TeacherListContentProps } from "@/tenant/features/teachers/components/teacherListContentShared";
import {
  getTeacherVisibleWorkColumns,
  teacherWorkColumnHeadClass,
} from "@/tenant/features/teachers/components/teacherListVisibleColumns";

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
  const parentRef = useRef<HTMLDivElement>(null);
  const rowMotion = useListRowMotion({ layout: "position", fade: true, duration: 0.1 });
  const emptyDash = t("teachers.table.emptyDash");

  const visibleColumns = getTeacherVisibleWorkColumns(columnRegistry, isColumnVisible);

  const handleSort = (field: string) => onSort(field as TeacherSortField);

  const pageCountLabel = formatDirectoryPageCountLabel(teachers.length, t, {
    singular: "teachers.form.teacher",
    plural: "teachers.table.teachers",
  });
  const selectedSet = new Set(selectedIds);
  const isVirtualized = teachers.length > 30;

  const rowVirtualizer = useVirtualizer({
    count: teachers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
    enabled: isVirtualized,
  });

  return (
    <>
      <div
        ref={parentRef}
        className={isVirtualized ? "w-full overflow-x-auto max-h-150 overflow-y-auto" : "w-full overflow-x-auto"}
      >
        <Table className="table-fixed">
          <ModuleWorkTableHeader
            columns={visibleColumns.map((col) => ({
              id: col.key,
              label: col.label,
              headerClassName: col.key !== "name" ? teacherWorkColumnHeadClass(col.key) : undefined,
            }))}
            sortField={sortField ?? undefined}
            sortDir={sortDir}
            onSort={handleSort}
            getColumnWidth={(key) => getColumnWidth?.(key) ?? visibleColumns.find((c) => c.key === key)?.width}
            setColumnWidth={onColumnResize ?? (() => {})}
            selection={{
              allSelected,
              someSelected,
              onSelectAll,
              ariaLabel: allSelected ? t("common.deselect") : t("teachers.table.selectAll"),
            }}
            actionsLabel={t("teachers.table.actions")}
            stickyColumnId="name"
          />
          <TableBody className="divide-y divide-border/50">
            {isVirtualized ? (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}>
                    <td colSpan={visibleColumns.length + 2} />
                  </tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const teacher = teachers[virtualRow.index];
                  return (
                    <TeachersListDesktopTableRow
                      key={teacher.id}
                      teacher={teacher}
                      rowIndex={virtualRow.index}
                      selectedSet={selectedSet}
                      visibleColumns={visibleColumns}
                      showDeleted={showDeleted}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      statusConfig={statusConfig}
                      customFieldsById={customFieldsById}
                      emptyDash={emptyDash}
                      rowMotion={rowMotion}
                      t={t}
                      onSelectOne={onSelectOne}
                      onView={onView}
                      onEdit={onEdit}
                      onRequestDelete={onRequestDelete}
                      onRestore={onRestore}
                      onSms={onSms}
                      onWhatsApp={onWhatsApp}
                      onEmail={onEmail}
                    />
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height: `${
                        rowVirtualizer.getTotalSize() -
                        rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end
                      }px`,
                    }}
                  >
                    <td colSpan={visibleColumns.length + 2} />
                  </tr>
                )}
              </>
            ) : (
              <AnimatePresence>
                {teachers.map((teacher, rowIndex) => (
                  <TeachersListDesktopTableRow
                    key={teacher.id}
                    teacher={teacher}
                    rowIndex={rowIndex}
                    selectedSet={selectedSet}
                    visibleColumns={visibleColumns}
                    showDeleted={showDeleted}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    statusConfig={statusConfig}
                    customFieldsById={customFieldsById}
                    emptyDash={emptyDash}
                    rowMotion={rowMotion}
                    t={t}
                    onSelectOne={onSelectOne}
                    onView={onView}
                    onEdit={onEdit}
                    onRequestDelete={onRequestDelete}
                    onRestore={onRestore}
                    onSms={onSms}
                    onWhatsApp={onWhatsApp}
                    onEmail={onEmail}
                  />
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
      <ModuleTableFooterCount
        selectedCount={selectedIds.length}
        selectedCountLabel={t("teachers.selectedCount", { count: selectedIds.length })}
        pageCountLabel={pageCountLabel}
      />
    </>
  );
}
