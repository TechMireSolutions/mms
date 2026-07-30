import { slugifyCategoryName } from './questionBankCategoryUtils.js';
import {
  QUESTION_SOURCE_BOOK_FIELD_IDS,
  QUESTION_SOURCE_CITATION_FIELD_IDS,
  type QuestionSourceBook,
  type QuestionSourceFieldId,
} from './questionBankEntities.js';

/** Returns whether a field belongs to a source-book definition. */
export function isQuestionSourceBookFieldId(fieldId: string): boolean {
  return (QUESTION_SOURCE_BOOK_FIELD_IDS as readonly string[]).includes(fieldId);
}

/** Returns whether a field belongs to a per-question citation. */
export function isQuestionSourceCitationFieldId(fieldId: string): boolean {
  return (QUESTION_SOURCE_CITATION_FIELD_IDS as readonly string[]).includes(fieldId);
}

/** Creates a unique source-book registry entry. */
export function createQuestionSourceBook(
  name: string,
  existing: readonly QuestionSourceBook[] = [],
): QuestionSourceBook {
  const trimmed = name.trim();
  const slug = slugifyCategoryName(trimmed || 'book');
  let id = `book-${slug}`;
  let suffix = 1;
  while (existing.some((book) => book.id === id)) {
    id = `book-${slug}-${suffix}`;
    suffix += 1;
  }
  return {
    id,
    name: trimmed || id,
    fieldIds: ['sourceBookName'],
    metadata: { bookName: trimmed },
  };
}

/** Returns book-level fields used when editing a registry book. */
export function getBookDefinitionFieldIds(
  book: Pick<QuestionSourceBook, 'fieldIds'>,
): QuestionSourceFieldId[] {
  return book.fieldIds.filter((fieldId) => isQuestionSourceBookFieldId(fieldId));
}

/** Returns per-question citation fields used for a selected book. */
export function getBookCitationFieldIds(
  book: Pick<QuestionSourceBook, 'fieldIds'>,
): QuestionSourceFieldId[] {
  return book.fieldIds.filter((fieldId) => isQuestionSourceCitationFieldId(fieldId));
}
