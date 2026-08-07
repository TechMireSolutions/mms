import { type ModuleColumnRegistryEntry, type Student } from "@mms/shared";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell } from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
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
  const emptyDash = t("students.table.emptyDash");
  const studentIdStr = String(studentRow.id);
  const isSelected = selectedIds.includes(studentIdStr);
  const displayName = studentRow.name || "";
  const sessionNames = sessions
    .filter((session) => studentRow.enrolledSessions?.includes(session.id))
    .map((session) => session.name);

  return (
    <motion.tr
      key={studentIdStr}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
      className={`hover:bg-muted/20 transition-colors group ${
        isSelected ? "bg-primary/5" : ""
      }`}
    >
      <TableCell className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectOne(studentIdStr)}
          aria-label={t("students.table.selectStudent", { name: displayName })}
        />
      </TableCell>
      {visibleColumns.map((col) => (
        <TableCell key={col.key} className="px-4 py-3">
          {renderStudentListDesktopTableCell({
            studentRow,
            col,
            studentIdStr,
            displayName,
            sessionNames,
            emptyDash,
            statusBadgeConfig,
            isColumnVisible,
            onViewStudent,
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
          triggerClassName="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
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
