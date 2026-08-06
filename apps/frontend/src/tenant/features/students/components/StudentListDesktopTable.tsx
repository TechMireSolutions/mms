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

type StudentListDesktopTableProps = Pick<
  StudentListTableProps,
  | "paginatedStudents"
  | "sessions"
  | "selectedIds"
  | "allSelected"
  | "someSelected"
  | "showDeleted"
  | "canWrite"
  | "canDelete"
  | "canWriteMessaging"
  | "statusBadgeConfig"
  | "isColumnVisible"
  | "isFieldEnabled"
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
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging,
  statusBadgeConfig,
  isColumnVisible,
  isFieldEnabled,
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
  const customColumns = columnRegistry.filter(
    (col) => col.key.startsWith("custom:") && isColumnVisible(col.key),
  );

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
          <ResizableTableHead
            columnKey="name"
            width={getColumnWidth?.("name")}
            onResize={onColumnResize}
            onClick={() => onSort("name")}
            className={SORTABLE_HEAD_CLASS}
          >
            <div className="flex items-center gap-1">
              {t("students.columns.name")} {renderSortIcon("name")}
            </div>
          </ResizableTableHead>
          {isColumnVisible("dob") ? (
            <ResizableTableHead
              columnKey="dob"
              width={getColumnWidth?.("dob")}
              onResize={onColumnResize}
              onClick={() => onSort("age")}
              className={`${SORTABLE_HEAD_CLASS} hidden sm:table-cell`}
            >
              <div className="flex items-center gap-1">
                {t("students.columns.dob")} {renderSortIcon("age")}
              </div>
            </ResizableTableHead>
          ) : null}
          {isColumnVisible("parents") ? (
            <ResizableTableHead
              columnKey="parents"
              width={getColumnWidth?.("parents")}
              onResize={onColumnResize}
              onClick={() => onSort("fatherName")}
              className={`${SORTABLE_HEAD_CLASS} hidden md:table-cell`}
            >
              <div className="flex items-center gap-1">
                {t("students.columns.parents")} {renderSortIcon("fatherName")}
              </div>
            </ResizableTableHead>
          ) : null}
          {isColumnVisible("sessions") ? (
            <ResizableTableHead
              columnKey="sessions"
              width={getColumnWidth?.("sessions")}
              onResize={onColumnResize}
              className={`${HEAD_CLASS} hidden lg:table-cell`}
            >
              {t("students.columns.sessions")}
            </ResizableTableHead>
          ) : null}
          {isColumnVisible("status") ? (
            <ResizableTableHead
              columnKey="status"
              width={getColumnWidth?.("status")}
              onResize={onColumnResize}
              onClick={() => onSort("status")}
              className={`${SORTABLE_HEAD_CLASS} hidden sm:table-cell`}
            >
              <div className="flex items-center gap-1">
                {t("students.columns.status")} {renderSortIcon("status")}
              </div>
            </ResizableTableHead>
          ) : null}
          {customColumns.map((col) => (
            <ResizableTableHead
              key={col.key}
              columnKey={col.key}
              width={getColumnWidth?.(col.key) ?? col.width}
              onResize={onColumnResize}
              className={`${HEAD_CLASS} hidden xl:table-cell`}
            >
              {col.label}
            </ResizableTableHead>
          ))}
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
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              canWriteMessaging={canWriteMessaging}
              statusBadgeConfig={statusBadgeConfig}
              isColumnVisible={isColumnVisible}
              isFieldEnabled={isFieldEnabled}
              columnRegistry={columnRegistry}
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
