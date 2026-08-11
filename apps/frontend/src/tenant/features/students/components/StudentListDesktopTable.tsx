import { AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleTableFooterCount } from "@/components/ui/ModuleTableFooterCount";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { WORK_STICKY_HEAD } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { StudentListDesktopTableRow } from "@/tenant/features/students/components/StudentListDesktopTableRow";
import type {
  StudentListSortField,
  StudentListTableProps,
} from "@/tenant/features/students/components/StudentListContentTypes";
import {
  getStudentVisibleWorkColumns,
  toStudentListSortField,
} from "@/tenant/features/students/components/studentListVisibleColumns";

type StudentListDesktopTableProps = Pick<
  StudentListTableProps,
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

export function StudentListDesktopTable({
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
}: StudentListDesktopTableProps) {
  const { t } = useTranslation();
  const visibleColumns = getStudentVisibleWorkColumns(columnRegistry, isColumnVisible);
  const handleSort = (field: string) => onSort(field as StudentListSortField);

  const pageCountLabel = formatDirectoryPageCountLabel(paginatedStudents.length, t, {
    singular: "students.form.student",
    plural: "students.table.students",
  });

  return (
    <>
      <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
          <TableHead
            className={cn(
              "w-12 min-w-12 px-4 py-3 sticky start-0 z-20 border-e border-border/30 h-auto",
              WORK_STICKY_HEAD,
            )}
          >
            <Checkbox
              checked={someSelected ? "indeterminate" : allSelected}
              onCheckedChange={onSelectAll}
              aria-label={allSelected ? t("common.deselect") : t("students.table.selectAll")}
              className="cursor-pointer"
            />
          </TableHead>
          {visibleColumns.map((col) => (
            <ModuleTableHeaderCell
              key={col.key}
              columnKey={col.key}
              sortKey={toStudentListSortField(col.key)}
              activeSortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              width={getColumnWidth?.(col.key) ?? col.width}
              onResize={onColumnResize}
              className={cn(
                col.key === "name" &&
                  "sticky start-12 z-20 border-e border-border/30",
                col.key === "name" && WORK_STICKY_HEAD,
              )}
            >
              {col.label}
            </ModuleTableHeaderCell>
          ))}
          <TableHead className="px-4 py-3 w-16 h-auto">
            <span className="sr-only">{t("students.table.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/50">
        <AnimatePresence>
          {paginatedStudents.map((studentRow, rowIndex) => (
            <StudentListDesktopTableRow
              key={String(studentRow.id)}
              studentRow={studentRow}
              rowIndex={rowIndex}
              sessions={sessions}
              selectedIds={selectedIds}
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
