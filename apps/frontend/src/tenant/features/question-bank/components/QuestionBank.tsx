import React, { useMemo } from 'react';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import { useQuestionBankFilters } from '@/tenant/features/question-bank/hooks/useQuestionBankFilters';
import type { QuestionBankQuestion as Question } from '@mms/shared';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { QuestionBankEmptyState } from '@/tenant/features/question-bank/components/QuestionBankEmptyState';
import { QuestionBankList } from '@/tenant/features/question-bank/components/QuestionBankList';
import { QuestionBankToolbar } from '@/tenant/features/question-bank/components/QuestionBankToolbar';
import {
  buildQuestionBankListMetaFields,
  shouldShowQuestionSourceCitation,
  useQuestionBankDisplayConfig,
  useQuestionBankTrashHandlers,
} from '@/tenant/features/question-bank/components/useQuestionBankDisplayConfig';

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
  listLayout?: boolean;
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
  listLayout: _listLayout = true,
  onFilteredCountChange,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
}: QuestionBankProps): React.ReactElement {
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

  const showText = isColumnVisible ? isColumnVisible('text') : true;
  const showCategory = isColumnVisible ? isColumnVisible('category') : true;
  const showLanguage = isColumnVisible ? isColumnVisible('language') : true;
  const showType = isColumnVisible ? isColumnVisible('type') : true;
  const showDifficulty = isColumnVisible ? isColumnVisible('difficulty') : true;
  const showSource = isColumnVisible ? isColumnVisible('source') : true;

  const listMetaFields = useMemo(
    () => buildQuestionBankListMetaFields(config, isColumnVisible),
    [config, isColumnVisible],
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

  return (
    <div className="space-y-4">
      <QuestionBankToolbar
        config={config}
        search={search}
        filterCats={filterCats}
        filterDiff={filterDiff}
        selectedCount={selectedIds.length}
        hideToolbarAdd={hideToolbarAdd}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        canBulkTrash={Boolean(showDeleted ? onBulkRestore : onBulkDelete)}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onFilterCatsChange={setFilterCats}
        onFilterDiffChange={setFilterDiff}
        onAddQuestion={openNewQuestion}
        onBulkTrashAction={() => { void handleBulkTrashAction(); }}
      />

      {filtered.length === 0 && <QuestionBankEmptyState />}

      {filtered.length > 0 && (
        <QuestionBankList
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
          showText={showText}
          showCategory={showCategory}
          showLanguage={showLanguage}
          showType={showType}
          showDifficulty={showDifficulty}
          showSource={showSource}
          showSourceCitation={showSourceCitation}
          allFilteredSelected={allFilteredSelected}
          isColumnVisible={isColumnVisible}
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
