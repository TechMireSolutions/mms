import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    allVisibleSelected,
    someVisibleSelected,
    canWrite,
    canDelete,
    showDeleted,
    canTrashRows,
    statusConfig,
    getColumnWidth,
    onColumnResize,
    onEdit,
    onToggleSelectAll,
    onToggleSelectedExam,
    onTrashAction,
  } = props;
  const { t } = useTranslation();

  return (
    <Table className="table-fixed">
      <caption className="sr-only">{t("examinations.exams")}</caption>
      <TableHeader>
        <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
          {canDelete && (
            <TableHead className="px-3 py-2.5 w-10 h-auto">
              <Checkbox
                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                aria-label={t("examinations.trash.selectAll")}
              />
            </TableHead>
          )}
          {isColumnVisible("name") && (
            <ModuleTableHeaderCell columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.name")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("subject") && (
            <ModuleTableHeaderCell columnKey="subject" width={getColumnWidth?.("subject")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.subject")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("date") && (
            <ModuleTableHeaderCell columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.date")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("duration") && (
            <ModuleTableHeaderCell columnKey="duration" width={getColumnWidth?.("duration")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.duration")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("status") && (
            <ModuleTableHeaderCell columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.status")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("totalMarks") && (
            <ModuleTableHeaderCell columnKey="totalMarks" width={getColumnWidth?.("totalMarks")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.totalMarks")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("passingMarks") && (
            <ModuleTableHeaderCell columnKey="passingMarks" width={getColumnWidth?.("passingMarks")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.passingMarks")}
            </ModuleTableHeaderCell>
          )}
          {isColumnVisible("classes") && (
            <ModuleTableHeaderCell columnKey="classes" width={getColumnWidth?.("classes")} onResize={onColumnResize} className="px-4 py-2.5 whitespace-nowrap">
              {t("examinations.columns.exam.classes")}
            </ModuleTableHeaderCell>
          )}
          <TableHead className="px-4 py-2.5 text-end h-auto">
            <span className="sr-only">{t("examinations.columns.actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/50">
        {exams.map((exam, index) => {
          const { assignedClasses } = getExamMeta(exam, classes, enrollments);
          const isSelected = selectedIds.includes(exam.id);

          return (
            <motion.tr key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className={`hover:bg-muted/20 transition-colors group ${isSelected ? "bg-primary/5" : ""}`}>
              {canDelete && (
                <TableCell className="px-3 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelectedExam(exam.id, checked === true)}
                    aria-label={t("examinations.trash.selectExam", { name: exam.name })}
                  />
                </TableCell>
              )}
              {isColumnVisible("name") && (
                <TableCell className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{exam.name}</TableCell>
              )}
              {isColumnVisible("subject") && (
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">{exam.subject}</TableCell>
              )}
              {isColumnVisible("date") && (
                <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.date, true)}</TableCell>
              )}
              {isColumnVisible("duration") && (
                <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {t("examinations.durationMinutes", { minutes: exam.duration })}
                </TableCell>
              )}
              {isColumnVisible("status") && (
                <TableCell className="px-4 py-3">
                  <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                </TableCell>
              )}
              {isColumnVisible("totalMarks") && (
                <TableCell className="px-4 py-3 text-sm font-bold text-foreground">{exam.totalMarks}</TableCell>
              )}
              {isColumnVisible("passingMarks") && (
                <TableCell className="px-4 py-3 text-sm text-foreground">{exam.passingMarks}</TableCell>
              )}
              {isColumnVisible("classes") && (
                <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">
                  {assignedClasses.map((sessionClass) => sessionClass.name).join(", ") || "—"}
                </TableCell>
              )}
              <TableCell className="px-4 py-3 text-end">
                <ExaminationsRowActions
                  exam={exam}
                  canWrite={canWrite}
                  canDelete={canTrashRows}
                  showDeleted={showDeleted}
                  triggerClassName={MODULE_ROW_ACTIONS_TRIGGER_CLASS}
                  onEdit={onEdit}
                  onTrashAction={onTrashAction}
                />
              </TableCell>
            </motion.tr>
          );
        })}
      </TableBody>
    </Table>
  );
}
