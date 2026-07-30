import React from 'react';
import { Input } from '@/components/ui/input';
import {
  countFillBlankMarkers,
  joinQuestionCompoundAnswer,
  splitQuestionCompoundAnswer,
  type AppTranslationKey,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import { QuestionMatchingFields } from './QuestionMatchingFields';
import { QuestionOrderingFields } from './QuestionOrderingFields';

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
  const sizedItems = [...items];
  while (sizedItems.length < size) sizedItems.push('');
  return sizedItems.slice(0, Math.max(size, 0));
}

export function QuestionTypeAnswerFields({
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
        <p className="text-xs text-muted-foreground">{t('questionBank.fillBlankHint')}</p>
        <span className={FORM_LABEL}>{t('questionBank.blankAnswers')}</span>
        <div className="space-y-2">
          {blanks.map((blank, index) => (
            <div key={index}>
              <label htmlFor={`qb-blank-${index}`} className="mb-1 block text-xs font-medium text-foreground">
                {t('questionBank.blankAnswerN', { n: index + 1 })}
              </label>
              <Input
                id={`qb-blank-${index}`}
                className={FORM_INPUT}
                value={blank}
                onChange={(event) => {
                  const updatedBlanks = [...blanks];
                  updatedBlanks[index] = event.target.value;
                  onAnswerChange(joinQuestionCompoundAnswer(updatedBlanks));
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (questionType === 'matching') {
    return (
      <QuestionMatchingFields
        options={options}
        answer={answer}
        onOptionsChange={onOptionsChange}
        onAnswerChange={onAnswerChange}
        t={t}
      />
    );
  }

  if (questionType === 'ordering') {
    return (
      <QuestionOrderingFields
        options={options}
        onOptionsChange={onOptionsChange}
        onAnswerChange={onAnswerChange}
        t={t}
      />
    );
  }

  if (questionType === 'numeric') {
    const tolerance = options[0] ?? '';

    return (
      <div className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
        <div>
          <label htmlFor="qb-numeric-answer" className={FORM_LABEL}>{t('questionBank.numericAnswer')} *</label>
          <Input
            id="qb-numeric-answer"
            type="number"
            className={FORM_INPUT}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="qb-numeric-tolerance" className={FORM_LABEL}>{t('questionBank.numericTolerance')}</label>
          <Input
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
