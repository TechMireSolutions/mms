import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Enrollment } from "@/lib/data/enrollmentData";
import type { Exam } from "@/lib/data/examinationData";
import { ExaminationsRowActions } from "@/tenant/features/examinations/components/ExaminationsRowActions";
import { formatDate } from "@mms/shared";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface ExamClassOption {
  id: string;
  name: string;
}

export interface ExaminationsVisibleColumns {
  name: boolean;
  subject: boolean;
  date: boolean;
  duration: boolean;
  status: boolean;
  totalMarks: boolean;
  passingMarks: boolean;
  classes: boolean;
}

interface ExaminationsListContentProps {
  exams: Exam[];
  selectedIds: string[];
  visibleColumns: ExaminationsVisibleColumns;
  classes: ExamClassOption[];
  enrollments: Enrollment[];
  allFilteredSelected: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canTrashRows: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  onEdit: (exam: Exam) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleSelected: (id: string) => void;
  onTrashAction: (id: string) => void;
}

export function ExaminationsListContent({
  exams,
  selectedIds,
  visibleColumns,
  classes,
  enrollments,
  allFilteredSelected,
  canWrite,
  canDelete,
  showDeleted,
  canTrashRows,
  statusConfig,
  getColumnWidth,
  onColumnResize,
  onEdit,
  onSelectAll,
  onToggleSelected,
  onTrashAction,
}: ExaminationsListContentProps): React.JSX.Element {
  const { t } = useTranslation();

  const getExamMeta = (exam: Exam) => {
    const assignedClasses = classes.filter((sessionClass) => exam.classIds.includes(sessionClass.id));
    const classIds = new Set(exam.classIds);
    const studentCount = new Set(
      enrollments
        .filter((enrollment) =>
          classIds.has(enrollment.classId) &&
          enrollment.status !== "cancelled" &&
          enrollment.status !== "completed"
        )
        .map((enrollment) => String(enrollment.studentId)),
    ).size;
    return { assignedClasses, studentCount };
  };

  if (exams.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border-2 border-dashed border-border" role="status">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">{t("examinations.empty.exams")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("examinations.empty.examsHint")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="space-y-3 p-3 md:hidden" role="list" aria-label={t("examinations.exams")}>
        {exams.map((exam, index) => {
          const { assignedClasses, studentCount } = getExamMeta(exam);

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
                  {visibleColumns.name && <h4 className="truncate text-sm font-semibold text-foreground">{exam.name}</h4>}
                  {visibleColumns.subject && <p className="truncate text-xs text-muted-foreground">{exam.subject}</p>}
                </div>
                {visibleColumns.status && (
                  <div className="shrink-0">
                    <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {visibleColumns.date && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.date")}</dt>
                    <dd className="text-foreground">{formatDate(exam.date, true)}</dd>
                  </div>
                )}
                {visibleColumns.duration && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.duration")}</dt>
                    <dd className="text-foreground">{t("examinations.durationMinutes", { minutes: exam.duration })}</dd>
                  </div>
                )}
                {visibleColumns.totalMarks && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.totalMarks")}</dt>
                    <dd className="font-semibold text-foreground">{exam.totalMarks}</dd>
                  </div>
                )}
                {visibleColumns.passingMarks && (
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.passingMarks")}</dt>
                    <dd className="text-foreground">{exam.passingMarks}</dd>
                  </div>
                )}
                {visibleColumns.classes && (
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm table-fixed">
          <caption className="sr-only">{t("examinations.exams")}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {canDelete && (
                <th scope="col" className="px-3 py-2.5 w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={(checked) => onSelectAll(checked === true)}
                    aria-label={t("examinations.trash.selectAll")}
                  />
                </th>
              )}
              {visibleColumns.name && (
                <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.name")}
                </ResizableTableHead>
              )}
              {visibleColumns.subject && (
                <ResizableTableHead columnKey="subject" width={getColumnWidth?.("subject")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.subject")}
                </ResizableTableHead>
              )}
              {visibleColumns.date && (
                <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.date")}
                </ResizableTableHead>
              )}
              {visibleColumns.duration && (
                <ResizableTableHead columnKey="duration" width={getColumnWidth?.("duration")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.duration")}
                </ResizableTableHead>
              )}
              {visibleColumns.status && (
                <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.status")}
                </ResizableTableHead>
              )}
              {visibleColumns.totalMarks && (
                <ResizableTableHead columnKey="totalMarks" width={getColumnWidth?.("totalMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.totalMarks")}
                </ResizableTableHead>
              )}
              {visibleColumns.passingMarks && (
                <ResizableTableHead columnKey="passingMarks" width={getColumnWidth?.("passingMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.passingMarks")}
                </ResizableTableHead>
              )}
              {visibleColumns.classes && (
                <ResizableTableHead columnKey="classes" width={getColumnWidth?.("classes")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {t("examinations.columns.exam.classes")}
                </ResizableTableHead>
              )}
              <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                <span className="sr-only">{t("examinations.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {exams.map((exam, index) => {
              const { assignedClasses } = getExamMeta(exam);

              return (
                <motion.tr key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                  {canDelete && (
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selectedIds.includes(exam.id)}
                        onCheckedChange={() => onToggleSelected(exam.id)}
                        aria-label={t("examinations.trash.selectExam", { name: exam.name })}
                      />
                    </td>
                  )}
                  {visibleColumns.name && (
                    <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{exam.name}</td>
                  )}
                  {visibleColumns.subject && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">{exam.subject}</td>
                  )}
                  {visibleColumns.date && (
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.date, true)}</td>
                  )}
                  {visibleColumns.duration && (
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {t("examinations.durationMinutes", { minutes: exam.duration })}
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-4 py-3">
                      <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                    </td>
                  )}
                  {visibleColumns.totalMarks && (
                    <td className="px-4 py-3 text-sm font-bold text-foreground">{exam.totalMarks}</td>
                  )}
                  {visibleColumns.passingMarks && (
                    <td className="px-4 py-3 text-sm text-foreground">{exam.passingMarks}</td>
                  )}
                  {visibleColumns.classes && (
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">
                      {assignedClasses.map((sessionClass) => sessionClass.name).join(", ") || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                      <ExaminationsRowActions
                        exam={exam}
                        canWrite={canWrite}
                        canDelete={canTrashRows}
                        showDeleted={showDeleted}
                        onEdit={onEdit}
                        onTrashAction={onTrashAction}
                      />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
