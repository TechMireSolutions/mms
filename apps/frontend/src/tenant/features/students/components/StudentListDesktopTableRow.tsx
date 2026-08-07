import {
  calcAge,
  formatDate,
  primaryResponsibleAdultDisplayName,
  type ModuleColumnRegistryEntry,
  type Student,
} from "@mms/shared";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableCell } from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import {
  formatStudentListCustomValue,
  studentCustomFieldKeyFromColumn,
} from "@/tenant/features/students/components/studentListCustomColumns";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentListDesktopTableRowProps = Pick<
  StudentListTableProps,
  | "sessions"
  | "selectedIds"
  | "showDeleted"
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
  showDeleted,
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
  const age = calcAge(studentRow.dob);
  const sessionNames = sessions
    .filter((session) => studentRow.enrolledSessions?.includes(session.id))
    .map((session) => session.name);

  const renderCell = (col: ModuleColumnRegistryEntry): React.ReactNode => {
    if (col.key.startsWith("custom:")) {
      const fieldKey = studentCustomFieldKeyFromColumn(col.key);
      const raw = fieldKey ? (studentRow as Record<string, unknown>)[fieldKey] : undefined;
      return (
        <p className="text-sm text-foreground truncate">{formatStudentListCustomValue(raw, t)}</p>
      );
    }

    switch (col.key) {
      case "name": {
        const genderLabel =
          isColumnVisible("gender") && studentRow.gender
            ? formatContactGenderLabel(studentRow.gender, t)
            : "";
        const phoneLine = isColumnVisible("phone")
          ? studentRow.phone || t("students.list.noPhone")
          : "";
        const subtitleParts = [genderLabel, phoneLine].filter(Boolean);
        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              id={studentIdStr}
              name={displayName}
              className="w-8 h-8 rounded-full text-xs font-bold"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onViewStudent(studentRow)}
                  className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                  title={displayName}
                >
                  <span className="block truncate">{displayName}</span>
                </Button>
                {isColumnVisible("grNumber") ? <GrBadge grNumber={studentRow.grNumber} /> : null}
              </div>
              {subtitleParts.length > 0 ? (
                <p className="text-xs text-muted-foreground">{subtitleParts.join(" · ")}</p>
              ) : null}
            </div>
          </div>
        );
      }
      case "grNumber":
        return studentRow.grNumber ? (
          <GrBadge grNumber={studentRow.grNumber} />
        ) : (
          <span className="text-sm text-muted-foreground">{emptyDash}</span>
        );
      case "gender":
        return (
          <p className="text-sm text-foreground">
            {studentRow.gender ? formatContactGenderLabel(studentRow.gender, t) : emptyDash}
          </p>
        );
      case "phone":
        return <p className="text-sm text-foreground truncate">{studentRow.phone || emptyDash}</p>;
      case "email":
        return <p className="text-sm text-foreground truncate">{studentRow.email || emptyDash}</p>;
      case "dob":
        return (
          <>
            <p className="text-sm font-medium text-foreground">
              {age ? t("students.list.ageYears", { age }) : emptyDash}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(studentRow.dob, true)}</p>
          </>
        );
      case "parents":
        return (
          <p className="text-sm text-foreground">
            {primaryResponsibleAdultDisplayName(studentRow) || emptyDash}
          </p>
        );
      case "sessions":
        return (
          <div className="flex flex-wrap gap-1">
            {sessionNames.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">
                {t("students.list.notEnrolled")}
              </span>
            ) : (
              sessionNames.map((sessionName) => (
                <span
                  key={sessionName}
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10"
                >
                  {sessionName}
                </span>
              ))
            )}
          </div>
        );
      case "status":
        return <StatusBadge status={studentRow.status || "active"} config={statusBadgeConfig} />;
      case "registeredDate":
        return (
          <p className="text-sm text-foreground">
            {studentRow.registeredDate ? formatDate(studentRow.registeredDate, true) : emptyDash}
          </p>
        );
      case "notes":
        return (
          <p className="text-sm text-foreground truncate" title={studentRow.notes || undefined}>
            {studentRow.notes?.trim() || emptyDash}
          </p>
        );
      default:
        return <span className="text-sm text-muted-foreground">{emptyDash}</span>;
    }
  };

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
          {renderCell(col)}
        </TableCell>
      ))}
      <TableCell className="px-4 py-3">
        <StudentListActionsMenu
          student={studentRow}
          studentId={studentIdStr}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          includeMessaging={canWriteMessaging && !showDeleted}
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
