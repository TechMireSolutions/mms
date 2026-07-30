import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { calcAge, toTitleCase } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListCards({
  paginatedStudents,
  selectedIds,
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
}: StudentListCardsProps) {
  const { t } = useTranslation();

  if (paginatedStudents.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title={t("students.list.emptyTitle")}
        description={t("students.list.emptyDesc")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginatedStudents.map((studentCard) => {
        const studentIdStr = String(studentCard.id);
        const isSelected = selectedIds.includes(studentIdStr);
        const age = calcAge(studentCard.dob);

        return (
          <motion.div
            key={studentIdStr}
            onClick={(event) => onRowClick(event, studentCard)}
            className={`relative rounded-2xl border bg-card/40 backdrop-blur-xl p-5 hover:shadow-md transition-all group cursor-pointer ${
              isSelected ? "border-primary bg-primary/[0.015]" : "border-border/50 hover:border-primary/20"
            }`}
          >
            <div className="absolute top-3 start-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectOne(studentIdStr)}
              />
            </div>
            <div className="absolute top-3 end-3">
              <StudentListActionsMenu
                student={studentCard}
                studentId={studentIdStr}
                showDeleted={showDeleted}
                canWrite={canWrite}
                canDelete={canDelete}
                triggerClassName="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                contentClassName="w-40"
                iconClassName="w-3.5 h-3.5"
                onViewStudent={onViewStudent}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
              />
            </div>

            <div className="flex flex-col items-center text-center mt-3 mb-4">
              <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="w-12 h-12 rounded-full text-sm font-bold shadow-sm" />
              <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors truncate w-full max-w-[9.375rem]">
                {studentCard.name}
              </h4>
              <GrBadge grNumber={studentCard.grNumber} className="mt-1" />
            </div>

            <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
              {isFieldEnabled("gender") && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("students.gender")}:</span>
                  <span className="font-semibold text-foreground">{studentCard.gender ? toTitleCase(studentCard.gender) : "—"}</span>
                </div>
              )}
              {isFieldEnabled("dob") && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("students.columns.dob")}:</span>
                  <span className="font-semibold text-foreground">{age ? t("students.list.ageYears", { age }) : "—"}</span>
                </div>
              )}
              {isFieldEnabled("fatherLink") && studentCard.fatherName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("students.detail.father")}:</span>
                  <span className="font-semibold text-foreground truncate max-w-[6.25rem]">{studentCard.fatherName}</span>
                </div>
              )}
              {isFieldEnabled("guardianLink") && studentCard.guardianName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("students.detail.guardian")}:</span>
                  <span className="font-semibold text-foreground truncate max-w-[6.25rem]">{studentCard.guardianName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("students.columns.status")}:</span>
                <StatusBadge status={studentCard.status || "active"} config={statusBadgeConfig} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
