import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Edit2, BookOpen, Calendar, CheckCircle, AlertCircle, Circle,
  Search, Filter, ChevronDown, Trash2, RotateCcw
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Exam } from '@/lib/data/examinationData';
import { formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  upcoming: Circle,
  ongoing: AlertCircle,
  completed: CheckCircle,
  scheduled: Calendar,
  cancelled: Circle,
};

const EXAM_STATUSES = ["upcoming", "ongoing", "completed", "scheduled", "cancelled"] as const;


interface ExamsListProps {
  exams: Exam[];
  onNew: () => void;
  onEdit: (exam: Exam) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  listLayout?: boolean;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

/**
 * Renders the dashboard list of created exams (cards or table).
 */
export default function ExamsList({
  exams,
  onNew,
  onEdit,
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  listLayout: _listLayout = false,
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: ExamsListProps): React.ReactElement {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();
  const classes = React.useMemo(
    () => sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({
        id: sessionClass.id,
        name: `${session.name} - ${sessionClass.name}`,
      })),
    ),
    [sessions],
  );

  const statusLabels = useMemo(
    () => ({
      upcoming: t("examinations.status.upcoming"),
      ongoing: t("examinations.status.ongoing"),
      completed: t("examinations.status.completed"),
      scheduled: t("examinations.status.scheduled"),
      cancelled: t("examinations.status.cancelled"),
    }),
    [t],
  );

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const searchText = search.toLowerCase();
      const matchSearch = !searchText
        || exam.name.toLowerCase().includes(searchText)
        || exam.subject.toLowerCase().includes(searchText);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(exam.status);
      return matchSearch && matchStatus;
    });
  }, [exams, search, filterStatus]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) onNew();
    // Intentionally omit onNew — parent passes a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createRequestKey drives open
  }, [createRequestKey, canWrite, showDeleted]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const toggleStatus = (status: string) =>
    setFilterStatus((currentStatuses) => (currentStatuses.includes(status) ? currentStatuses.filter((candidate) => candidate !== status) : [...currentStatuses, status]));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((exam) => selectedIds.includes(exam.id));

  const handleRowTrashAction = async (id: string) => {
    if (showDeleted) {
      if (!confirm(t("examinations.trash.bulkRestoreConfirm", { count: 1 }))) return;
      await onRestore?.(id);
      return;
    }
    if (!confirm(t("examinations.trash.deleteConfirm"))) return;
    await onDelete?.(id);
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("examinations.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("examinations.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  const showName = isColumnVisible ? isColumnVisible("name") : true;
  const showSubject = isColumnVisible ? isColumnVisible("subject") : true;
  const showDate = isColumnVisible ? isColumnVisible("date") : true;
  const showDuration = isColumnVisible ? isColumnVisible("duration") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;
  const showTotalMarks = isColumnVisible ? isColumnVisible("totalMarks") : true;
  const showPassingMarks = isColumnVisible ? isColumnVisible("passingMarks") : true;
  const showClasses = isColumnVisible ? isColumnVisible("classes") : true;

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    upcoming:  { label: statusLabels.upcoming,  cls: SEMANTIC_BADGE.info },
    ongoing:   { label: statusLabels.ongoing,   cls: SEMANTIC_BADGE.warning },
    completed: { label: statusLabels.completed, cls: SEMANTIC_BADGE.success },
    scheduled: { label: statusLabels.scheduled, cls: 'bg-primary/10 text-primary border-primary/20' },
    cancelled: { label: statusLabels.cancelled, cls: SEMANTIC_BADGE.muted },
  }), [statusLabels]);

  const renderExamMeta = (exam: Exam) => {
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
    const StatusIcon = STATUS_ICONS[exam.status] || Circle;
    return { assignedClasses, studentCount, StatusIcon };
  };

  const renderExamActions = (exam: Exam) => (
    <div className="flex flex-wrap items-center gap-1">
      {canWrite && !showDeleted && (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => onEdit(exam)}
          aria-label={t("examinations.editExamAria", { name: exam.name })}
          className="rounded-lg hover:bg-muted text-muted-foreground transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
      {canDelete && (showDeleted ? onRestore : onDelete) && (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => { void handleRowTrashAction(exam.id); }}
          aria-label={showDeleted ? t("examinations.trash.restore") : t("common.delete")}
          className="rounded-lg hover:bg-muted text-muted-foreground transition-all"
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </Button>
      )}
    </div>
  );
  return (
    <section className="space-y-4" aria-label={t("examinations.exams")}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="search-exams"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("examinations.searchExams")}
            className="w-full min-w-0 ps-10 pe-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
            >
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              {t("examinations.filter.status")}
              {filterStatus.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {filterStatus.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">{t("examinations.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {EXAM_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem key={status} checked={filterStatus.includes(status)} onCheckedChange={() => toggleStatus(status)}>
                {statusLabels[status]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-wrap items-center gap-2">
          {columnCustomizer && (
            <ModuleColumnCustomizer
              columnRegistry={columnCustomizer.columnRegistry}
              updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
              labels={columnCustomizer.labels}
            />
          )}
          {canDelete && selectedIds.length > 0 && (
            <Button
              type="button"
              variant={showDeleted ? "outline" : "destructive"}
              onClick={() => { void handleBulkAction(); }}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
              {showDeleted ? t("examinations.trash.restore") : t("common.delete")} ({selectedIds.length})
            </Button>
          )}
          {canWrite && !showDeleted && (
            <Button
              type="button"
              onClick={onNew}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              {t("examinations.newExam")}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center rounded-xl border-2 border-dashed border-border" role="status">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{t("examinations.empty.exams")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("examinations.empty.examsHint")}</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="space-y-3 p-3 md:hidden" role="list" aria-label={t("examinations.exams")}>
            {filtered.map((exam, index) => {
              const { assignedClasses, studentCount } = renderExamMeta(exam);
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
                      {showName && <h4 className="truncate text-sm font-semibold text-foreground">{exam.name}</h4>}
                      {showSubject && <p className="truncate text-xs text-muted-foreground">{exam.subject}</p>}
                    </div>
                    {showStatus && (
                      <div className="shrink-0">
                        <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                      </div>
                    )}
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {showDate && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.date")}</dt>
                        <dd className="text-foreground">{formatDate(exam.date, true)}</dd>
                      </div>
                    )}
                    {showDuration && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.duration")}</dt>
                        <dd className="text-foreground">{t("examinations.durationMinutes", { minutes: exam.duration })}</dd>
                      </div>
                    )}
                    {showTotalMarks && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.totalMarks")}</dt>
                        <dd className="font-semibold text-foreground">{exam.totalMarks}</dd>
                      </div>
                    )}
                    {showPassingMarks && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("examinations.columns.exam.passingMarks")}</dt>
                        <dd className="text-foreground">{exam.passingMarks}</dd>
                      </div>
                    )}
                    {showClasses && (
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
                        onCheckedChange={() => toggleSelected(exam.id)}
                        aria-label={t("examinations.trash.selectExam", { name: exam.name })}
                      />
                    ) : <span />}
                    {renderExamActions(exam)}
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
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedIds(filtered.map((exam) => exam.id));
                            else setSelectedIds([]);
                          }}
                          aria-label={t("examinations.trash.selectAll")}
                        />
                      </th>
                    )}
                    {showName && (
                      <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.name")}
                      </ResizableTableHead>
                    )}
                    {showSubject && (
                      <ResizableTableHead columnKey="subject" width={getColumnWidth?.("subject")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.subject")}
                      </ResizableTableHead>
                    )}
                    {showDate && (
                      <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.date")}
                      </ResizableTableHead>
                    )}
                    {showDuration && (
                      <ResizableTableHead columnKey="duration" width={getColumnWidth?.("duration")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.duration")}
                      </ResizableTableHead>
                    )}
                    {showStatus && (
                      <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.status")}
                      </ResizableTableHead>
                    )}
                    {showTotalMarks && (
                      <ResizableTableHead columnKey="totalMarks" width={getColumnWidth?.("totalMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.totalMarks")}
                      </ResizableTableHead>
                    )}
                    {showPassingMarks && (
                      <ResizableTableHead columnKey="passingMarks" width={getColumnWidth?.("passingMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.passingMarks")}
                      </ResizableTableHead>
                    )}
                    {showClasses && (
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
                  {filtered.map((exam, index) => {
                    const { assignedClasses } = renderExamMeta(exam);
                    return (
                      <motion.tr key={exam.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                        {canDelete && (
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={selectedIds.includes(exam.id)}
                              onCheckedChange={() => toggleSelected(exam.id)}
                              aria-label={t("examinations.trash.selectExam", { name: exam.name })}
                            />
                          </td>
                        )}
                        {showName && (
                          <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{exam.name}</td>
                        )}
                        {showSubject && (
                          <td className="px-4 py-3 text-sm text-muted-foreground">{exam.subject}</td>
                        )}
                        {showDate && (
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.date, true)}</td>
                        )}
                        {showDuration && (
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {t("examinations.durationMinutes", { minutes: exam.duration })}
                          </td>
                        )}
                        {showStatus && (
                          <td className="px-4 py-3">
                            <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                          </td>
                        )}
                        {showTotalMarks && (
                          <td className="px-4 py-3 text-sm font-bold text-foreground">{exam.totalMarks}</td>
                        )}
                        {showPassingMarks && (
                          <td className="px-4 py-3 text-sm text-foreground">{exam.passingMarks}</td>
                        )}
                        {showClasses && (
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[10rem] truncate">
                            {assignedClasses.map((sessionClass) => sessionClass.name).join(", ") || "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-end">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                            {renderExamActions(exam)}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </div>
      )}
    </section>
  );
}
