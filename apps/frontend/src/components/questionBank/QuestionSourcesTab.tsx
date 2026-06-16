import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import {
  QUESTION_SOURCE_FIELD_TO_KEY,
  createQuestionSourceBook,
  getBookCitationFieldIds,
  getBookDefinitionFieldIds,
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

const INPUT =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20';
const LABEL =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

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

function renderSourceInput(
  field: ModuleFieldDef,
  value: string,
  onChange: (value: string) => void,
  label: string,
  inputId: string,
  required?: boolean,
): React.ReactNode {
  const requiredMark = required ? ' *' : '';
  if (field.type === 'textarea') {
    return (
      <div key={field.id} className="sm:col-span-2">
        <label htmlFor={inputId} className={LABEL}>{label}{requiredMark}</label>
        <textarea
          id={inputId}
          className={`${INPUT} resize-none`}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div key={field.id}>
      <label htmlFor={inputId} className={LABEL}>{label}{requiredMark}</label>
      <input
        id={inputId}
        type={field.type === 'date' ? 'date' : 'text'}
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function QuestionSourcesTab({
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
      ? draftBook.fieldIds.filter((id) => id !== fieldId)
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
    const next = citationEntries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
    onCitationsChange(next.filter((entry) => entry.bookId));
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
    onCitationsChange([...citationEntries.filter((e) => e.bookId), { bookId: '', citation: {} }]);
  };

  const removeCitation = (index: number): void => {
    const next = citationEntries.filter((_, i) => i !== index);
    onCitationsChange(next.filter((entry) => entry.bookId));
  };

  if (availableFieldIds.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('questionBank.sourcesDisabledHint')}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-bold text-foreground">{t('questionBank.sourceBooksTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={startNewBook}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            {t('questionBank.addSourceBook')}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">{t('questionBank.sourceBooksHint')}</p>

        {sourceBooks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('questionBank.noSourceBooks')}</p>
        ) : (
          <ul className="space-y-2">
            {sourceBooks.map((book) => (
              <li
                key={book.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{book.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('questionBank.sourceBookFieldCount', { count: book.fieldIds.length })}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEditBook(book)}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted"
                  >
                    {t('questionBank.editSourceBook')}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBook(book.id)}
                    className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label={t('questionBank.deleteSourceBook', { name: book.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showBookForm && draftBook && (
          <div className="space-y-4 rounded-xl border border-dashed border-primary/30 bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              {editingBookId ? t('questionBank.editSourceBook') : t('questionBank.addSourceBook')}
            </p>

            <div>
              <span className={LABEL}>{t('questionBank.selectBookFields')}</span>
              <div className="flex flex-wrap gap-2">
                {availableFieldIds.map((fieldId) => {
                  const selected = draftBook.fieldIds.includes(fieldId);
                  return (
                    <button
                      key={fieldId}
                      type="button"
                      onClick={() => fieldId !== 'sourceBookName' && toggleBookField(fieldId)}
                      disabled={fieldId === 'sourceBookName'}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {fieldLabel(fieldId)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {getBookDefinitionFieldIds(draftBook).map((fieldId) => {
                const field = fieldById.get(fieldId);
                if (!field) return null;
                const key = QUESTION_SOURCE_FIELD_TO_KEY[fieldId];
                const value = String(draftBook.metadata[key] ?? '');
                return renderSourceInput(
                  field,
                  value,
                  (next) => updBookMeta(fieldId, next),
                  fieldLabel(fieldId, field.label),
                  `qb-book-${fieldId}`,
                  fieldId === 'sourceBookName',
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveBook}
                disabled={!draftBook.metadata.bookName?.trim() && !draftBook.name.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {t('questionBank.saveSourceBook')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBookForm(false);
                  setDraftBook(null);
                  setEditingBookId(null);
                }}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                {t('questionBank.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] text-muted-foreground">{t('questionBank.citationsForQuestionHint')}</p>
        {sourceBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('questionBank.addBookBeforeCitation')}</p>
        ) : (
          citationEntries.map((entry, index) => {
            const book = sourceBooks.find((b) => b.id === entry.bookId);
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
                    <button
                      type="button"
                      onClick={() => removeCitation(index)}
                      className="flex min-h-8 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t('questionBank.removeCitation')}
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor={`qb-citation-book-${index}`} className={LABEL}>
                    {t('questionBank.selectSourceBook')}
                  </label>
                  <select
                    id={`qb-citation-book-${index}`}
                    className={`${INPUT} cursor-pointer`}
                    value={entry.bookId}
                    onChange={(e) => updCitation(index, { bookId: e.target.value, citation: {} })}
                  >
                    <option value="">{t('questionBank.selectSourceBook')}</option>
                    {sourceBooks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {book && citationFieldIds.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {citationFieldIds.map((fieldId) => {
                      const field = fieldById.get(fieldId);
                      if (!field || !isQuestionSourceFieldId(fieldId)) return null;
                      const key = QUESTION_SOURCE_FIELD_TO_KEY[fieldId];
                      const value = String(entry.citation[key] ?? '');
                      return renderSourceInput(
                        field,
                        value,
                        (next) => updCitationField(index, key, next),
                        fieldLabel(fieldId, field.label),
                        `qb-citation-${index}-${fieldId}`,
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
          <button
            type="button"
            onClick={addCitation}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('questionBank.addBookCitation')}
          </button>
        )}
      </section>
    </div>
  );
}
