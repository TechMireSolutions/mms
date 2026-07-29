import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Filter, Edit2, Trash2, ChevronDown, RotateCcw } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';
import {
  formatQuestionSourcesCitation,
  getQuestionCategoryIds,
  isQuestionSourceFieldId,
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_TYPE_ICONS,
  splitQuestionCompoundAnswer,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { CategoryColorChip } from '@/tenant/features/question-bank/components/CategoryColorChip';



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

  const getCat = (id: string) => config.categories.find((category) => category.id === id);

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

  const renderMetaChip = (question: Question, fieldId: string): React.ReactNode => {
    if (fieldId === 'categoryId') {
      return getQuestionCategoryIds(question).map((catId) => {
        const cat = getCat(catId);
        if (!cat) return null;
        return (
          <CategoryColorChip key={catId} name={cat.name} color={cat.color} icon={cat.icon} />
        );
      });
    }
    if (fieldId === 'questionLanguage') {
      return (
        <span
          key="questionLanguage"
          className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-bold text-foreground"
        >
          {config.questionLanguageLabel(question.questionLanguage)}
        </span>
      );
    }
    if (fieldId === 'difficulty') {
      return <StatusBadge key="difficulty" status={question.difficulty} config={difficultyConfig} size="sm" />;
    }
    if (fieldId === 'type') {
      return <StatusBadge key="type" status={question.type} config={typeConfig} size="sm" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('questionBank.searchPlaceholder')}
            aria-label={t('questionBank.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-card py-2.5 ps-10 pe-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearch('')}
              aria-label={t('questionBank.clearSearch')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground min-h-11 min-w-11 hover:bg-transparent"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
        {config.isFieldEnabled('categoryId') && config.categories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterCats.length ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {t('questionBank.category')}
                {filterCats.length > 0 && ` (${filterCats.length})`}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
                {t('questionBank.filterByCategory')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 h-px bg-border" />
              {config.categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={filterCats.includes(category.id)}
                  onCheckedChange={() =>
                    setFilterCats((previousCategoryIds) => (previousCategoryIds.includes(category.id) ? previousCategoryIds.filter((categoryId) => categoryId !== category.id) : [...previousCategoryIds, category.id]))
                  }
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                >
                  {category.icon} {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {config.isFieldEnabled('difficulty') && config.enabledDifficulties.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterDiff.length ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {t('questionBank.filterDifficulty')}
                {filterDiff.length > 0 && ` (${filterDiff.length})`}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
                {t('questionBank.filterDifficulty')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 h-px bg-border" />
              {config.enabledDifficulties.map((difficulty) => (
                <DropdownMenuCheckboxItem
                  key={difficulty}
                  checked={filterDiff.includes(difficulty)}
                  onCheckedChange={() =>
                    setFilterDiff((previousDifficulties) => (previousDifficulties.includes(difficulty) ? previousDifficulties.filter((selectedDifficulty) => selectedDifficulty !== difficulty) : [...previousDifficulties, difficulty]))
                  }
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                >
                  {config.difficultyLabel(difficulty)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!hideToolbarAdd && canWrite && !showDeleted && (
          <Button
            type="button"
            onClick={() => { setEditingQuestion(null); setShowModal(true); }}
            className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('questionBank.addQuestion')}
          </Button>
        )}
        {canDelete && selectedIds.length > 0 && (showDeleted ? onBulkRestore : onBulkDelete) && (
          <Button
            type="button"
            size="sm"
            variant={showDeleted ? 'outline' : 'destructive'}
            onClick={() => { void handleBulkTrashAction(); }}
            className="gap-1.5"
          >
            {showDeleted ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
            {showDeleted ? t('questionBank.trash.restore') : t('common.delete')} ({selectedIds.length})
          </Button>
        )}
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-14 text-center" role="status">
          <p className="text-sm font-medium text-muted-foreground">{t('questionBank.noQuestions')}</p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          <div className="space-y-3 p-3 md:hidden" role="list">
            {filtered.map((question, questionIndex) => (
              <motion.article
                key={question.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: questionIndex * 0.03 }}
                className="group space-y-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {showText && config.isFieldEnabled('text') && (
                      <p className="mb-2 text-sm font-semibold leading-snug text-foreground">{question.text}</p>
                    )}
                    {listMetaFields.length > 0 && (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {listMetaFields.map((field) => renderMetaChip(question, field.id))}
                      </div>
                    )}
                    {config.isFieldEnabled('options') && question.type === 'mcq' && question.options && question.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {question.options.filter(Boolean).map((option, optionIndex) => (
                          <span
                            key={optionIndex}
                            className={`rounded-md border px-2 py-0.5 text-xs ${option === question.answer ? 'border-primary/30 bg-primary/5 font-semibold text-primary' : 'border-border bg-muted text-muted-foreground'}`}
                          >
                            {option === question.answer ? `✓ ` : ''}{option}
                          </span>
                        ))}
                      </div>
                    )}
                    {config.isFieldEnabled('answer') && question.type === 'true_false' && (
                      <p className="mt-1.5 text-xs font-semibold text-primary">✓ {question.answer}</p>
                    )}
                    {question.type === 'fill_blank' && question.answer && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t('questionBank.previewFillBlank', {
                          answers: splitQuestionCompoundAnswer(question.answer).join(', '),
                        })}
                      </p>
                    )}
                    {question.type === 'matching' && question.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('questionBank.previewMatching')}
                        </p>
                        {question.options.map((left, index) => (
                          <p key={index} className="text-xs text-foreground">
                            {left} → {splitQuestionCompoundAnswer(question.answer)[index] ?? '—'}
                          </p>
                        ))}
                      </div>
                    )}
                    {question.type === 'numeric' && question.answer && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {t('questionBank.previewNumeric', { answer: question.answer })}
                        {question.options[0] ? ` (±${question.options[0]})` : ''}
                      </p>
                    )}
                    {question.type === 'ordering' && question.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('questionBank.previewOrdering')}
                        </p>
                        <ol className="mt-1 list-decimal space-y-0.5 ps-4 text-xs text-foreground">
                          {question.options.filter(Boolean).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {showSourceCitation && (() => {
                      const citation = formatQuestionSourcesCitation(question, t, config.sourceBooks);
                      if (!citation) return null;
                      return (
                        <p className="mt-2 text-xs leading-snug text-muted-foreground">
                          <span className="font-semibold text-foreground/80">{t('questionBank.sourceReference')}:</span>{' '}
                          {citation}
                        </p>
                      );
                    })()}
                    {config.orderedFields
                      .filter((field) => !SYSTEM_FIELD_IDS.has(field.id) && config.isFieldEnabled(field.id) && (isColumnVisible ? isColumnVisible(field.id) : true))
                      .map((field) => {
                        const fieldValue = (question as unknown as Record<string, unknown>)[field.id];
                        if (fieldValue === undefined || fieldValue === '') return null;
                        return (
                          <p key={field.id} className="mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold">{config.fieldLabel(field.id, field.label)}:</span>{' '}
                            {Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue)}
                          </p>
                        );
                      })}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canDelete && (
                      <Checkbox
                        checked={selectedIds.includes(question.id)}
                        onCheckedChange={(checked) => toggleSelected(question.id, checked === true)}
                        aria-label={t('questionBank.deleteQuestionAria', { text: question.text })}
                      />
                    )}
                    {canWrite && !showDeleted && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingQuestion(question); setShowModal(true); }}
                        className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={t('questionBank.editQuestionAria', { text: question.text })}
                      >
                        <Edit2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    )}
                    {canDelete && (showDeleted ? onRestore : onDelete) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => { void handleRowTrashAction(question.id); }}
                        className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={showDeleted ? t('questionBank.trash.restore') : t('questionBank.deleteQuestionAria', { text: question.text })}
                      >
                        {showDeleted ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block rounded-xl border border-border bg-card">
              <table className="w-full text-sm table-fixed">
                <caption className="sr-only">{t('questionBank.questions')}</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {canDelete && (
                      <th className="w-10 px-3 py-2.5">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
                          aria-label={t('questionBank.trash.selectAll')}
                        />
                      </th>
                    )}
                    {showText && (
                      <ResizableTableHead columnKey="text" width={getColumnWidth?.("text")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('questionBank.columns.text')}
                      </ResizableTableHead>
                    )}
                    {showCategory && (
                      <ResizableTableHead columnKey="category" width={getColumnWidth?.("category")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.category')}
                      </ResizableTableHead>
                    )}
                    {showLanguage && (
                      <ResizableTableHead columnKey="language" width={getColumnWidth?.("language")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.language')}
                      </ResizableTableHead>
                    )}
                    {showType && (
                      <ResizableTableHead columnKey="type" width={getColumnWidth?.("type")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.type')}
                      </ResizableTableHead>
                    )}
                    {showDifficulty && (
                      <ResizableTableHead columnKey="difficulty" width={getColumnWidth?.("difficulty")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.difficulty')}
                      </ResizableTableHead>
                    )}
                    {showSource && (
                      <ResizableTableHead columnKey="source" width={getColumnWidth?.("source")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.source')}
                      </ResizableTableHead>
                    )}
                    <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      <span className="sr-only">{t('questionBank.columns.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((question, questionIndex) => {
                    const citation = showSource
                      ? formatQuestionSourcesCitation(question, t, config.sourceBooks)
                      : '';
                    return (
                      <motion.tr
                        key={question.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: questionIndex * 0.03 }}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {canDelete && (
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={selectedIds.includes(question.id)}
                              onCheckedChange={(checked) => toggleSelected(question.id, checked === true)}
                              aria-label={t('questionBank.deleteQuestionAria', { text: question.text })}
                            />
                          </td>
                        )}
                        {showText && (
                          <td className="px-4 py-3 text-sm font-semibold text-foreground max-w-[17.5rem]">
                            <p className="line-clamp-2 m-0">{question.text}</p>
                          </td>
                        )}
                        {showCategory && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {getQuestionCategoryIds(question).map((catId) => {
                                const cat = getCat(catId);
                                if (!cat) return null;
                                return (
                                  <CategoryColorChip key={catId} name={cat.name} color={cat.color} icon={cat.icon} />
                                );
                              })}
                            </div>
                          </td>
                        )}
                        {showLanguage && (
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {config.questionLanguageLabel(question.questionLanguage)}
                          </td>
                        )}
                        {showType && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={question.type} config={typeConfig} size="sm" />
                          </td>
                        )}
                        {showDifficulty && (
                          <td className="px-4 py-3">
                            <StatusBadge status={question.difficulty} config={difficultyConfig} size="sm" />
                          </td>
                        )}
                        {showSource && (
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[12.5rem] truncate">
                            {citation || '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-end">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                            {canWrite && !showDeleted && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingQuestion(question); setShowModal(true); }}
                                className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={t('questionBank.editQuestionAria', { text: question.text })}
                              >
                                <Edit2 className="h-3.5 w-3.5" aria-hidden />
                              </Button>
                            )}
                            {canDelete && (showDeleted ? onRestore : onDelete) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => { void handleRowTrashAction(question.id); }}
                                className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                aria-label={showDeleted ? t('questionBank.trash.restore') : t('questionBank.deleteQuestionAria', { text: question.text })}
                              >
                                {showDeleted ? <RotateCcw className="h-3.5 w-3.5" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
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
        </>
      )}
    </div>
  );
}

const SYSTEM_FIELD_IDS = new Set([
  'text',
  'categoryId',
  'questionLanguage',
  'type',
  'difficulty',
  'options',
  'answer',
  ...QUESTION_SOURCE_FIELD_IDS,
]);
