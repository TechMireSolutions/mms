import React, { useEffect, useState } from 'react';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { useQuestionBankFilters } from '@/tenant/features/question-bank/hooks/useQuestionBankFilters';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { QuestionBankTrashDialogs } from '@/tenant/features/question-bank/components/QuestionBankTrashDialogs';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuestionsList } from '@/tenant/features/question-bank/components/QuestionsList';
import { QuestionsListFilters } from '@/tenant/features/question-bank/components/QuestionsListFilters';
import { QuestionBankBulkActionBar } from '@/tenant/features/question-bank/components/QuestionBankBulkActionBar';
import {
  buildQuestionsListMetaFields,
  shouldShowQuestionSourceCitation,
  useQuestionBankDisplayConfig,
} from '@/tenant/features/question-bank/components/useQuestionBankDisplayConfig';
import { useTranslation } from '@/hooks/useTranslation';

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (questions: Question[]) => void | Promise<void>;
  modalOpen?: boolean;
  editQuestion?: Question | null;
  onModalOpenChange?: (open: boolean) => void;
  onEditQuestionChange?: (question: Question | null) => void;
  hideToolbarAdd?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  selectedIds?: string[];
  onToggleSelectedQuestion?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean, visibleIds: string[]) => void;
  onClearSelection?: () => void;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onRowClick?: (id: string) => void;
}

export function QuestionBank({
  questions,
  onUpdate: _onUpdate,
  modalOpen: _controlledOpen,
  editQuestion: _controlledEdit,
  onModalOpenChange,
  onEditQuestionChange,
  hideToolbarAdd = false,
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  onToggleDeleted,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onFilteredCountChange,
  selectedIds = [],
  onToggleSelectedQuestion,
  onToggleSelectAll,
  onClearSelection,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onRowClick,
}: QuestionBankProps): React.ReactElement {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  // Config (category/difficulty options) derives from the FULL question list.
  const config = useQuestionBankConfig(questions);
  const {
    search,
    setSearch,
    filterCats,
    setFilterCats,
    filterDiff,
    setFilterDiff,
    listPage,
    setListPage,
    pageQuestions,
    pageQuery,
    serverTotal,
    serverPage,
    serverLimit,
    serverHasMore,
  } = useQuestionBankFilters({ showDeleted, onFilteredCountChange });

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = pageQuestions.length > 0
    && pageQuestions.every((q) => selectedSet.has(q.id));
  const someVisibleSelected = selectedSet.size > 0
    && pageQuestions.some((q) => selectedSet.has(q.id));

  const handleToggleSelectAll = (checked: boolean) => {
    onToggleSelectAll?.(checked, pageQuestions.map((q) => q.id));
  };

  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  useEffect(() => {
    onClearSelection?.();
  }, [listPage, search, filterCats, filterDiff, onClearSelection]);

  const { difficultyConfig, typeConfig } = useQuestionBankDisplayConfig(config);

  const setShowModal = (open: boolean): void => {
    onModalOpenChange?.(open);
    if (!open) onEditQuestionChange?.(null);
  };

  const setEditingQuestion = (question: Question | null): void => {
    onEditQuestionChange?.(question);
  };

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;
  const showSource = columnVisible('source');

  const listMetaFields = (() => buildQuestionsListMetaFields(config, columnVisible))();

  const showSourceCitation = (() => shouldShowQuestionSourceCitation(config, showSource))();

  const openNewQuestion = (): void => {
    setEditingQuestion(null);
    setShowModal(true);
  };

  const openEditQuestion = (question: Question): void => {
    setEditingQuestion(question);
    setShowModal(true);
  };

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    onClearSelection?.();
    setConfirmBulkOpen(false);
  };

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);

  return (
    <div className="space-y-4">
      <QuestionsListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        config={config}
        search={search}
        filterCats={filterCats}
        filterDiff={filterDiff}
        hideToolbarAdd={hideToolbarAdd}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onFilterCatsChange={setFilterCats}
        onFilterDiffChange={setFilterDiff}
        onAddQuestion={openNewQuestion}
      />

      {canBulkTrash && (
        <QuestionBankBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDelete}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={onClearSelection ?? (() => {})}
        />
      )}

      <ModuleWorkListStateShell
        isError={pageQuery.isError}
        isLoading={pageQuery.isPending}
        isFetching={pageQuery.isFetching}
        onRetry={() => { void pageQuery.refetch(); }}
        errorTitle={t('questionBank.loadFailed')}
        errorHint={t('questionBank.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={6}
        useServerWork={true}
        pageData={{
          page: serverPage,
          total: serverTotal,
          limit: serverLimit,
          hasMore: serverHasMore,
        }}
        onPageChange={setListPage}
        i18nNamespace="questionBank"
        showPagination={pageQuestions.length > 0}
        loadingLabel={t("common.loading")}
      >
        {pageQuestions.length === 0 ? (
          <EmptyState
            variant="dashed"
            title={t('questionBank.noQuestions')}
            className="py-14"
          />
        ) : (
          <QuestionsList
            viewMode={viewMode}
            questions={pageQuestions}
            config={config}
            difficultyConfig={difficultyConfig}
            typeConfig={typeConfig}
            listMetaFields={listMetaFields}
            selectedIds={selectedIds}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            canWrite={canWrite}
            canDelete={canDelete}
            canTrashRows={canDelete && Boolean(showDeleted ? onRestore : onDelete)}
            showDeleted={showDeleted}
            showSourceCitation={showSourceCitation}
            isColumnVisible={columnVisible}
            getColumnWidth={getColumnWidth}
            onColumnResize={onColumnResize}
            onEditQuestion={openEditQuestion}
            onTrashAction={(id) => {
              if (showDeleted) void onRestore?.(id);
              else setPendingTrashId(id);
            }}
            onToggleSelectedQuestion={onToggleSelectedQuestion ?? (() => {})}
            onToggleSelectAll={handleToggleSelectAll}
            onRowClick={onRowClick}
          />
        )}
      </ModuleWorkListStateShell>

      <QuestionBankTrashDialogs
        pendingTrashId={pendingTrashId}
        onPendingTrashIdChange={setPendingTrashId}
        confirmBulkOpen={confirmBulkOpen}
        onConfirmBulkOpenChange={setConfirmBulkOpen}
        showDeleted={showDeleted}
        selectedCount={selectedIds.length}
        onConfirmRowTrash={confirmRowTrash}
        onConfirmBulkTrash={confirmBulkTrash}
      />
    </div>
  );
}
