import { AnimatePresence } from "framer-motion";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { StudentsListDesktopTableRow } from "@/tenant/features/students/components/StudentsListDesktopTableRow";
import type {
  StudentsListContentSortField,
  StudentsListContentTableProps,
} from "@/tenant/features/students/components/studentsListTypes";
import {
  getStudentVisibleWorkColumns,
} from "@/tenant/features/students/components/studentsListVisibleColumns";

export type StudentsListDesktopTableProps = Pick<
  StudentsListContentTableProps,
  | "paginatedStudents"
  | "sessions"
  | "selectedIds"
  | "allSelected"
  | "someSelected"
  | "viewingDeleted"
  | "canWrite"
  | "canDelete"
  | "canWriteMessaging"
  | "statusBadgeConfig"
  | "isColumnVisible"
  | "columnRegistry"
  | "sortField"
  | "sortDir"
  | "onSort"
  | "onSelectAll"
  | "onSelectOne"
  | "onViewStudent"
  | "onEdit"
  | "onDelete"
  | "onRestore"
  | "onOpenComposer"
  | "getColumnWidth"
  | "onColumnResize"
>;

export function StudentsListDesktopTable({
  paginatedStudents,
  sessions,
  selectedIds,
  allSelected,
  someSelected,
  viewingDeleted,
  canWrite,
  canDelete,
  canWriteMessaging,
  statusBadgeConfig,
  isColumnVisible,
  columnRegistry,
  sortField,
  sortDir,
  onSort,
  onSelectAll,
  onSelectOne,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
  getColumnWidth,
  onColumnResize,
}: StudentsListDesktopTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const visibleColumns = getStudentVisibleWorkColumns(columnRegistry, isColumnVisible);
  const handleSort = (field: string) => onSort(field as StudentsListContentSortField);

  const pageCountLabel = formatDirectoryPageCountLabel(paginatedStudents.length, t, {
    singular: "students.form.student",
    plural: "students.table.students",
  });
  const selectedSet = new Set(selectedIds);

  return (
    <>
      <Table className="table-fixed">
      <ModuleWorkTableHeader
        columns={visibleColumns.map(col => ({ id: col.key, label: col.label }))}
        sortField={sortField ?? undefined}
        sortDir={sortDir}
        onSort={handleSort}
        getColumnWidth={(key) => getColumnWidth?.(key) ?? visibleColumns.find(c => c.key === key)?.width}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={{
          allSelected,
          someSelected,
          onSelectAll,
          ariaLabel: allSelected ? t("common.deselect") : t("students.table.selectAll")
        }}
        actionsLabel={t("students.table.actions")}
        stickyColumnId="name"
      />
      <TableBody className="divide-y divide-border/50">
        <AnimatePresence>
          {paginatedStudents.map((studentRow, rowIndex) => (
            <StudentsListDesktopTableRow
              key={String(studentRow.id)}
              studentRow={studentRow}
              rowIndex={rowIndex}
              sessions={sessions}
              selectedIds={selectedSet}
              viewingDeleted={viewingDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              canWriteMessaging={canWriteMessaging}
              statusBadgeConfig={statusBadgeConfig}
              isColumnVisible={isColumnVisible}
              visibleColumns={visibleColumns}
              onSelectOne={onSelectOne}
              onViewStudent={onViewStudent}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              onOpenComposer={onOpenComposer}
            />
          ))}
        </AnimatePresence>
      </TableBody>
    </Table>

    <ModuleTableFooterCount
      selectedCount={selectedIds.length}
      selectedCountLabel={t("students.selectedCount", { count: selectedIds.length })}
      pageCountLabel={pageCountLabel}
    />
    </>
  );
}
