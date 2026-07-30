import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import {
  getQuestionCategoryIds,
  isQuestionSourceFieldId,
  QUESTION_TYPE_ICONS,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import type { ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { QuestionBankEmptyState } from '@/tenant/features/question-bank/components/QuestionBankEmptyState';
import { QuestionBankList } from '@/tenant/features/question-bank/components/QuestionBankList';
import { QuestionBankToolbar } from '@/tenant/features/question-bank/components/QuestionBankToolbar';

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
  const { t } = useTranslation();
  const config = useQuestionBankConfig(questions);
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const setShowModal = (open: boolean): void => {
    onModalOpenChange?.(open);
    if (!open) {
      onEditQuestionChange?.(null);
    }
  };

  const setEditingQuestion = (question: Question | null): void => {
    onEditQuestionChange?.(question);
  };

  const difficultyConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    easy: { label: config.difficultyLabel('easy'), cls: SEMANTIC_BADGE.success },
    medium: { label: config.difficultyLabel('medium'), cls: SEMANTIC_BADGE.warning },
    hard: { label: config.difficultyLabel('hard'), cls: SEMANTIC_BADGE.destructive },
  }), [config]);

  const typeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => (
    Object.fromEntries(
      Object.keys(QUESTION_TYPE_ICONS).map((typeId) => [
        typeId,
        {
          label: `${QUESTION_TYPE_ICONS[typeId as keyof typeof QUESTION_TYPE_ICONS]} ${config.typeLabel(typeId)}`,
          cls: SEMANTIC_BADGE.muted,
        },
      ]),
    )
  ), [config]);

  const showText = isColumnVisible ? isColumnVisible('text') : true;
  const showCategory = isColumnVisible ? isColumnVisible('category') : true;
  const showLanguage = isColumnVisible ? isColumnVisible('language') : true;
  const showType = isColumnVisible ? isColumnVisible('type') : true;
  const showDifficulty = isColumnVisible ? isColumnVisible('difficulty') : true;
  const showSource = isColumnVisible ? isColumnVisible('source') : true;

  const showSourceCitation = useMemo(
    () =>
      showSource &&
      config.orderedFields.some(
        (field) => isQuestionSourceFieldId(field.id) && config.isFieldEnabled(field.id),
      ),
    [config, showSource],
  );

  const listMetaFields = useMemo(
    () =>
      config.orderedFields.filter(
        (field) => {
          if (!config.isFieldEnabled(field.id)) return false;
          const colKey =
            field.id === 'categoryId'
              ? 'category'
              : field.id === 'questionLanguage'
                ? 'language'
                : field.id;
          return isColumnVisible ? isColumnVisible(colKey) : true;
        },
      ),
    [config, isColumnVisible],
  );

  const filtered = useMemo(
    () =>
      questions.filter((question) => {
        const matchesSearch = !search || question.text.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          filterCats.length === 0 ||
          getQuestionCategoryIds(question).some((categoryId) => filterCats.includes(categoryId));
        const matchesDifficulty = filterDiff.length === 0 || filterDiff.includes(question.difficulty);
        return matchesSearch && matchesCategory && matchesDifficulty;
      }),
    [questions, search, filterCats, filterDiff],
  );

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const handleRowTrashAction = async (id: string): Promise<void> => {
    if (showDeleted) {
      await onRestore?.(id);
      return;
    }
    if (!confirm(t('questionBank.trash.deleteConfirm'))) return;
    await onDelete?.(id);
  };

  const handleBulkTrashAction = async (): Promise<void> => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t('questionBank.trash.bulkRestoreConfirm', { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t('questionBank.trash.bulkDeleteConfirm', { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  const toggleSelected = (id: string, checked: boolean): void => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((question) => selectedIds.includes(question.id));

  const toggleSelectAllFiltered = (checked: boolean): void => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((question) => question.id === id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((question) => question.id)])));
  };

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
