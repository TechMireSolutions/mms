import React, { useState, useEffect } from "react";
import type { Exam } from '@/lib/data/examinationData';
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ListPagination } from "@/components/ui/ListPagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { useExamSelection } from "@/tenant/features/examinations/hooks/useExamSelection";
import { useExaminationsContractList } from "@/tenant/features/examinations/hooks/useExaminationsTsrHooks";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { useDebounce } from "@/hooks/useDebounce";
import { EXAMINATIONS_MODULE_MANIFEST } from "@mms/shared";
import { ExaminationsListContent } from "@/tenant/features/examinations/components/ExaminationsListContent";
import { ExaminationsListFilters } from "@/tenant/features/examinations/components/ExaminationsListFilters";
import { ExaminationsBulkActionBar } from "@/tenant/features/examinations/components/ExaminationsBulkActionBar";
import { ExaminationsTrashDialogs } from "@/tenant/features/examinations/components/ExaminationsTrashDialogs";
import {
  resolveExaminationStatusConfig,
  resolveExaminationStatusLabels,
} from "@/tenant/features/examinations/components/examinationStatusConfig";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;
const EXAM_SEARCH_DEBOUNCE_MS = 300;

export interface ExaminationsListProps {
  onNew: () => void;
  onEdit: (exam: Exam) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
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
  onRowClick?: (id: string) => void;
}

/**
 * Renders the dashboard list of created exams (cards or table) — server-paged.
 */
export default function ExaminationsList({
  onNew,
  onEdit,
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  onToggleDeleted,
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
  onRowClick,
}: ExaminationsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(search, EXAM_SEARCH_DEBOUNCE_MS);

  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();
  const classes = (() => sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({
        id: sessionClass.id,
        name: `${session.name} - ${sessionClass.name}`,
      })),
    ))();

  // Server-side filter/page reset whenever a filter dimension changes.
  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterStatus, showDeleted]);

  const examsPageQuery = useExaminationsContractList({
    page: listPage,
    limit: EXAMINATIONS_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    status: filterStatus.length ? filterStatus.join(',') : undefined,
    includeDeleted: showDeleted,
  });

  const pageExams = (examsPageQuery.data?.body?.exams ?? []) as Exam[];
  const serverTotal = examsPageQuery.data?.body?.total ?? 0;
  const serverPage = examsPageQuery.data?.body?.page ?? listPage;
  const serverLimit = examsPageQuery.data?.body?.limit ?? EXAMINATIONS_MODULE_MANIFEST.defaultPageSize;
  const serverHasMore = examsPageQuery.data?.body?.hasMore ?? false;

  useEffect(() => {
    onFilteredCountChange?.(serverTotal);
  }, [onFilteredCountChange, serverTotal]);

  const statusLabels = resolveExaminationStatusLabels(t);

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) onNew();
    // Intentionally omit onNew — parent passes a new function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- createRequestKey drives open
  }, [createRequestKey, canWrite, showDeleted]);

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedExam,
  } = useExamSelection(pageExams);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted, listPage, debouncedSearch, filterStatus, setSelectedIds]);

  const toggleStatus = (status: string): void =>
    setFilterStatus((currentStatuses) => (currentStatuses.includes(status) ? currentStatuses.filter((candidate) => candidate !== status) : [...currentStatuses, status]));

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const statusConfig = resolveExaminationStatusConfig(statusLabels);

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);
  const isInitialLoading = examsPageQuery.isPending && !examsPageQuery.data;
  const isError = examsPageQuery.isError || (examsPageQuery.data != null && examsPageQuery.data.status !== 200);

  return (
    <section className="space-y-4" aria-label={t("examinations.exams")} aria-busy={examsPageQuery.isFetching}>
      <ExaminationsListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        filterStatus={filterStatus}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleDeleted}
        columnCustomizer={columnCustomizer}
        statusLabels={statusLabels}
        onSearchChange={setSearch}
        onToggleStatus={toggleStatus}
        onClearStatuses={() => setFilterStatus([])}
        onNew={onNew}
      />

      {canBulkTrash && (
        <ExaminationsBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDelete}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {isError ? (
        <ErrorState
          title={t("examinations.loadFailed")}
          description={t("examinations.loadFailedHint")}
          onRetry={() => { void examsPageQuery.refetch(); }}
        />
      ) : isInitialLoading ? null : (
        <ExaminationsListContent
          viewMode={viewMode}
          exams={pageExams}
          selectedIds={selectedIds}
          isColumnVisible={columnVisible}
          classes={classes}
          enrollments={enrollments}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          canTrashRows={canDelete && Boolean(showDeleted ? onRestore : onDelete)}
          statusConfig={statusConfig}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          onEdit={onEdit}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectedExam={toggleSelectedExam}
          onRowClick={onRowClick}
          onTrashAction={(id) => {
            if (showDeleted) void onRestore?.(id);
            else setPendingTrashId(id);
          }}
        />
      )}

      <ListPagination
        page={serverPage}
        total={serverTotal}
        limit={serverLimit}
        hasMore={serverHasMore}
        onPageChange={setListPage}
        i18nNamespace="examinations"
      />
      <ExaminationsTrashDialogs
        pendingTrashId={pendingTrashId}
        onPendingTrashIdChange={setPendingTrashId}
        confirmBulkOpen={confirmBulkOpen}
        onConfirmBulkOpenChange={setConfirmBulkOpen}
        showDeleted={showDeleted}
        selectedCount={selectedIds.length}
        onConfirmRowTrash={confirmRowTrash}
        onConfirmBulkTrash={confirmBulkTrash}
      />
    </section>
  );
}