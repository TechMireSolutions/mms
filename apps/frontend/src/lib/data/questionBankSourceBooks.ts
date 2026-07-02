import {
  DEFAULT_QUESTION_BANK_SETTINGS,
  normalizeQuestionBankSettings,
  type QuestionBankSettings,
  type QuestionSourceBook,
} from '@mms/shared';
import { getObject, saveObject } from '@/lib/db';

const SETTINGS_KEY = 'question_bank_settings';

/** Persists the full source-book registry to question-bank settings. */
export function saveQuestionSourceBooks(sourceBooks: QuestionSourceBook[]): void {
  const current = normalizeQuestionBankSettings(
    getObject<QuestionBankSettings>(SETTINGS_KEY, DEFAULT_QUESTION_BANK_SETTINGS),
  );
  saveObject(SETTINGS_KEY, { ...current, sourceBooks });
}

/** Appends or updates one source book and persists. */
export function persistQuestionSourceBook(book: QuestionSourceBook): QuestionSourceBook[] {
  const current = normalizeQuestionBankSettings(
    getObject<QuestionBankSettings>(SETTINGS_KEY, DEFAULT_QUESTION_BANK_SETTINGS),
  );
  const existingSourceBookIndex = current.sourceBooks?.findIndex((entry) => entry.id === book.id) ?? -1;
  const books = current.sourceBooks ?? [];
  const updatedSourceBooks =
    existingSourceBookIndex >= 0
      ? books.map((entry, index) => (index === existingSourceBookIndex ? book : entry))
      : [...books, book];
  saveObject(SETTINGS_KEY, { ...current, sourceBooks: updatedSourceBooks });
  return updatedSourceBooks;
}

/** Removes a source book from the registry. */
export function removeQuestionSourceBook(bookId: string): QuestionSourceBook[] {
  const current = normalizeQuestionBankSettings(
    getObject<QuestionBankSettings>(SETTINGS_KEY, DEFAULT_QUESTION_BANK_SETTINGS),
  );
  const updatedSourceBooks = (current.sourceBooks ?? []).filter((entry) => entry.id !== bookId);
  saveObject(SETTINGS_KEY, { ...current, sourceBooks: updatedSourceBooks });
  return updatedSourceBooks;
}
