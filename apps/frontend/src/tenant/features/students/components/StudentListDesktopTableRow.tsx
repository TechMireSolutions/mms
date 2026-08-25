import { type ModuleColumnRegistryEntry, type Student } from "@mms/shared";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { TableCell } from "@/components/ui/table";
import { workTableStickyCellBg } from "@/components/ui/tableWorkSticky";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { renderStudentListDesktopTableCell } from "@/tenant/features/students/components/StudentListDesktopTableCells";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentListDesktopTableRowProps = Pick<
  StudentListTableProps,
  | "sessions"
  | "selectedIds"
  | "viewingDeleted"
  | "canWrite"
  | "canDelete"
  | "canWriteMessaging"
  | "statusBadgeConfig"
  | "isColumnVisible"
  | "onSelectOne"
  | "onViewStudent"
  | "onEdit"
  | "onDelete"
  | "onRestore"
  | "onOpenComposer"
> & {
  studentRow: Student;
  rowIndex: number;
  visibleColumns: ModuleColumnRegistryEntry[];
};

export function StudentListDesktopTableRow({
  studentRow,
  rowIndex,
  sessions,
  selectedIds,
  viewingDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusBadgeConfig,
  isColumnVisible,
  visibleColumns,
  onSelectOne,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListDesktopTableRowProps) {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ fade: true, duration: 0.1 });
  const emptyDash = t("students.table.emptyDash");
  const studentIdStr = String(studentRow.id);
  const isSelected = selectedIds.includes(studentIdStr);
  const displayName = studentRow.name || "";

  return (
    <motion.tr
      key={studentIdStr}
      {...rowMotion(Math.min(rowIndex * 0.03, 0.2))}
      className={`hover:bg-muted/20 transition-colors group ${
        isSelected ? "bg-primary/5" : ""
      }`}
    >
      <TableCell
        className={cn(
          "w-12 min-w-12 px-4 py-3 sticky start-0 z-20 transition-colors border-e border-border/30",
          workTableStickyCellBg(isSelected),
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectOne(studentIdStr)}
          aria-label={t("students.table.selectStudent", { name: displayName })}
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
          )}
        >
          {renderStudentListDesktopTableCell({
            studentRow,
            col,
            studentIdStr,
            displayName,
            emptyDash,
            statusBadgeConfig,
            isColumnVisible,
            onViewStudent,
            viewingDeleted,
            canWriteMessaging: canWriteMessaging && !viewingDeleted,
            onOpenComposer,
            t,
          })}
        </TableCell>
      ))}
      <TableCell className="px-4 py-3">
        <StudentListActionsMenu
          student={studentRow}
          studentId={studentIdStr}
          viewingDeleted={viewingDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          includeMessaging={canWriteMessaging && !viewingDeleted}
          triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
          contentClassName="w-44"
          iconClassName="w-4 h-4"
          onViewStudent={onViewStudent}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onOpenComposer={onOpenComposer}
        />
      </TableCell>
    </motion.tr>
  );
}
