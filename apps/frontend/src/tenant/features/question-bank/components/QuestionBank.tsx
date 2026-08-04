import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { useQuestionBankFilters } from '@/tenant/features/question-bank/hooks/useQuestionBankFilters';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { BulkSelectionBar } from '@/components/ui/BulkSelectionBar';
import { BulkSelectionRestoreAction } from '@/components/ui/BulkSelectionActions';
import { Button } from '@/components/ui/button';
import { QuestionBankEmptyState } from '@/tenant/features/question-bank/components/QuestionBankEmptyState';
import { QuestionBankList } from '@/tenant/features/question-bank/components/QuestionBankList';
import { QuestionBankToolbar } from '@/tenant/features/question-bank/components/QuestionBankToolbar';
import {
  buildQuestionBankListMetaFields,
  shouldShowQuestionSourceCitation,
  useQuestionBankDisplayConfig,
  useQuestionBankTrashHandlers,
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
    selectedIds,
    setSelectedIds,
    filtered,
    toggleSelected,
    allFilteredSelected,
    toggleSelectAllFiltered,
  } = useQuestionBankFilters({ questions, showDeleted, onFilteredCountChange });

  const { difficultyConfig, typeConfig } = useQuestionBankDisplayConfig(config);
  const { handleRowTrashAction, handleBulkTrashAction } = useQuestionBankTrashHandlers({
    showDeleted,
    selectedIds,
    setSelectedIds,
    onDelete,
    onRestore,
    onBulkDelete,
    onBulkRestore,
  });

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

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);

  return (
    <div className="space-y-4">
      {canBulkTrash && (
        <BulkSelectionBar
          placement="floating"
          selectedCount={selectedIds.length}
          countLabel={t('questionBank.trash.selected', { count: selectedIds.length })}
        >
          {showDeleted ? (
            <BulkSelectionRestoreAction
              label={t('questionBank.trash.restore')}
              onClick={() => { void handleBulkTrashAction(); }}
            />
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => { void handleBulkTrashAction(); }}
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> {t('common.delete')}
            </Button>
          )}
        </BulkSelectionBar>
      )}

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
          canWrite={canWrite}
          canDelete={canDelete}
          canTrashRows={canDelete && Boolean(showDeleted ? onRestore : onDelete)}
          showDeleted={showDeleted}
          showSourceCitation={showSourceCitation}
          allFilteredSelected={allFilteredSelected}
          isColumnVisible={columnVisible}
          getColumnWidth={getColumnWidth}
          onColumnResize={onColumnResize}
          onEditQuestion={openEditQuestion}
          onTrashAction={(id) => { void handleRowTrashAction(id); }}
          onToggleSelected={toggleSelected}
          onToggleSelectAllFiltered={toggleSelectAllFiltered}
        />
      )}
    </div>
  );
}
