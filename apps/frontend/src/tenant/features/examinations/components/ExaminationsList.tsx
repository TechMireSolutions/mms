import React, { useState, useMemo, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Exam } from '@/lib/data/examinationData';
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
} from "@/components/ui/BulkSelectionActions";
import {
  getDirectoryPageSelection,
  toggleIdInSelection,
  togglePageIdsInSelection,
} from "@/lib/directorySelection";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ExaminationsListContent } from "@/tenant/features/examinations/components/ExaminationsListContent";
import { ExaminationsListToolbar } from "@/tenant/features/examinations/components/ExaminationsListToolbar";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

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
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: ExamsListProps): React.ReactElement {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
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

  const toggleStatus = (status: string): void =>
    setFilterStatus((currentStatuses) => (currentStatuses.includes(status) ? currentStatuses.filter((candidate) => candidate !== status) : [...currentStatuses, status]));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => toggleIdInSelection(prev, id));
  };

  const pageIds = filtered.map((exam) => exam.id);
  const { allSelected: allFilteredSelected } = getDirectoryPageSelection(pageIds, selectedIds);

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

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    upcoming:  { label: statusLabels.upcoming,  cls: SEMANTIC_BADGE.info },
    ongoing:   { label: statusLabels.ongoing,   cls: SEMANTIC_BADGE.warning },
    completed: { label: statusLabels.completed, cls: SEMANTIC_BADGE.success },
    scheduled: { label: statusLabels.scheduled, cls: 'bg-primary/10 text-primary border-primary/20' },
    cancelled: { label: statusLabels.cancelled, cls: SEMANTIC_BADGE.muted },
  }), [statusLabels]);

  return (
    <section className="space-y-4" aria-label={t("examinations.exams")}>
      {canDelete && (
        <BulkSelectionBar
          placement="inline"
          tone="glass"
          selectedCount={selectedIds.length}
          countLabel={t("examinations.trash.selected", { count: selectedIds.length })}
          trailing={
            <BulkSelectionClearAction
              label={t("common.deselect")}
              onClick={() => setSelectedIds([])}
            />
          }
        >
          {showDeleted ? (
            <BulkSelectionRestoreAction
              label={t("examinations.trash.restore")}
              onClick={() => { void handleBulkAction(); }}
            />
          ) : (
            <BulkSelectionDeleteAction
              label={t("common.delete")}
              onClick={() => { void handleBulkAction(); }}
              icon={Trash2}
            />
          )}
        </BulkSelectionBar>
      )}

      <ExaminationsListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        filterStatus={filterStatus}
        canWrite={canWrite}
        showDeleted={showDeleted}
        columnCustomizer={columnCustomizer}
        statusLabels={statusLabels}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onNew={onNew}
      />

      <ExaminationsListContent
        viewMode={viewMode}
        exams={filtered}
        selectedIds={selectedIds}
        isColumnVisible={columnVisible}
        classes={classes}
        enrollments={enrollments}
        allFilteredSelected={allFilteredSelected}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        canTrashRows={canDelete && Boolean(showDeleted ? onRestore : onDelete)}
        statusConfig={statusConfig}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onEdit={onEdit}
        onSelectAll={(_checked) => setSelectedIds((current) => togglePageIdsInSelection(current, pageIds))}
        onToggleSelected={toggleSelected}
        onTrashAction={(id) => { void handleRowTrashAction(id); }}
      />
    </section>
  );
}
