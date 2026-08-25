import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { MODULE_ROW_ACTIONS_TRIGGER_CLASS } from "@/components/ui/ModuleRowActionsMenu";
import { ModuleWorkTableHeader } from "@/components/ui/ModuleWorkTableHeader";
import {
  Table,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import { ExaminationsRowActions } from "@/tenant/features/examinations/components/ExaminationsRowActions";
import {
  getExamMeta,
  type ExaminationsListContentProps,
} from "@/tenant/features/examinations/components/examinationsListContentShared";

type ExaminationsListDesktopTableProps = ExaminationsListContentProps;

export function ExaminationsListDesktopTable(props: ExaminationsListDesktopTableProps): React.JSX.Element {
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
      <ModuleWorkTableHeader
        columns={[
          isColumnVisible("name") ? { id: "name", label: t("examinations.columns.exam.name"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("subject") ? { id: "subject", label: t("examinations.columns.exam.subject"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("date") ? { id: "date", label: t("examinations.columns.exam.date"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("duration") ? { id: "duration", label: t("examinations.columns.exam.duration"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("status") ? { id: "status", label: t("examinations.columns.exam.status"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("totalMarks") ? { id: "totalMarks", label: t("examinations.columns.exam.totalMarks"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("passingMarks") ? { id: "passingMarks", label: t("examinations.columns.exam.passingMarks"), headerClassName: "whitespace-nowrap" } : null,
          isColumnVisible("classes") ? { id: "classes", label: t("examinations.columns.exam.classes"), headerClassName: "whitespace-nowrap" } : null,
        ].filter((c): c is Exclude<typeof c, null> => c !== null)}
        getColumnWidth={(key) => getColumnWidth?.(key)}
        setColumnWidth={onColumnResize ?? (() => {})}
        selection={canDelete ? {
          allSelected: allVisibleSelected,
          someSelected: someVisibleSelected,
          onSelectAll: () => onToggleSelectAll(!allVisibleSelected),
          ariaLabel: t("examinations.trash.selectAll")
        } : undefined}
        actionsLabel={t("examinations.columns.actions")}
      />
      <TableBody className="divide-y divide-border/50">
        {exams.map((exam, index) => {
          const { assignedClasses } = getExamMeta(exam, classes, enrollments);
          const isSelected = selectedIds.includes(exam.id);

          return (
            <motion.tr 
              key={exam.id} 
              onClick={() => props.onRowClick?.(exam.id)}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: index * 0.03 }} 
              className={`hover:bg-muted/50 cursor-pointer transition-colors group ${isSelected ? "bg-primary/5" : ""}`}
            >
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
                <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-cell-sm truncate">
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
