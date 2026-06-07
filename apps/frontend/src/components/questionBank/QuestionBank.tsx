import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, Filter, Edit2, Trash2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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
} from '@mms/shared';

interface QuestionBankProps {
  questions: Question[];
  onUpdate: (questions: Question[]) => void;
  modalOpen?: boolean;
  editQuestion?: Question | null;
  onModalOpenChange?: (open: boolean) => void;
  onEditQuestionChange?: (question: Question | null) => void;
  hideToolbarAdd?: boolean;
}

export default function QuestionBank({
  questions,
  onUpdate,
  modalOpen: controlledOpen,
  editQuestion: controlledEdit,
  onModalOpenChange,
  onEditQuestionChange,
  hideToolbarAdd = false,
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

  const showSourceCitation = useMemo(
    () =>
      config.orderedFields.some(
        (f) => isQuestionSourceFieldId(f.id) && config.isFieldEnabled(f.id),
      ),
    [config.orderedFields, config.isFieldEnabled],
  );

  const listMetaFields = useMemo(
    () =>
      config.orderedFields.filter(
        (f) =>
          config.isFieldEnabled(f.id) &&
          ['categoryId', 'questionLanguage', 'difficulty', 'type'].includes(f.id),
      ),
    [config.orderedFields, config.isFieldEnabled],
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
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('questionBank.searchPlaceholder')}
            aria-label={t('questionBank.searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('questionBank.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
        {config.isFieldEnabled('categoryId') && config.categories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterCats.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-card hover:bg-muted'}`}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {t('questionBank.category')}
                {filterCats.length > 0 && ` (${filterCats.length})`}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
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
              <button
                type="button"
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterDiff.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-card hover:bg-muted'}`}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                {t('questionBank.filterDifficulty')}
                {filterDiff.length > 0 && ` (${filterDiff.length})`}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
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
          <button
            type="button"
            onClick={() => { setEditQ(null); setShowModal(true); }}
            className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('questionBank.addQuestion')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground" role="status">
        <span>{t('questionBank.statsCount', { count: filtered.length })}</span>
        {config.isFieldEnabled('difficulty') &&
          config.enabledDifficulties.map((k) => (
            <span key={k}>
              <strong className="text-foreground">
                {questions.filter((q) => q.difficulty === k).length}
              </strong>{' '}
              {config.difficultyLabel(k)}
            </span>
          ))}
      </div>

      <div className="space-y-3" role="list">
        {filtered.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
            role="listitem"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {config.isFieldEnabled('text') && (
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
                  .filter((f) => !SYSTEM_FIELD_IDS.has(f.id) && config.isFieldEnabled(f.id))
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
                <button
                  type="button"
                  onClick={() => { setEditQ(q); setShowModal(true); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('questionBank.editQuestionAria', { text: q.text })}
                >
                  <Edit2 className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(questions.filter((x) => x.id !== q.id))}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t('questionBank.deleteQuestionAria', { text: q.text })}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border py-14 text-center" role="status">
            <p className="text-sm font-medium text-muted-foreground">{t('questionBank.noQuestions')}</p>
          </div>
        )}
      </div>

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
