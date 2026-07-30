import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  QUESTION_SOURCE_FIELD_TO_KEY,
  createQuestionSourceBook,
  getBookCitationFieldIds,
  isQuestionSourceFieldId,
  type AppTranslationKey,
  type ModuleFieldDef,
  type QuestionBookCitation,
  type QuestionSourceBook,
  type QuestionSourceFieldId,
  type QuestionSourceReference,
} from '@mms/shared';
import {
  persistQuestionSourceBook,
  removeQuestionSourceBook,
} from '@/lib/data/questionBankSourceBooks';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { QuestionSourceBooksSection } from "@/tenant/features/question-bank/components/QuestionSourceBooksSection";
import { QuestionSourceInput } from "@/tenant/features/question-bank/components/QuestionSourceInput";


type TranslateFn = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

interface QuestionSourcesTabProps {
  sourceBooks: QuestionSourceBook[];
  citations: QuestionBookCitation[];
  availableFieldIds: QuestionSourceFieldId[];
  orderedSourceFields: ModuleFieldDef[];
  onCitationsChange: (citations: QuestionBookCitation[]) => void;
  onBooksUpdated: () => void;
  fieldLabel: (fieldId: string, fallback?: string) => string;
  translate?: TranslateFn;
}

export function QuestionSourcesTab({
  sourceBooks,
  citations,
  availableFieldIds,
  orderedSourceFields,
  onCitationsChange,
  onBooksUpdated,
  fieldLabel,
  translate,
}: QuestionSourcesTabProps): React.JSX.Element {
  const { t: globalT } = useTranslation();
  const t = translate ?? globalT;
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [draftBook, setDraftBook] = useState<QuestionSourceBook | null>(null);

  const fieldById = useMemo(
    () => new Map(orderedSourceFields.map((field) => [field.id, field])),
    [orderedSourceFields],
  );

  const citationEntries = citations.length > 0 ? citations : [{ bookId: '', citation: {} }];

  const startNewBook = (): void => {
    setEditingBookId(null);
    setDraftBook(createQuestionSourceBook('', sourceBooks));
    setShowBookForm(true);
  };

  const startEditBook = (book: QuestionSourceBook): void => {
    setEditingBookId(book.id);
    setDraftBook({ ...book, fieldIds: [...book.fieldIds], metadata: { ...book.metadata } });
    setShowBookForm(true);
  };

  const toggleBookField = (fieldId: QuestionSourceFieldId): void => {
    if (!draftBook) return;
    const has = draftBook.fieldIds.includes(fieldId);
    const nextIds = has
      ? draftBook.fieldIds.filter((sourceFieldId) => sourceFieldId !== fieldId)
      : [...draftBook.fieldIds, fieldId];
    if (!nextIds.includes('sourceBookName')) nextIds.unshift('sourceBookName');
    setDraftBook({ ...draftBook, fieldIds: nextIds });
  };

  const updBookMeta = (fieldId: QuestionSourceFieldId, value: string): void => {
    if (!draftBook) return;
    const key = QUESTION_SOURCE_FIELD_TO_KEY[fieldId];
    setDraftBook({
      ...draftBook,
      name: fieldId === 'sourceBookName' ? value || draftBook.name : draftBook.name,
      metadata: { ...draftBook.metadata, [key]: value },
    });
  };

  const saveBook = (): void => {
    if (!draftBook?.name.trim()) return;
    const payload: QuestionSourceBook = {
      ...draftBook,
      name: draftBook.metadata.bookName?.trim() || draftBook.name.trim(),
      metadata: {
        ...draftBook.metadata,
        bookName: draftBook.metadata.bookName?.trim() || draftBook.name.trim(),
      },
    };
    persistQuestionSourceBook(payload);
    onBooksUpdated();
    setShowBookForm(false);
    setDraftBook(null);
    setEditingBookId(null);
  };

  const deleteBook = (bookId: string): void => {
    removeQuestionSourceBook(bookId);
    onBooksUpdated();
    onCitationsChange(citations.filter((entry) => entry.bookId !== bookId));
  };

  const updCitation = (index: number, patch: Partial<QuestionBookCitation>): void => {
    const updatedCitations = citationEntries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry));
    onCitationsChange(updatedCitations.filter((entry) => entry.bookId));
  };

  const updCitationField = (
    index: number,
    key: keyof QuestionSourceReference,
    value: string,
  ): void => {
    const entry = citationEntries[index];
    updCitation(index, {
      citation: { ...entry.citation, [key]: value },
    });
  };

  const addCitation = (): void => {
    onCitationsChange([...citationEntries.filter((citationEntry) => citationEntry.bookId), { bookId: '', citation: {} }]);
  };

  const removeCitation = (index: number): void => {
    const updatedCitations = citationEntries.filter((_, entryIndex) => entryIndex !== index);
    onCitationsChange(updatedCitations.filter((entry) => entry.bookId));
  };

  if (availableFieldIds.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('questionBank.sourcesDisabledHint')}</p>;
  }

  return (
    <div className="space-y-6">
      <QuestionSourceBooksSection
        sourceBooks={sourceBooks}
        availableFieldIds={availableFieldIds}
        draftBook={draftBook}
        editingBookId={editingBookId}
        showBookForm={showBookForm}
        fieldById={fieldById}
        fieldLabel={fieldLabel}
        t={t}
        onStartNew={startNewBook}
        onStartEdit={startEditBook}
        onDeleteBook={deleteBook}
        onToggleBookField={toggleBookField}
        onUpdateBookMeta={updBookMeta}
        onSaveBook={saveBook}
        onCloseBookForm={() => {
          setShowBookForm(false);
          setDraftBook(null);
          setEditingBookId(null);
        }}
      />

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
                      onClick={() => removeCitation(index)}
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
                    onChange={(val) => updCitation(index, { bookId: val, citation: {} })}
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
                          onChange={(next) => updCitationField(index, key, next)}
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
            onClick={addCitation}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('questionBank.addBookCitation')}
          </Button>
        )}
      </section>
    </div>
  );
}
