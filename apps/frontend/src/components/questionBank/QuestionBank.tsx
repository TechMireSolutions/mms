import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Filter, Edit2, Trash2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useTranslation from '@/hooks/useTranslation';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import {
  formatQuestionSourcesCitation,
  getQuestionCategoryIds,
  isQuestionSourceFieldId,
  QUESTION_DIFFICULTY_BADGE_CLASSES,
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_TYPE_ICONS,
  splitQuestionCompoundAnswer,
  type QuestionBankQuestion as Question,
  type ModuleColumnRegistryEntry,
} from '@mms/shared';
import ModuleColumnCustomizer from '../ui/ModuleColumnCustomizer';

interface ColumnCustomizerProps {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (cols: ModuleColumnRegistryEntry[]) => void;
  labels: {
    trigger: string;
    title: string;
    visibleAndOrder: string;
    hidden: string;
    fixed: string;
    hideColumn: (label: string) => string;
  };
}

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (questions: Question[]) => void;
  modalOpen?: boolean;
  editQuestion?: Question | null;
  onModalOpenChange?: (open: boolean) => void;
  onEditQuestionChange?: (question: Question | null) => void;
  hideToolbarAdd?: boolean;
  listLayout?: boolean;
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ColumnCustomizerProps;
}

export default function QuestionBank({
  questions,
  onUpdate,
  modalOpen: controlledOpen,
  editQuestion: controlledEdit,
  onModalOpenChange,
  onEditQuestionChange,
  hideToolbarAdd = false,
  listLayout = true,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: QuestionBankProps): React.ReactElement {
  const { t } = useTranslation();
  const config = useQuestionBankConfig(questions);
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalEdit, setInternalEdit] = useState<Question | null>(null);
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);

  const isControlled = controlledOpen !== undefined;

  const setShowModal = (open: boolean): void => {
    if (isControlled) onModalOpenChange?.(open);
    else setInternalOpen(open);
    if (!open) {
      if (isControlled) onEditQuestionChange?.(null);
      else setInternalEdit(null);
    }
  };

  const setEditQ = (q: Question | null): void => {
    if (isControlled) onEditQuestionChange?.(q);
    else setInternalEdit(q);
  };

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
        (f) => isQuestionSourceFieldId(f.id) && config.isFieldEnabled(f.id),
      ),
    [config.orderedFields, config.isFieldEnabled, showSource],
  );

  const listMetaFields = useMemo(
    () =>
      config.orderedFields.filter(
        (f) => {
          if (!config.isFieldEnabled(f.id)) return false;
          const colKey =
            f.id === 'categoryId'
              ? 'category'
              : f.id === 'questionLanguage'
                ? 'language'
                : f.id;
          return isColumnVisible ? isColumnVisible(colKey) : true;
        },
      ),
    [config.orderedFields, config.isFieldEnabled, isColumnVisible],
  );

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        const mS = !search || q.text.toLowerCase().includes(search.toLowerCase());
        const mC =
          filterCats.length === 0 ||
          getQuestionCategoryIds(q).some((id) => filterCats.includes(id));
        const mD = filterDiff.length === 0 || filterDiff.includes(q.difficulty);
        return mS && mC && mD;
      }),
    [questions, search, filterCats, filterDiff],
  );

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const getCat = (id: string) => config.categories.find((c) => c.id === id);

  const renderMetaChip = (q: Question, fieldId: string): React.ReactNode => {
    if (fieldId === 'categoryId') {
      return getQuestionCategoryIds(q).map((catId) => {
        const cat = getCat(catId);
        if (!cat) return null;
        return (
          <span
            key={catId}
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: cat.color }}
          >
            {cat.icon} {cat.name}
          </span>
        );
      });
    }
    if (fieldId === 'questionLanguage') {
      return (
        <span
          key="questionLanguage"
          className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground"
        >
          {config.questionLanguageLabel(q.questionLanguage)}
        </span>
      );
    }
    if (fieldId === 'difficulty') {
      const cls = QUESTION_DIFFICULTY_BADGE_CLASSES[q.difficulty] ?? '';
      return (
        <span key="difficulty" className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
          {config.difficultyLabel(q.difficulty)}
        </span>
      );
    }
    if (fieldId === 'type') {
      return (
        <span key="type" className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {QUESTION_TYPE_ICONS[q.type]} {config.typeLabel(q.type)}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('questionBank.searchPlaceholder')}
            aria-label={t('questionBank.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSearch('')}
              aria-label={t('questionBank.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-auto p-0 hover:bg-transparent"
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
              {config.categories.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={filterCats.includes(c.id)}
                  onCheckedChange={() =>
                    setFilterCats((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))
                  }
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                >
                  {c.icon} {c.name}
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
              {config.enabledDifficulties.map((k) => (
                <DropdownMenuCheckboxItem
                  key={k}
                  checked={filterDiff.includes(k)}
                  onCheckedChange={() =>
                    setFilterDiff((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
                  }
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                >
                  {config.difficultyLabel(k)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!hideToolbarAdd && (
          <Button
            type="button"
            onClick={() => { setEditQ(null); setShowModal(true); }}
            className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('questionBank.addQuestion')}
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
          {/* Card view for mobile/tablet */}
          <div className="space-y-3 lg:hidden" role="list">
            {filtered.map((q, i) => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, scale: 1.005, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.03 }}
                className="group relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/95 via-card/80 to-background/60 backdrop-blur-xl p-4 transition-all duration-300 hover:shadow-sm"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {showText && config.isFieldEnabled('text') && (
                      <p className="mb-2 text-[13px] font-semibold leading-snug text-foreground">{q.text}</p>
                    )}
                    {listMetaFields.length > 0 && (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {listMetaFields.map((field) => renderMetaChip(q, field.id))}
                      </div>
                    )}
                    {config.isFieldEnabled('options') && q.type === 'mcq' && q.options && q.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {q.options.filter(Boolean).map((o, oi) => (
                          <span
                            key={oi}
                            className={`rounded-md border px-2 py-0.5 text-[11px] ${o === q.answer ? 'border-primary/30 bg-primary/5 font-semibold text-primary' : 'border-border bg-muted text-muted-foreground'}`}
                          >
                            {o === q.answer ? `✓ ` : ''}{o}
                          </span>
                        ))}
                      </div>
                    )}
                    {config.isFieldEnabled('answer') && q.type === 'true_false' && (
                      <p className="mt-1.5 text-[11px] font-semibold text-primary">✓ {q.answer}</p>
                    )}
                    {q.type === 'fill_blank' && q.answer && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {t('questionBank.previewFillBlank', {
                          answers: splitQuestionCompoundAnswer(q.answer).join(', '),
                        })}
                      </p>
                    )}
                    {q.type === 'matching' && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('questionBank.previewMatching')}
                        </p>
                        {q.options.map((left, index) => (
                          <p key={index} className="text-[11px] text-foreground">
                            {left} → {splitQuestionCompoundAnswer(q.answer)[index] ?? '—'}
                          </p>
                        ))}
                      </div>
                    )}
                    {q.type === 'numeric' && q.answer && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {t('questionBank.previewNumeric', { answer: q.answer })}
                        {q.options[0] ? ` (±${q.options[0]})` : ''}
                      </p>
                    )}
                    {q.type === 'ordering' && q.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('questionBank.previewOrdering')}
                        </p>
                        <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] text-foreground">
                          {q.options.filter(Boolean).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {showSourceCitation && (() => {
                      const citation = formatQuestionSourcesCitation(q, t, config.sourceBooks);
                      if (!citation) return null;
                      return (
                        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                          <span className="font-semibold text-foreground/80">{t('questionBank.sourceReference')}:</span>{' '}
                          {citation}
                        </p>
                      );
                    })()}
                    {config.orderedFields
                      .filter((f) => !SYSTEM_FIELD_IDS.has(f.id) && config.isFieldEnabled(f.id) && (isColumnVisible ? isColumnVisible(f.id) : true))
                      .map((field) => {
                        const val = (q as unknown as Record<string, unknown>)[field.id];
                        if (val === undefined || val === '') return null;
                        return (
                          <p key={field.id} className="mt-1 text-[11px] text-muted-foreground">
                            <span className="font-semibold">{config.fieldLabel(field.id, field.label)}:</span>{' '}
                            {Array.isArray(val) ? val.join(', ') : String(val)}
                          </p>
                        );
                      })}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditQ(q); setShowModal(true); }}
                      className="rounded-lg h-8 w-8 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={t('questionBank.editQuestionAria', { text: q.text })}
                    >
                      <Edit2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onUpdate(questions.filter((x) => x.id !== q.id))}
                      className="rounded-lg h-8 w-8 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('questionBank.deleteQuestionAria', { text: q.text })}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Table view for desktop */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t('questionBank.questions')}</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {showText && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {t('questionBank.columns.text')}
                      </th>
                    )}
                    {showCategory && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.category')}
                      </th>
                    )}
                    {showLanguage && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.language')}
                      </th>
                    )}
                    {showType && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.type')}
                      </th>
                    )}
                    {showDifficulty && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.difficulty')}
                      </th>
                    )}
                    {showSource && (
                      <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {t('questionBank.columns.source')}
                      </th>
                    )}
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      <span className="sr-only">{t('questionBank.columns.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((q, i) => {
                    const citation = showSource
                      ? formatQuestionSourcesCitation(q, t, config.sourceBooks)
                      : '';
                    const diffCls = QUESTION_DIFFICULTY_BADGE_CLASSES[q.difficulty] ?? '';
                    return (
                      <motion.tr
                        key={q.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {showText && (
                          <td className="px-4 py-3 text-[13px] font-semibold text-foreground max-w-[280px]">
                            <p className="line-clamp-2 m-0">{q.text}</p>
                          </td>
                        )}
                        {showCategory && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {getQuestionCategoryIds(q).map((catId) => {
                                const cat = getCat(catId);
                                if (!cat) return null;
                                return (
                                  <span
                                    key={catId}
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                    style={{ background: cat.color }}
                                  >
                                    {cat.icon} {cat.name}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        )}
                        {showLanguage && (
                          <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                            {config.questionLanguageLabel(q.questionLanguage)}
                          </td>
                        )}
                        {showType && (
                          <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                            {QUESTION_TYPE_ICONS[q.type]} {config.typeLabel(q.type)}
                          </td>
                        )}
                        {showDifficulty && (
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${diffCls}`}>
                              {config.difficultyLabel(q.difficulty)}
                            </span>
                          </td>
                        )}
                        {showSource && (
                          <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-[200px] truncate">
                            {citation || '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditQ(q); setShowModal(true); }}
                              className="rounded-lg h-8 w-8 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={t('questionBank.editQuestionAria', { text: q.text })}
                            >
                              <Edit2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onUpdate(questions.filter((x) => x.id !== q.id))}
                              className="rounded-lg h-8 w-8 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t('questionBank.deleteQuestionAria', { text: q.text })}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
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
