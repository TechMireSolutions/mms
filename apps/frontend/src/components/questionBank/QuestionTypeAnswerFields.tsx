import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  countFillBlankMarkers,
  joinQuestionCompoundAnswer,
  splitQuestionCompoundAnswer,
  type AppTranslationKey,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

interface QuestionTypeAnswerFieldsProps {
  questionType: Question['type'];
  text: string;
  options: string[];
  answer: string;
  onOptionsChange: (options: string[]) => void;
  onAnswerChange: (answer: string) => void;
  t: TranslateFn;
}

function ensureSize(items: string[], size: number): string[] {
  const next = [...items];
  while (next.length < size) next.push('');
  return next.slice(0, Math.max(size, 0));
}

export default function QuestionTypeAnswerFields({
  questionType,
  text,
  options,
  answer,
  onOptionsChange,
  onAnswerChange,
  t,
}: QuestionTypeAnswerFieldsProps): React.JSX.Element | null {
  if (questionType === 'fill_blank') {
    const blankCount = Math.max(countFillBlankMarkers(text), 1);
    const blanks = ensureSize(splitQuestionCompoundAnswer(answer), blankCount);

    return (
      <div className="space-y-3 sm:col-span-2">
        <p className="text-[11px] text-muted-foreground">{t('questionBank.fillBlankHint')}</p>
        <span className={FORM_LABEL}>{t('questionBank.blankAnswers')}</span>
        <div className="space-y-2">
          {blanks.map((blank, index) => (
            <div key={index}>
              <label htmlFor={`qb-blank-${index}`} className="mb-1 block text-xs font-medium text-foreground">
                {t('questionBank.blankAnswerN', { n: index + 1 })}
              </label>
              <input
                id={`qb-blank-${index}`}
                className={FORM_INPUT}
                value={blank}
                onChange={(e) => {
                  const next = [...blanks];
                  next[index] = e.target.value;
                  onAnswerChange(joinQuestionCompoundAnswer(next));
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (questionType === 'matching') {
    const lefts = options.length > 0 ? options : ['', ''];
    const rights = ensureSize(splitQuestionCompoundAnswer(answer), lefts.length);
    const pairs = lefts.map((left, index) => ({ left, right: rights[index] ?? '' }));

    const syncPairs = (nextPairs: { left: string; right: string }[]): void => {
      onOptionsChange(nextPairs.map((pair) => pair.left));
      onAnswerChange(joinQuestionCompoundAnswer(nextPairs.map((pair) => pair.right)));
    };

    return (
      <div className="space-y-3 sm:col-span-2">
        <span className={FORM_LABEL}>{t('questionBank.matchingPairs')}</span>
        {pairs.map((pair, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/10 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">{t('questionBank.matchingLeft')}</label>
              <input
                className={FORM_INPUT}
                value={pair.left}
                onChange={(e) => {
                  const next = pairs.map((p, i) => (i === index ? { ...p, left: e.target.value } : p));
                  syncPairs(next);
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">{t('questionBank.matchingRight')}</label>
              <input
                className={FORM_INPUT}
                value={pair.right}
                onChange={(e) => {
                  const next = pairs.map((p, i) => (i === index ? { ...p, right: e.target.value } : p));
                  syncPairs(next);
                }}
              />
            </div>
            {pairs.length > 2 && (
              <button
                type="button"
                onClick={() => syncPairs(pairs.filter((_, i) => i !== index))}
                className="flex min-h-10 items-center justify-center gap-1 self-end rounded-lg border border-border px-2 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={t('questionBank.removeMatchingPair', { n: index + 1 })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => syncPairs([...pairs, { left: '', right: '' }])}
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.addMatchingPair')}
        </button>
      </div>
    );
  }

  if (questionType === 'ordering') {
    const items = options.length > 0 ? options : ['', ''];

    const syncItems = (nextItems: string[]): void => {
      onOptionsChange(nextItems);
      onAnswerChange(joinQuestionCompoundAnswer(nextItems));
    };

    const moveItem = (index: number, direction: -1 | 1): void => {
      const target = index + direction;
      if (target < 0 || target >= items.length) return;
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      syncItems(next);
    };

    return (
      <div className="space-y-3 sm:col-span-2">
        <span className={FORM_LABEL}>{t('questionBank.orderingItems')}</span>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 flex-shrink-0 text-center text-[11px] font-bold text-muted-foreground">{index + 1}</span>
            <input
              className={FORM_INPUT}
              value={item}
              placeholder={t('questionBank.orderingItemN', { n: index + 1 })}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                syncItems(next);
              }}
            />
            <div className="flex flex-shrink-0 flex-col gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                className="rounded border border-border p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label={t('questionBank.moveOrderingUp', { n: index + 1 })}
              >
                <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 1)}
                className="rounded border border-border p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label={t('questionBank.moveOrderingDown', { n: index + 1 })}
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {items.length > 2 && (
              <button
                type="button"
                onClick={() => syncItems(items.filter((_, i) => i !== index))}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={t('questionBank.removeMatchingPair', { n: index + 1 })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => syncItems([...items, ''])}
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.addOrderingItem')}
        </button>
      </div>
    );
  }

  if (questionType === 'numeric') {
    const tolerance = options[0] ?? '';

    return (
      <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
        <div>
          <label htmlFor="qb-numeric-answer" className={FORM_LABEL}>{t('questionBank.numericAnswer')} *</label>
          <input
            id="qb-numeric-answer"
            type="number"
            className={FORM_INPUT}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="qb-numeric-tolerance" className={FORM_LABEL}>{t('questionBank.numericTolerance')}</label>
          <input
            id="qb-numeric-tolerance"
            type="number"
            min={0}
            step="any"
            className={FORM_INPUT}
            value={tolerance}
            onChange={(e) => onOptionsChange(e.target.value ? [e.target.value] : [])}
          />
        </div>
      </div>
    );
  }

  return null;
}
