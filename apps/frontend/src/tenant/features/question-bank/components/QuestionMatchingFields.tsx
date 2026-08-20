import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinQuestionCompoundAnswer, splitQuestionCompoundAnswer, type AppTranslationKey } from '@mms/shared';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

interface QuestionMatchingFieldsProps {
  options: string[];
  answer: string;
  onOptionsChange: (options: string[]) => void;
  onAnswerChange: (answer: string) => void;
  t: TranslateFn;
}

function ensureSize(items: string[], size: number): string[] {
  const sizedItems = [...items];
  while (sizedItems.length < size) sizedItems.push('');
  return sizedItems.slice(0, Math.max(size, 0));
}

export function QuestionMatchingFields({
  options,
  answer,
  onOptionsChange,
  onAnswerChange,
  t,
}: QuestionMatchingFieldsProps): React.JSX.Element {
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
        <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/10 p-3 sm:grid-row-matching-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">{t('questionBank.matchingLeft')}</label>
            <Input
              className={FORM_INPUT}
              value={pair.left}
              onChange={(event) => {
                const updatedPairs = pairs.map((pairCandidate, pairIndex) =>
                  pairIndex === index ? { ...pairCandidate, left: event.target.value } : pairCandidate,
                );
                syncPairs(updatedPairs);
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">{t('questionBank.matchingRight')}</label>
            <Input
              className={FORM_INPUT}
              value={pair.right}
              onChange={(event) => {
                const updatedPairs = pairs.map((pairCandidate, pairIndex) =>
                  pairIndex === index ? { ...pairCandidate, right: event.target.value } : pairCandidate,
                );
                syncPairs(updatedPairs);
              }}
            />
          </div>
          {pairs.length > 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => syncPairs(pairs.filter((_, i) => i !== index))}
              className="flex min-h-11 items-center justify-center gap-1 self-end rounded-lg border border-border px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-destructive"
              aria-label={t('questionBank.removeMatchingPair', { n: index + 1 })}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => syncPairs([...pairs, { left: '', right: '' }])}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t('questionBank.addMatchingPair')}
      </Button>
    </div>
  );
}
