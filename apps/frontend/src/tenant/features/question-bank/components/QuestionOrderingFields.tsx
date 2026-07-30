import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinQuestionCompoundAnswer, type AppTranslationKey } from '@mms/shared';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

interface QuestionOrderingFieldsProps {
  options: string[];
  onOptionsChange: (options: string[]) => void;
  onAnswerChange: (answer: string) => void;
  t: TranslateFn;
}

export function QuestionOrderingFields({
  options,
  onOptionsChange,
  onAnswerChange,
  t,
}: QuestionOrderingFieldsProps): React.JSX.Element {
  const items = options.length > 0 ? options : ['', ''];

  const syncItems = (nextItems: string[]): void => {
    onOptionsChange(nextItems);
    onAnswerChange(joinQuestionCompoundAnswer(nextItems));
  };

  const moveItem = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reorderedItems = [...items];
    [reorderedItems[index], reorderedItems[target]] = [reorderedItems[target], reorderedItems[index]];
    syncItems(reorderedItems);
  };

  return (
    <div className="space-y-3 sm:col-span-2">
      <span className={FORM_LABEL}>{t('questionBank.orderingItems')}</span>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-6 flex-shrink-0 text-center text-xs font-bold text-muted-foreground">{index + 1}</span>
          <Input
            className={FORM_INPUT}
            value={item}
            placeholder={t('questionBank.orderingItemN', { n: index + 1 })}
            onChange={(event) => {
              const updatedItems = [...items];
              updatedItems[index] = event.target.value;
              syncItems(updatedItems);
            }}
          />
          <div className="flex flex-shrink-0 flex-col gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === 0}
              onClick={() => moveItem(index, -1)}
              className="rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
              aria-label={t('questionBank.moveOrderingUp', { n: index + 1 })}
            >
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === items.length - 1}
              onClick={() => moveItem(index, 1)}
              className="rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40"
              aria-label={t('questionBank.moveOrderingDown', { n: index + 1 })}
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
          {items.length > 2 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => syncItems(items.filter((_, i) => i !== index))}
              className="rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-destructive"
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
        onClick={() => syncItems([...items, ''])}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t('questionBank.addOrderingItem')}
      </Button>
    </div>
  );
}
