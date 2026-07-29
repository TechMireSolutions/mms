import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Edit2, BookOpen, Calendar, Clock, Users, CheckCircle, AlertCircle, Circle,
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
  return (
    <section className="space-y-4" aria-label={t("examinations.exams")}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="search-exams"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("examinations.searchExams")}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
        <>
          {/* Card view for mobile/tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:hidden" role="list" aria-label={t("examinations.exams")}>
            {filtered.map((exam, index) => {
              const { assignedClasses, studentCount } = renderExamMeta(exam);
              return (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.04 }}
                  className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/95 via-card/80 to-background/60 backdrop-blur-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
                  role="listitem"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      {showStatus && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <StatusBadge status={exam.status} config={statusConfig} size="sm" />
                        </div>
                      )}
                      {showName && (
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {exam.name}
                        </h3>
                      )}
                      {showSubject && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{exam.subject}</p>
                      )}
                    </div>
                    {canWrite && !showDeleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => onEdit(exam)}
                        aria-label={t("examinations.editExamAria", { name: exam.name })}
                        className="rounded-lg hover:bg-muted text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-all"
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
                        className="rounded-lg hover:bg-muted text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-all"
                      >
                        {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      </Button>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>
                  )}

                  {(() => {
                    const pills = [
                      { key: "date", show: showDate, icon: Calendar, label: formatDate(exam.date, true) },
                      { key: "duration", show: showDuration, icon: Clock, label: t("examinations.durationMinutes", { minutes: exam.duration }) },
                      { key: "classes", show: showClasses, icon: Users, label: t("examinations.studentCount", { count: studentCount }) },
                    ].filter((pill) => pill.show);

                    if (pills.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-2" aria-hidden="true">
                        {pills.map(({ icon: Icon, label, key }) => (
                          <div key={key} className="rounded-lg bg-muted/40 px-2 py-1.5 flex items-center gap-1.5 min-w-0 max-w-full">
                            <Icon className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">{label}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {showClasses && assignedClasses.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5" role="list" aria-label={t("examinations.columns.exam.classes")}>
                      {assignedClasses.map((sessionClass) => (
                        <span key={sessionClass.id} className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full" role="listitem">
                          {sessionClass.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {(showTotalMarks || showPassingMarks) && (
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      {showTotalMarks ? (
                        <span>{t("examinations.totalMarksLabel")}: <strong className="text-foreground">{exam.totalMarks}</strong></span>
                      ) : <span />}
                      {showPassingMarks && (
                        <span>{t("examinations.passLabel")}: <strong className="text-foreground">{exam.passingMarks}</strong></span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Table view for desktop */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
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
                      <ResizableTableHead columnKey="name" width={getColumnWidth?.("name")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.name")}
                      </ResizableTableHead>
                    )}
                    {showSubject && (
                      <ResizableTableHead columnKey="subject" width={getColumnWidth?.("subject")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.subject")}
                      </ResizableTableHead>
                    )}
                    {showDate && (
                      <ResizableTableHead columnKey="date" width={getColumnWidth?.("date")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.date")}
                      </ResizableTableHead>
                    )}
                    {showDuration && (
                      <ResizableTableHead columnKey="duration" width={getColumnWidth?.("duration")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.duration")}
                      </ResizableTableHead>
                    )}
                    {showStatus && (
                      <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.status")}
                      </ResizableTableHead>
                    )}
                    {showTotalMarks && (
                      <ResizableTableHead columnKey="totalMarks" width={getColumnWidth?.("totalMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.totalMarks")}
                      </ResizableTableHead>
                    )}
                    {showPassingMarks && (
                      <ResizableTableHead columnKey="passingMarks" width={getColumnWidth?.("passingMarks")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.passingMarks")}
                      </ResizableTableHead>
                    )}
                    {showClasses && (
                      <ResizableTableHead columnKey="classes" width={getColumnWidth?.("classes")} onResize={onColumnResize} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t("examinations.columns.exam.classes")}
                      </ResizableTableHead>
                    )}
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
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
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                            {assignedClasses.map((sessionClass) => sessionClass.name).join(", ") || "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                            {canWrite && !showDeleted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => onEdit(exam)}
                                aria-label={t("examinations.editExamAria", { name: exam.name })}
                                className="rounded-lg hover:bg-muted text-muted-foreground transition-all focus:opacity-100"
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
                                className="rounded-lg hover:bg-muted text-muted-foreground transition-all focus:opacity-100"
                              >
                                {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
