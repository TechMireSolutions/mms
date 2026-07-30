import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  QUESTION_SOURCE_FIELD_TO_KEY,
  getBookCitationFieldIds,
  isQuestionSourceFieldId,
  type AppTranslationKey,
  type ModuleFieldDef,
  type QuestionBookCitation,
  type QuestionSourceBook,
  type QuestionSourceReference,
} from '@mms/shared';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { QuestionSourceInput } from '@/tenant/features/question-bank/components/QuestionSourceInput';

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

interface QuestionSourcesCitationsSectionProps {
  sourceBooks: QuestionSourceBook[];
  citationEntries: QuestionBookCitation[];
  fieldById: Map<string, ModuleFieldDef>;
  fieldLabel: (fieldId: string, fallback?: string) => string;
  t: TranslateFn;
  onUpdateCitation: (index: number, patch: Partial<QuestionBookCitation>) => void;
  onUpdateCitationField: (index: number, key: keyof QuestionSourceReference, value: string) => void;
  onAddCitation: () => void;
  onRemoveCitation: (index: number) => void;
}

export function QuestionSourcesCitationsSection({
  sourceBooks,
  citationEntries,
  fieldById,
  fieldLabel,
  t,
  onUpdateCitation,
  onUpdateCitationField,
  onAddCitation,
  onRemoveCitation,
}: QuestionSourcesCitationsSectionProps): React.JSX.Element {
  return (
    <section className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('questionBank.citationsForQuestionHint')}</p>
      {sourceBooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('questionBank.addBookBeforeCitation')}</p>
      ) : (
        citationEntries.map((entry, index) => {
          const book = sourceBooks.find((sourceBook) => sourceBook.id === entry.bookId);
          const citationFieldIds = book ? getBookCitationFieldIds(book) : [];

          return (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                  {t('questionBank.citationEntry', { n: index + 1 })}
                </p>
                {citationEntries.length > 1 && entry.bookId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemoveCitation(index)}
                    className="flex min-h-11 items-center gap-1 rounded-lg border border-border px-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('questionBank.removeCitation')}
                  </Button>
                )}
              </div>

              <div>
                <label htmlFor={`qb-citation-book-${index}`} className={FORM_LABEL}>
                  {t('questionBank.selectSourceBook')}
                </label>
                <FormSelect
                  id={`qb-citation-book-${index}`}
                  className={FORM_INPUT}
                  value={entry.bookId}
                  onChange={(val) => onUpdateCitation(index, { bookId: val, citation: {} })}
                  placeholder={t('questionBank.selectSourceBook')}
                  options={sourceBooks.map((b) => ({ value: b.id, label: b.name }))}
                />
              </div>

              {book && citationFieldIds.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {citationFieldIds.map((fieldId) => {
                    const field = fieldById.get(fieldId);
                    if (!field || !isQuestionSourceFieldId(fieldId)) return null;
                    const key = QUESTION_SOURCE_FIELD_TO_KEY[fieldId];
                    const value = String(entry.citation[key] ?? '');
                    return (
                      <QuestionSourceInput
                        key={field.id}
                        field={field}
                        value={value}
                        onChange={(next) => onUpdateCitationField(index, key, next)}
                        label={fieldLabel(fieldId, field.label)}
                        inputId={`qb-citation-${index}-${fieldId}`}
                      />
                    );
                  })}
                </div>
              )}

              {book && citationFieldIds.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('questionBank.bookNoCitationFields')}</p>
              )}
            </div>
          );
        })
      )}

      {sourceBooks.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={onAddCitation}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.addBookCitation')}
        </Button>
      )}
    </section>
  );
}
