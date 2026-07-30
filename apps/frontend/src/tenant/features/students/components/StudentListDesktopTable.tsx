import { AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
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
  | "showDob"
  | "showParents"
  | "showSessions"
  | "showStatus"
  | "showDeleted"
  | "canWrite"
  | "canDelete"
  | "statusBadgeConfig"
  | "isFieldEnabled"
  | "renderSortIcon"
  | "onSort"
  | "onSelectAll"
  | "onSelectOne"
  | "onRowClick"
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
  showDob,
  showParents,
  showSessions,
  showStatus,
  showDeleted,
  canWrite,
  canDelete,
  statusBadgeConfig,
  isFieldEnabled,
  renderSortIcon,
  onSort,
  onSelectAll,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
  getColumnWidth,
  onColumnResize,
}: StudentListDesktopTableProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-border/50 bg-muted/20">
            <th className="w-10 px-4 py-3">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
              />
            </th>
            <ResizableTableHead
              columnKey="name"
              width={getColumnWidth?.("name")}
              onResize={onColumnResize}
              onClick={() => onSort("name")}
              className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
            >
              <div className="flex items-center gap-1">
                {t("students.columns.name")} {renderSortIcon("name")}
              </div>
            </ResizableTableHead>
            {showDob && (
              <ResizableTableHead
                columnKey="dob"
                width={getColumnWidth?.("dob")}
                onResize={onColumnResize}
                onClick={() => onSort("age")}
                className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  {t("students.columns.dob")} {renderSortIcon("age")}
                </div>
              </ResizableTableHead>
            )}
            {showParents && (
              <ResizableTableHead
                columnKey="parents"
                width={getColumnWidth?.("parents")}
                onResize={onColumnResize}
                onClick={() => onSort("fatherName")}
                className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  {t("students.columns.parents")} {renderSortIcon("fatherName")}
                </div>
              </ResizableTableHead>
            )}
            {showSessions && (
              <ResizableTableHead columnKey="sessions" width={getColumnWidth?.("sessions")} onResize={onColumnResize} className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                {t("students.columns.sessions")}
              </ResizableTableHead>
            )}
            {showStatus && (
              <ResizableTableHead
                columnKey="status"
                width={getColumnWidth?.("status")}
                onResize={onColumnResize}
                onClick={() => onSort("status")}
                className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  {t("students.columns.status")} {renderSortIcon("status")}
                </div>
              </ResizableTableHead>
            )}
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          <AnimatePresence>
            {paginatedStudents.map((studentRow, rowIndex) => (
              <StudentListDesktopTableRow
                key={String(studentRow.id)}
                studentRow={studentRow}
                rowIndex={rowIndex}
                sessions={sessions}
                selectedIds={selectedIds}
                showDob={showDob}
                showParents={showParents}
                showSessions={showSessions}
                showStatus={showStatus}
                showDeleted={showDeleted}
                canWrite={canWrite}
                canDelete={canDelete}
                statusBadgeConfig={statusBadgeConfig}
                isFieldEnabled={isFieldEnabled}
                onSelectOne={onSelectOne}
                onRowClick={onRowClick}
                onViewStudent={onViewStudent}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                onOpenComposer={onOpenComposer}
              />
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
