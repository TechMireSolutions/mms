import { motion } from "framer-motion";
import { calcAge, formatDate, toTitleCase } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

type StudentListMobileRowsProps = Pick<
  StudentListTableProps,
  | "paginatedStudents"
  | "sessions"
  | "selectedIds"
  | "showDob"
  | "showParents"
  | "showSessions"
  | "showStatus"
  | "showDeleted"
  | "canWrite"
  | "canDelete"
  | "statusBadgeConfig"
  | "isFieldEnabled"
  | "onSelectOne"
  | "onRowClick"
  | "onViewStudent"
  | "onEdit"
  | "onDelete"
  | "onRestore"
  | "onOpenComposer"
>;

export function StudentListMobileRows({
  paginatedStudents,
  sessions,
  selectedIds,
  showDob,
  showParents,
  showSessions,
  showStatus,
  showDeleted,
  canWrite,
  canDelete,
  statusBadgeConfig,
  isFieldEnabled,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListMobileRowsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3 md:hidden">
      {paginatedStudents.map((studentCard, rowIndex) => {
        const studentIdStr = String(studentCard.id);
        const isSelected = selectedIds.includes(studentIdStr);
        const age = calcAge(studentCard.dob);
        const sessionNames = sessions
          .filter((session) => studentCard.enrolledSessions?.includes(session.id))
          .map((session) => session.name);

        return (
          <motion.article
            key={studentIdStr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(rowIndex * 0.03, 0.2) }}
            onClick={(event) => onRowClick(event, studentCard)}
            className={`space-y-3 rounded-xl border border-border bg-card p-3 cursor-pointer ${
              isSelected ? "ring-1 ring-primary/20" : ""
            }`}
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelectOne(studentIdStr)}
                  aria-label={t("students.columns.name")}
                />
                <div className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="h-8 w-8 shrink-0 rounded-full text-xs font-bold" />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="min-w-0 truncate text-sm font-semibold text-foreground">{studentCard.name}</p>
                      <span className="shrink-0"><GrBadge grNumber={studentCard.grNumber} /></span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {isFieldEnabled("gender") && studentCard.gender ? `${toTitleCase(studentCard.gender)} · ` : ""}{studentCard.phone || t("students.list.noPhone")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {showStatus && <StatusBadge status={studentCard.status || "active"} config={statusBadgeConfig} size="sm" />}
                <StudentListActionsMenu
                  student={studentCard}
                  studentId={studentIdStr}
                  showDeleted={showDeleted}
                  canWrite={canWrite}
                  canDelete={canDelete}
                  includeMessaging
                  triggerClassName="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  contentClassName="w-44"
                  iconClassName="w-3.5 h-3.5"
                  onViewStudent={onViewStudent}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onOpenComposer={onOpenComposer}
                />
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {showDob && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.columns.dob")}</dt>
                  <dd className="text-foreground">
                    {age ? t("students.list.ageYears", { age }) : "—"}
                    {studentCard.dob && (
                      <span className="block text-xs text-muted-foreground">{formatDate(studentCard.dob, true)}</span>
                    )}
                  </dd>
                </div>
              )}
              {showParents && isFieldEnabled("fatherLink") && studentCard.fatherName && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.father")}</dt>
                  <dd className="text-foreground truncate">{studentCard.fatherName}</dd>
                </div>
              )}
              {showParents && isFieldEnabled("motherLink") && studentCard.motherName && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.mother")}</dt>
                  <dd className="text-foreground truncate">{studentCard.motherName}</dd>
                </div>
              )}
              {showParents && isFieldEnabled("guardianLink") && studentCard.guardianName && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.detail.guardian")}</dt>
                  <dd className="text-foreground truncate">{studentCard.guardianName}</dd>
                </div>
              )}
              {showSessions && (
                <div className={showDob && showParents ? "sm:col-span-2" : ""}>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("students.columns.sessions")}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {sessionNames.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">{t("students.list.notEnrolled")}</span>
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
                  </dd>
                </div>
              )}
            </dl>
          </motion.article>
        );
      })}
    </div>
  );
}
