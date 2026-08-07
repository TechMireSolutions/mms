import { AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { StudentListDesktopTableRow } from "@/tenant/features/students/components/StudentListDesktopTableRow";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";
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
  | "renderSortIcon"
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

const HEAD_CLASS =
  "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
const SORTABLE_HEAD_CLASS = `${HEAD_CLASS} cursor-pointer hover:text-foreground select-none`;

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
  renderSortIcon,
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

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
          <TableHead className="w-10 px-4 py-3">
            <Checkbox
              checked={someSelected ? "indeterminate" : allSelected}
              onCheckedChange={onSelectAll}
              aria-label={allSelected ? t("common.deselect") : t("students.table.selectAll")}
            />
          </TableHead>
          {visibleColumns.map((col) => {
            const sortField = toStudentListSortField(col.key);
            return (
              <ResizableTableHead
                key={col.key}
                columnKey={col.key}
                width={getColumnWidth?.(col.key) ?? col.width}
                onResize={onColumnResize}
                onClick={sortField ? () => onSort(sortField) : undefined}
                className={sortField ? SORTABLE_HEAD_CLASS : HEAD_CLASS}
              >
                {sortField ? (
                  <div className="flex items-center gap-1">
                    {col.label} {renderSortIcon(sortField)}
                  </div>
                ) : (
                  col.label
                )}
              </ResizableTableHead>
            );
          })}
          <TableHead className="px-4 py-3 w-12" />
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
  );
}
