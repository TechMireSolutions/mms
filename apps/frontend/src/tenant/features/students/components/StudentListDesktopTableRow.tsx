import { calcAge, formatDate, primaryResponsibleAdultDisplayName } from "@mms/shared";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  | "isFieldEnabled"
  | "columnRegistry"
  | "onSelectOne"
  | "onRowClick"
  | "onViewStudent"
  | "onEdit"
  | "onDelete"
  | "onRestore"
  | "onOpenComposer"
> & {
  studentRow: NonNullable<StudentListTableProps["paginatedStudents"]>[number];
  rowIndex: number;
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
  isFieldEnabled,
  columnRegistry,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListDesktopTableRowProps) {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const studentIdStr = String(studentRow.id);
  const isSelected = selectedIds.includes(studentIdStr);
  const age = calcAge(studentRow.dob);
  const sessionNames = sessions
    .filter((session) => studentRow.enrolledSessions?.includes(session.id))
    .map((session) => session.name);
  const genderLabel = isFieldEnabled("gender") && studentRow.gender
    ? formatContactGenderLabel(studentRow.gender, t)
    : "";
  const customColumns = columnRegistry.filter(
    (col) => col.key.startsWith("custom:") && isColumnVisible(col.key),
  );

  return (
    <motion.tr
      key={studentIdStr}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
      onClick={(event) => onRowClick(event, studentRow)}
      className={`hover:bg-muted/20 cursor-pointer transition-colors group ${
        isSelected ? "bg-primary/5" : ""
      }`}
    >
      <td className="px-4 py-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectOne(studentIdStr)}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar id={studentIdStr} name={studentRow.name || ""} className="w-8 h-8 rounded-full text-xs font-bold" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {studentRow.name}
              </p>
              <GrBadge grNumber={studentRow.grNumber} />
            </div>
            <p className="text-xs text-muted-foreground">
              {genderLabel ? `${genderLabel} · ` : ""}{studentRow.phone || t("students.list.noPhone")}
            </p>
          </div>
        </div>
      </td>
      {isColumnVisible("dob") ? (
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-sm font-medium text-foreground">
            {age ? t("students.list.ageYears", { age }) : emptyDash}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(studentRow.dob, true)}
          </p>
        </td>
      ) : null}
      {isColumnVisible("parents") ? (
        <td className="px-4 py-3 hidden md:table-cell">
          <p className="text-sm text-foreground">
            {primaryResponsibleAdultDisplayName(studentRow) || emptyDash}
          </p>
        </td>
      ) : null}
      {isColumnVisible("sessions") ? (
        <td className="px-4 py-3 hidden lg:table-cell">
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
        </td>
      ) : null}
      {isColumnVisible("status") ? (
        <td className="px-4 py-3 hidden sm:table-cell">
          <StatusBadge status={studentRow.status || "active"} config={statusBadgeConfig} />
        </td>
      ) : null}
      {customColumns.map((col) => {
        const fieldKey = studentCustomFieldKeyFromColumn(col.key);
        const raw = fieldKey
          ? (studentRow as Record<string, unknown>)[fieldKey]
          : undefined;
        return (
          <td key={col.key} className="px-4 py-3 hidden xl:table-cell">
            <p className="text-sm text-foreground truncate">
              {formatStudentListCustomValue(raw, t)}
            </p>
          </td>
        );
      })}
      <td className="px-4 py-3">
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
      </td>
    </motion.tr>
  );
}
