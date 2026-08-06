import { motion } from "framer-motion";
import { calcAge, primaryResponsibleAdultDisplayName } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentListActionsMenu } from "@/tenant/features/students/components/StudentListActionsMenu";
import {
  formatStudentListCustomValue,
  studentCustomFieldKeyFromColumn,
} from "@/tenant/features/students/components/studentListCustomColumns";
import type { StudentListCardsProps } from "@/tenant/features/students/components/StudentListContentTypes";

export function StudentListCards({
  paginatedStudents,
  selectedIds,
  allSelected,
  someSelected,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  statusBadgeConfig,
  isColumnVisible,
  isFieldEnabled,
  columnRegistry,
  onSelectAll,
  onSelectOne,
  onRowClick,
  onViewStudent,
  onEdit,
  onDelete,
  onRestore,
  onOpenComposer,
}: StudentListCardsProps) {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const pageCountLabel = `${paginatedStudents.length} ${t("nav.students").toLowerCase()}`;
  const customColumns = columnRegistry.filter(
    (col) => col.key.startsWith("custom:") && isColumnVisible(col.key),
  );

  return (
    <>
      {paginatedStudents.length > 0 ? (
        <div className={cn(WORK_SURFACE, "mb-3.5 flex items-center justify-between border-border/40 px-4 py-3")}>
          <div className="flex items-center gap-2.5">
            <div className="flex min-h-11 min-w-11 items-center justify-center">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
                id="students-select-all-cards"
              />
            </div>
            <label
              htmlFor="students-select-all-cards"
              className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-foreground transition-colors"
            >
              {allSelected ? t("contacts.deselect") : t("contacts.table.selectAll")}
            </label>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/10">
            {selectedIds.length > 0 ? (
              <>
                {t("contacts.selectedCount", { count: selectedIds.length })}
                <span className="mx-1.5 text-border" aria-hidden="true">·</span>
                {pageCountLabel}
              </>
            ) : (
              pageCountLabel
            )}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedStudents.map((studentCard) => {
          const studentIdStr = String(studentCard.id);
          const isSelected = selectedIds.includes(studentIdStr);
          const age = calcAge(studentCard.dob);
          const parentName = primaryResponsibleAdultDisplayName(studentCard);

          return (
            <motion.div
              key={studentIdStr}
              onClick={(event) => onRowClick(event, studentCard)}
              className={`relative ${WORK_SURFACE} p-5 hover:shadow-md transition-all group cursor-pointer ${
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/20"
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
                  includeMessaging={canWriteMessaging && !showDeleted}
                  triggerClassName="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  contentClassName="w-40"
                  iconClassName="w-3.5 h-3.5"
                  onViewStudent={onViewStudent}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onOpenComposer={onOpenComposer}
                />
              </div>

              <div className="flex flex-col items-center text-center mt-3 mb-4">
                <UserAvatar id={studentIdStr} name={studentCard.name || ""} className="w-12 h-12 rounded-full text-sm font-bold shadow-sm" />
                <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors truncate w-full max-w-36">
                  {studentCard.name}
                </h4>
                <GrBadge grNumber={studentCard.grNumber} className="mt-1" />
              </div>

              <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
                {isFieldEnabled("gender") ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("students.gender")}:</span>
                    <span className="font-semibold text-foreground">
                      {studentCard.gender ? formatContactGenderLabel(studentCard.gender, t) : emptyDash}
                    </span>
                  </div>
                ) : null}
                {isColumnVisible("dob") ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("students.columns.dob")}:</span>
                    <span className="font-semibold text-foreground">
                      {age ? t("students.list.ageYears", { age }) : emptyDash}
                    </span>
                  </div>
                ) : null}
                {isColumnVisible("parents") && parentName ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("students.columns.parents")}:</span>
                    <span className="font-semibold text-foreground truncate max-w-24">
                      {parentName}
                    </span>
                  </div>
                ) : null}
                {isColumnVisible("status") ? (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("students.columns.status")}:</span>
                    <StatusBadge status={studentCard.status || "active"} config={statusBadgeConfig} />
                  </div>
                ) : null}
                {customColumns.map((col) => {
                  const fieldKey = studentCustomFieldKeyFromColumn(col.key);
                  const raw = fieldKey
                    ? (studentCard as Record<string, unknown>)[fieldKey]
                    : undefined;
                  return (
                    <div key={col.key} className="flex justify-between gap-2">
                      <span className="text-muted-foreground truncate">{col.label}:</span>
                      <span className="font-semibold text-foreground truncate max-w-24">
                        {formatStudentListCustomValue(raw, t)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
