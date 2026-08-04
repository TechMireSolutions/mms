import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ExaminationsRowActions } from "@/tenant/features/examinations/components/ExaminationsRowActions";
import {
  getExamMeta,
  type ExaminationsListContentProps,
} from "@/tenant/features/examinations/components/examinationsListContentShared";

type ExaminationsListCardsProps = Omit<
  ExaminationsListContentProps,
  "allFilteredSelected" | "getColumnWidth" | "onColumnResize" | "onSelectAll"
>;

export function ExaminationsListCards(props: ExaminationsListCardsProps): React.JSX.Element {
  const {
    exams,
    selectedIds,
    isColumnVisible,
    classes,
    enrollments,
    canWrite,
    canDelete,
    showDeleted,
    canTrashRows,
    statusConfig,
    onEdit,
    onToggleSelected,
    onTrashAction,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3" role="list" aria-label={t("examinations.exams")}>
      {exams.map((exam, index) => {
        const { assignedClasses, studentCount } = getExamMeta(exam, classes, enrollments);

        return (
          <motion.article
            key={exam.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
            role="listitem"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                {isColumnVisible("name") && <h4 className="truncate text-sm font-semibold text-foreground">{exam.name}</h4>}
                {isColumnVisible("subject") && <p className="truncate text-xs text-muted-foreground">{exam.subject}</p>}
              </div>
              {isColumnVisible("status") && (
                <div className="shrink-0">
                  <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                </div>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {isColumnVisible("date") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.date")}</dt>
                  <dd className="text-foreground">{formatDate(exam.date, true)}</dd>
                </div>
              )}
              {isColumnVisible("duration") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.duration")}</dt>
                  <dd className="text-foreground">{t("examinations.durationMinutes", { minutes: exam.duration })}</dd>
                </div>
              )}
              {isColumnVisible("totalMarks") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.totalMarks")}</dt>
                  <dd className="font-semibold text-foreground">{exam.totalMarks}</dd>
                </div>
              )}
              {isColumnVisible("passingMarks") && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.passingMarks")}</dt>
                  <dd className="text-foreground">{exam.passingMarks}</dd>
                </div>
              )}
              {isColumnVisible("classes") && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.classes")}</dt>
                  <dd className="text-foreground">
                    {assignedClasses.length > 0
                      ? assignedClasses.map((sessionClass) => sessionClass.name).join(", ")
                      : "—"}
                  </dd>
                  <dd className="text-xs text-muted-foreground">{t("examinations.studentCount", { count: studentCount })}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
              {canDelete ? (
                <Checkbox
                  checked={selectedIds.includes(exam.id)}
                  onCheckedChange={() => onToggleSelected(exam.id)}
                  aria-label={t("examinations.trash.selectExam", { name: exam.name })}
                />
              ) : <span />}
              <ExaminationsRowActions
                exam={exam}
                canWrite={canWrite}
                canDelete={canTrashRows}
                showDeleted={showDeleted}
                onEdit={onEdit}
                onTrashAction={onTrashAction}
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
