import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ExaminationsRowActions } from "@/tenant/features/examinations/components/ExaminationsRowActions";
import {
  getExamMeta,
  type ExaminationsListContentProps,
} from "@/tenant/features/examinations/components/examinationsListContentShared";

type ExaminationsListTableProps = ExaminationsListContentProps;

export function ExaminationsListTable(props: ExaminationsListTableProps): React.JSX.Element {
  const {
    exams,
    selectedIds,
    isColumnVisible,
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
  } = props;
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
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
            {isColumnVisible("name") && (
              <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.name")}
              </ResizableTableHead>
            )}
            {isColumnVisible("subject") && (
              <ResizableTableHead columnKey="subject" width={getColumnWidth?.("subject")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.subject")}
              </ResizableTableHead>
            )}
            {isColumnVisible("date") && (
              <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.date")}
              </ResizableTableHead>
            )}
            {isColumnVisible("duration") && (
              <ResizableTableHead columnKey="duration" width={getColumnWidth?.("duration")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.duration")}
              </ResizableTableHead>
            )}
            {isColumnVisible("status") && (
              <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.status")}
              </ResizableTableHead>
            )}
            {isColumnVisible("totalMarks") && (
              <ResizableTableHead columnKey="totalMarks" width={getColumnWidth?.("totalMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.totalMarks")}
              </ResizableTableHead>
            )}
            {isColumnVisible("passingMarks") && (
              <ResizableTableHead columnKey="passingMarks" width={getColumnWidth?.("passingMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {t("examinations.columns.exam.passingMarks")}
              </ResizableTableHead>
            )}
            {isColumnVisible("classes") && (
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
            const { assignedClasses } = getExamMeta(exam, classes, enrollments);

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
                {isColumnVisible("name") && (
                  <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{exam.name}</td>
                )}
                {isColumnVisible("subject") && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">{exam.subject}</td>
                )}
                {isColumnVisible("date") && (
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.date, true)}</td>
                )}
                {isColumnVisible("duration") && (
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {t("examinations.durationMinutes", { minutes: exam.duration })}
                  </td>
                )}
                {isColumnVisible("status") && (
                  <td className="px-4 py-3">
                    <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                  </td>
                )}
                {isColumnVisible("totalMarks") && (
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{exam.totalMarks}</td>
                )}
                {isColumnVisible("passingMarks") && (
                  <td className="px-4 py-3 text-sm text-foreground">{exam.passingMarks}</td>
                )}
                {isColumnVisible("classes") && (
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
  );
}
