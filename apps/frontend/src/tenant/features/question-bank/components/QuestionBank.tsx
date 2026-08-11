import React, { useEffect, useMemo, useState } from 'react';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { useQuestionBankFilters } from '@/tenant/features/question-bank/hooks/useQuestionBankFilters';
import { useQuestionBankSelection } from '@/tenant/features/question-bank/hooks/useQuestionBankSelection';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { QuestionBankEmptyState } from '@/tenant/features/question-bank/components/QuestionBankEmptyState';
import { QuestionBankList } from '@/tenant/features/question-bank/components/QuestionBankList';
import { QuestionBankToolbar } from '@/tenant/features/question-bank/components/QuestionBankToolbar';
import { QuestionBankBulkActionBar } from '@/tenant/features/question-bank/components/QuestionBankBulkActionBar';
import {
  buildQuestionBankListMetaFields,
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
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: QuestionBankProps): React.ReactElement {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const config = useQuestionBankConfig(questions);
  const {
    search,
    setSearch,
    filterCats,
    setFilterCats,
    filterDiff,
    setFilterDiff,
    filtered,
  } = useQuestionBankFilters({ questions, onFilteredCountChange });

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedQuestion,
    clearSelection,
  } = useQuestionBankSelection(filtered);

  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted, setSelectedIds]);

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

  const listMetaFields = useMemo(
    () => buildQuestionBankListMetaFields(config, columnVisible),
    [config, columnVisible],
  );

  const showSourceCitation = useMemo(
    () => shouldShowQuestionSourceCitation(config, showSource),
    [config, showSource],
  );

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
    clearSelection();
    setConfirmBulkOpen(false);
  };

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);

  return (
    <div className="space-y-4">
      <QuestionBankToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        config={config}
        search={search}
        filterCats={filterCats}
        filterDiff={filterDiff}
        hideToolbarAdd={hideToolbarAdd}
        canWrite={canWrite}
        showDeleted={showDeleted}
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
          onClearSelection={clearSelection}
        />
      )}

      {filtered.length === 0 && <QuestionBankEmptyState />}

      {filtered.length > 0 && (
        <QuestionBankList
          viewMode={viewMode}
          questions={filtered}
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
          onToggleSelectedQuestion={toggleSelectedQuestion}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => { if (!open) setPendingTrashId(null); }}
        title={t('questionBank.trash.deleteTitle')}
        description={t('questionBank.trash.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t('questionBank.trash.restore') : t('questionBank.trash.deleteTitle')}
        description={t(showDeleted ? 'questionBank.trash.bulkRestoreConfirm' : 'questionBank.trash.bulkDeleteConfirm', { count: selectedIds.length })}
        confirmLabel={showDeleted ? t('questionBank.trash.restore') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkTrash}
      />
    </div>
  );
}
