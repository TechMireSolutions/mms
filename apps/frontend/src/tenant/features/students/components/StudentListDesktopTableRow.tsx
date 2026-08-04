import { calcAge, formatDate, toTitleCase } from "@mms/shared";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentListDesktopTableRowProps = Pick<
  StudentListTableProps,
  | "sessions"
  | "selectedIds"
  | "showDob"
  | "showParents"
  | "showSessions"
  | "showStatus"
  | "showDeleted"
  | "canWrite"
  | "canDelete"
  | "canWriteMessaging"
  | "statusBadgeConfig"
  | "isFieldEnabled"
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
  showDob,
  showParents,
  showSessions,
  showStatus,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusBadgeConfig,
  isFieldEnabled,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListDesktopTableRowProps) {
  const { t } = useTranslation();
  const studentIdStr = String(studentRow.id);
  const isSelected = selectedIds.includes(studentIdStr);
  const age = calcAge(studentRow.dob);
  const sessionNames = sessions
    .filter((session) => studentRow.enrolledSessions?.includes(session.id))
    .map((session) => session.name);

  return (
    <motion.tr
      key={studentIdStr}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
      onClick={(event) => onRowClick(event, studentRow)}
      className={`hover:bg-muted/20 cursor-pointer transition-colors group ${
        isSelected ? "bg-primary/[0.015]" : ""
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
              {isFieldEnabled("gender") && studentRow.gender ? `${toTitleCase(studentRow.gender)} · ` : ""}{studentRow.phone || t("students.list.noPhone")}
            </p>
          </div>
        </div>
      </td>
      {showDob && (
        <td className="px-4 py-3 hidden sm:table-cell">
          <p className="text-sm font-medium text-foreground">
            {age ? t("students.list.ageYears", { age }) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(studentRow.dob, true)}
          </p>
        </td>
      )}
      {showParents && (
        <td className="px-4 py-3 hidden md:table-cell">
          {isFieldEnabled("fatherLink") && (
            <p className="text-sm text-foreground">
              {studentRow.fatherName || "—"}
            </p>
          )}
          {isFieldEnabled("motherLink") && (
            <p className="text-xs text-muted-foreground">
              {studentRow.motherName || "—"}
            </p>
          )}
          {isFieldEnabled("guardianLink") && (
            <p className="text-xs text-muted-foreground">
              {studentRow.guardianName || "—"}
            </p>
          )}
        </td>
      )}
      {showSessions && (
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
      )}
      {showStatus && (
        <td className="px-4 py-3 hidden sm:table-cell">
          <StatusBadge status={studentRow.status || "active"} config={statusBadgeConfig} />
        </td>
      )}
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
