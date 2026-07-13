import { translateAppParams, type AppTranslationKey } from './appTranslations.js';
import {
  APP_LANGUAGES,
  normalizeAppLanguage,
  type AppLanguageCode,
} from './languageUtils.js';

/** Supported question content languages (matches app UI languages). */
export const QUESTION_LANGUAGE_IDS = APP_LANGUAGES.map((lang) => lang.code);
export type QuestionLanguageCode = AppLanguageCode;

/** Question difficulty levels for the question bank. */
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

/** Supported question formats. */
export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short'
  | 'fill_blank'
  | 'matching'
  | 'numeric'
  | 'ordering';

/** Registry ids for difficulty — labels via `questionBank.difficulty.*` i18n keys. */
export const QUESTION_DIFFICULTY_IDS = ['easy', 'medium', 'hard'] as const;

/** Registry ids for question types — labels via `questionBank.type.*` i18n keys. */
export const QUESTION_TYPE_IDS = [
  'mcq',
  'true_false',
  'short',
  'fill_blank',
  'matching',
  'numeric',
  'ordering',
] as const;

/** Placeholder in question text for each blank (`fill_blank`). */
export const FILL_BLANK_MARKER = '___';

/** Delimiter for multi-part stored answers (blanks, matching rights, ordering). */
export const QUESTION_COMPOUND_ANSWER_DELIMITER = '|||';

/** Tailwind badge classes keyed by difficulty id (labels via i18n). */
export const QUESTION_DIFFICULTY_BADGE_CLASSES: Record<QuestionDifficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-red-50 text-red-700 border-red-200',
};

/** Display icons keyed by question type id (labels via i18n). */
export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  mcq: '◉',
  true_false: '⊙',
  short: '✎',
  fill_blank: '▢',
  matching: '⇄',
  numeric: '#',
  ordering: '↕',
};

/** Splits compound answers stored on a question. */
export function splitQuestionCompoundAnswer(answer: string): string[] {
  return answer
    .split(QUESTION_COMPOUND_ANSWER_DELIMITER)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Joins compound answer parts for storage. */
export function joinQuestionCompoundAnswer(parts: readonly string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join(QUESTION_COMPOUND_ANSWER_DELIMITER);
}

/** Counts blank markers in fill-in-the-blank question text. */
export function countFillBlankMarkers(text: string): number {
  const matches = text.match(/___/g);
  return matches?.length ?? 0;
}

/** Matching: `options` = left column; `answer` = right column (same order, compound). */
export function getMatchingPairCount(question: Pick<QuestionBankQuestion, 'type' | 'options' | 'answer'>): number {
  if (question.type !== 'matching') return 0;
  return Math.max(question.options.filter(Boolean).length, splitQuestionCompoundAnswer(question.answer).length);
}

/** Whether a student response matches the configured correct answer. */
export function isQuestionAnswerCorrect(
  question: Pick<QuestionBankQuestion, 'type' | 'answer' | 'options'>,
  studentAnswer: string | undefined,
): boolean {
  if (!studentAnswer?.trim()) return false;
  const student = studentAnswer.trim();
  const expected = question.answer.trim();

  switch (question.type) {
    case 'mcq':
    case 'true_false':
      return student === expected;
    case 'short':
      return student.toLowerCase() === expected.toLowerCase();
    case 'numeric': {
      const target = Number(expected);
      const actual = Number(student);
      const tolerance = Number(question.options?.[0] ?? 0);
      if (Number.isNaN(target) || Number.isNaN(actual)) return false;
      const delta = Number.isNaN(tolerance) ? 0 : Math.abs(tolerance);
      return Math.abs(target - actual) <= delta;
    }
    case 'fill_blank': {
      const expectedParts = splitQuestionCompoundAnswer(expected);
      const studentParts = splitQuestionCompoundAnswer(student);
      if (expectedParts.length === 0 || expectedParts.length !== studentParts.length) return false;
      return expectedParts.every(
        (part, index) => part.toLowerCase() === studentParts[index].toLowerCase(),
      );
    }
    case 'matching': {
      const expectedRights = splitQuestionCompoundAnswer(expected);
      const studentRights = splitQuestionCompoundAnswer(student);
      if (expectedRights.length === 0 || expectedRights.length !== studentRights.length) return false;
      return expectedRights.every(
        (part, index) => part.toLowerCase() === studentRights[index].toLowerCase(),
      );
    }
    case 'ordering': {
      const expectedOrder = splitQuestionCompoundAnswer(expected);
      const studentOrder = splitQuestionCompoundAnswer(student);
      if (expectedOrder.length === 0 || expectedOrder.length !== studentOrder.length) return false;
      return expectedOrder.every((item, index) => item === studentOrder[index]);
    }
    default:
      return student === expected;
  }
}

/** Normalizes type-specific options/answer before save. */
export function normalizeQuestionTypePayload(
  raw: Pick<QuestionBankQuestion, 'type' | 'text' | 'options' | 'answer'>,
): Pick<QuestionBankQuestion, 'options' | 'answer'> {
  switch (raw.type) {
    case 'ordering': {
      const items = raw.options.map((item) => item.trim()).filter(Boolean);
      return {
        options: items,
        answer: joinQuestionCompoundAnswer(items),
      };
    }
    case 'matching': {
      const lefts = raw.options.map((item) => item.trim()).filter(Boolean);
      const rights = splitQuestionCompoundAnswer(raw.answer);
      const size = Math.max(lefts.length, rights.length);
      const normalizedLefts: string[] = [];
      const normalizedRights: string[] = [];
      for (let i = 0; i < size; i += 1) {
        const left = lefts[i]?.trim() ?? '';
        const right = rights[i]?.trim() ?? '';
        if (!left && !right) continue;
        normalizedLefts.push(left);
        normalizedRights.push(right);
      }
      return {
        options: normalizedLefts,
        answer: joinQuestionCompoundAnswer(normalizedRights),
      };
    }
    case 'fill_blank':
      return {
        options: [],
        answer: joinQuestionCompoundAnswer(splitQuestionCompoundAnswer(raw.answer)),
      };
    case 'numeric':
      return {
        options: raw.options?.[0]?.trim() ? [String(raw.options[0]).trim()] : [],
        answer: String(raw.answer ?? '').trim(),
      };
    default:
      return {
        options: Array.isArray(raw.options) ? raw.options : [],
        answer: String(raw.answer ?? ''),
      };
  }
}

/** Analytics accuracy tier thresholds (percent). */
export const QUESTION_ACCURACY_WEAK_THRESHOLD = 60;
export const QUESTION_ACCURACY_GOOD_THRESHOLD = 75;
export const QUESTION_ACCURACY_EXCELLENT_THRESHOLD = 85;

/** Progress bar colour class for category accuracy tiers. */
export function questionAccuracyBarClass(accuracy: number): string {
  if (accuracy < QUESTION_ACCURACY_WEAK_THRESHOLD) return 'bg-destructive';
  if (accuracy < QUESTION_ACCURACY_GOOD_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
}

/** Text colour class for category accuracy tiers. */
export function questionAccuracyTextClass(accuracy: number): string {
  if (accuracy < QUESTION_ACCURACY_WEAK_THRESHOLD) return 'text-destructive';
  if (accuracy < QUESTION_ACCURACY_GOOD_THRESHOLD) return 'text-amber-600';
  return 'text-emerald-600';
}

/** Bibliographic / source reference stored on a question (book, volume, page, etc.). */
export interface QuestionSourceReference {
  bookName?: string;
  series?: string;
  bookVolume?: string;
  volumePart?: string;
  edition?: string;
  isbn?: string;
  author?: string;
  editor?: string;
  translator?: string;
  publisher?: string;
  cityOfPublication?: string;
  publishDate?: string;
  yearHijri?: string;
  language?: string;
  chapter?: string;
  pageNumber?: string;
  paragraph?: string;
  footnote?: string;
  surah?: string;
  ayah?: string;
  juz?: string;
  hizb?: string;
  hadithCollection?: string;
  hadithNumber?: string;
  manuscript?: string;
  catalogNumber?: string;
  quote?: string;
  notes?: string;
}

/** System field ids for source reference sub-fields (Setup → Fields). */
export const QUESTION_SOURCE_FIELD_IDS = [
  'sourceBookName',
  'sourceSeries',
  'sourceBookVolume',
  'sourceVolumePart',
  'sourceEdition',
  'sourceIsbn',
  'sourceAuthor',
  'sourceEditor',
  'sourceTranslator',
  'sourcePublisher',
  'sourceCityOfPublication',
  'sourcePublishDate',
  'sourceYearHijri',
  'sourceLanguage',
  'sourceChapter',
  'sourcePageNumber',
  'sourceParagraph',
  'sourceFootnote',
  'sourceSurah',
  'sourceAyah',
  'sourceJuz',
  'sourceHizb',
  'sourceHadithCollection',
  'sourceHadithNumber',
  'sourceManuscript',
  'sourceCatalogNumber',
  'sourceQuote',
  'sourceNotes',
] as const;

export type QuestionSourceFieldId = (typeof QUESTION_SOURCE_FIELD_IDS)[number];

/** Maps source field registry ids to `QuestionSourceReference` keys. */
export const QUESTION_SOURCE_FIELD_TO_KEY: Record<
  QuestionSourceFieldId,
  keyof QuestionSourceReference
> = {
  sourceBookName: 'bookName',
  sourceSeries: 'series',
  sourceBookVolume: 'bookVolume',
  sourceVolumePart: 'volumePart',
  sourceEdition: 'edition',
  sourceIsbn: 'isbn',
  sourceAuthor: 'author',
  sourceEditor: 'editor',
  sourceTranslator: 'translator',
  sourcePublisher: 'publisher',
  sourceCityOfPublication: 'cityOfPublication',
  sourcePublishDate: 'publishDate',
  sourceYearHijri: 'yearHijri',
  sourceLanguage: 'language',
  sourceChapter: 'chapter',
  sourcePageNumber: 'pageNumber',
  sourceParagraph: 'paragraph',
  sourceFootnote: 'footnote',
  sourceSurah: 'surah',
  sourceAyah: 'ayah',
  sourceJuz: 'juz',
  sourceHizb: 'hizb',
  sourceHadithCollection: 'hadithCollection',
  sourceHadithNumber: 'hadithNumber',
  sourceManuscript: 'manuscript',
  sourceCatalogNumber: 'catalogNumber',
  sourceQuote: 'quote',
  sourceNotes: 'notes',
};

/** Returns whether a field id belongs to the source reference group. */
export function isQuestionSourceFieldId(fieldId: string): fieldId is QuestionSourceFieldId {
  return (QUESTION_SOURCE_FIELD_IDS as readonly string[]).includes(fieldId);
}

/** Add-question form / fields-settings tab ids (Categories | Question | Sources). */
export type QuestionBankFormTabId = 'categories' | 'question' | 'sources';

export const QUESTION_BANK_FORM_TAB_ORDER: readonly QuestionBankFormTabId[] = [
  'categories',
  'question',
  'sources',
] as const;

const QUESTION_BANK_CATEGORIES_FIELD_IDS = new Set([
  'categoryId',
  'questionLanguage',
  'difficulty',
]);

/** Maps a question-bank field id to its form/settings tab. */
export function getQuestionBankFieldFormTab(fieldId: string): QuestionBankFormTabId {
  if (isQuestionSourceFieldId(fieldId)) return 'sources';
  if (QUESTION_BANK_CATEGORIES_FIELD_IDS.has(fieldId)) return 'categories';
  return 'question';
}

/** Splits a stored field order into per-tab segments. */
export function partitionQuestionBankFieldOrder(
  fieldOrder: readonly string[],
): Record<QuestionBankFormTabId, string[]> {
  const buckets: Record<QuestionBankFormTabId, string[]> = {
    categories: [],
    question: [],
    sources: [],
  };
  for (const fieldId of fieldOrder) {
    buckets[getQuestionBankFieldFormTab(fieldId)].push(fieldId);
  }
  return buckets;
}

/** Replaces one tab segment after drag-reorder within that tab. */
export function mergeQuestionBankFieldOrder(
  fieldOrder: readonly string[],
  tabId: QuestionBankFormTabId,
  reorderedTabIds: readonly string[],
): string[] {
  const buckets = partitionQuestionBankFieldOrder(fieldOrder);
  buckets[tabId] = [...reorderedTabIds];
  return QUESTION_BANK_FORM_TAB_ORDER.flatMap((tab) => buckets[tab]);
}

/** Fields filled once when defining a source book in the registry. */
export const QUESTION_SOURCE_BOOK_FIELD_IDS: readonly QuestionSourceFieldId[] = [
  'sourceBookName',
  'sourceSeries',
  'sourceBookVolume',
  'sourceEdition',
  'sourceIsbn',
  'sourceAuthor',
  'sourceEditor',
  'sourceTranslator',
  'sourcePublisher',
  'sourceCityOfPublication',
  'sourcePublishDate',
  'sourceYearHijri',
  'sourceLanguage',
  'sourceHadithCollection',
  'sourceManuscript',
  'sourceCatalogNumber',
];

/** Fields filled per question when citing a registered book. */
export const QUESTION_SOURCE_CITATION_FIELD_IDS: readonly QuestionSourceFieldId[] = [
  'sourceVolumePart',
  'sourceChapter',
  'sourcePageNumber',
  'sourceParagraph',
  'sourceFootnote',
  'sourceSurah',
  'sourceAyah',
  'sourceJuz',
  'sourceHizb',
  'sourceHadithNumber',
  'sourceQuote',
  'sourceNotes',
];

/** Registered bibliographic source book — defined once, reused via dropdown. */
export interface QuestionSourceBook {
  id: string;
  name: string;
  /** Source field ids that apply to this book (from global registry). */
  fieldIds: QuestionSourceFieldId[];
  /** Book-level metadata (author, publisher, etc.). */
  metadata: QuestionSourceReference;
}

/** Per-question citation pointing at a registered book plus location details. */
export interface QuestionBookCitation {
  bookId: string;
  citation: Partial<QuestionSourceReference>;
}

export function isQuestionSourceBookFieldId(fieldId: string): boolean {
  return (QUESTION_SOURCE_BOOK_FIELD_IDS as readonly string[]).includes(fieldId);
}

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

/** Book-level fields to show when creating or editing a registry book. */
export function getBookDefinitionFieldIds(
  book: Pick<QuestionSourceBook, 'fieldIds'>,
): QuestionSourceFieldId[] {
  return book.fieldIds.filter((fieldId) => isQuestionSourceBookFieldId(fieldId));
}

/** Citation fields to show on a question for a selected book. */
export function getBookCitationFieldIds(
  book: Pick<QuestionSourceBook, 'fieldIds'>,
): QuestionSourceFieldId[] {
  return book.fieldIds.filter((fieldId) => isQuestionSourceCitationFieldId(fieldId));
}

/** Merges book metadata with per-question citation into one reference. */
export function resolveQuestionBookCitation(
  citation: QuestionBookCitation,
  books: readonly QuestionSourceBook[],
): QuestionSourceReference | undefined {
  const book = books.find((entry) => entry.id === citation.bookId);
  if (!book) return compactQuestionSource(citation.citation as QuestionSourceReference);
  return compactQuestionSource({
    ...book.metadata,
    bookName: book.metadata.bookName ?? book.name,
    ...citation.citation,
  });
}

export function compactQuestionBookCitations(
  citations?: QuestionBookCitation[] | null,
): QuestionBookCitation[] | undefined {
  const compacted = (citations ?? [])
    .filter((entry) => entry.bookId?.trim())
    .map((entry) => ({
      bookId: entry.bookId.trim(),
      citation: compactQuestionSource(entry.citation as QuestionSourceReference) ?? {},
    }));
  return compacted.length > 0 ? compacted : undefined;
}

/** Question shape used for category merge helpers. */
export type QuestionCategoryRef = {
  categoryIds?: string[];
  categoryId?: string | null;
};

/** Question shape used for source merge helpers. */
export type QuestionSourceRef = {
  sourceCitations?: QuestionBookCitation[];
  sources?: QuestionSourceReference[];
  source?: QuestionSourceReference;
};

/** Resolves category ids from `categoryIds` or legacy `categoryId`. */
export function getQuestionCategoryIds(question: QuestionCategoryRef): string[] {
  const fromArray = (question.categoryIds ?? []).map((categoryId) => categoryId?.trim()).filter(Boolean) as string[];
  if (fromArray.length > 0) return [...new Set(fromArray)];
  const legacy = question.categoryId?.trim();
  return legacy ? [legacy] : [];
}

/** Resolves source entries from citations, `sources`, or legacy `source`. */
export function getQuestionSources(
  question: QuestionSourceRef,
  books?: readonly QuestionSourceBook[],
): QuestionSourceReference[] {
  const fromCitations = (question.sourceCitations ?? [])
    .map((entry) => resolveQuestionBookCitation(entry, books ?? []))
    .filter((entry): entry is QuestionSourceReference => !!entry);
  if (fromCitations.length > 0) return fromCitations;

  const fromArray = (question.sources ?? [])
    .map((entry) => compactQuestionSource(entry))
    .filter((entry): entry is QuestionSourceReference => !!entry);
  if (fromArray.length > 0) return fromArray;
  const legacy = compactQuestionSource(question.source);
  return legacy ? [legacy] : [];
}

/** Resolves per-question citations (new format). */
export function getQuestionBookCitations(question: QuestionSourceRef): QuestionBookCitation[] {
  if (Array.isArray(question.sourceCitations) && question.sourceCitations.length > 0) {
    return question.sourceCitations.filter((entry) => entry.bookId?.trim());
  }
  return [];
}

/** Compacts and dedupes source entries; returns `undefined` when empty. */
export function compactQuestionSources(
  sources?: QuestionSourceReference[] | null,
): QuestionSourceReference[] | undefined {
  const compacted = (sources ?? [])
    .map((entry) => compactQuestionSource(entry))
    .filter((entry): entry is QuestionSourceReference => !!entry);
  return compacted.length > 0 ? compacted : undefined;
}

/**
 * Normalizes legacy single category/source fields into arrays for storage.
 */
export function normalizeQuestionBankQuestion(
  raw: Partial<QuestionBankQuestion> | QuestionBankQuestion,
): QuestionBankQuestion {
  const categoryIds = getQuestionCategoryIds(raw);
  const compactedCitations = compactQuestionBookCitations(
    raw.sourceCitations as QuestionBookCitation[] | undefined,
  );
  const compactedSources = compactQuestionSources(getQuestionSources(raw));
  const type = (raw.type as QuestionType) ?? 'mcq';
  const typePayload = normalizeQuestionTypePayload({
    type,
    text: String(raw.text ?? ''),
    options: Array.isArray(raw.options) ? (raw.options as string[]) : [],
    answer: String(raw.answer ?? ''),
  });
  return {
    ...raw,
    id: String(raw.id ?? ''),
    categoryIds,
    categoryId: categoryIds[0] ?? '',
    type,
    difficulty: (raw.difficulty as QuestionDifficulty) ?? 'easy',
    questionLanguage: normalizeAppLanguage(raw.questionLanguage as string | undefined),
    text: String(raw.text ?? ''),
    options: typePayload.options,
    answer: typePayload.answer,
    marks:
      raw.marks === undefined || raw.marks === null
        ? 1
        : typeof raw.marks === 'number'
          ? raw.marks
          : Number(raw.marks) || 1,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
    sourceCitations: compactedCitations,
    sources: compactedSources,
    source: compactedSources?.[0],
  } as QuestionBankQuestion;
}

/** Joins multiple source citations for list display. */
export function formatQuestionSourcesCitation(
  question: QuestionSourceRef,
  t: QuestionSourceCitationTranslator,
  books?: readonly QuestionSourceBook[],
): string | null {
  const entries = getQuestionSources(question, books);
  const lines = entries
    .map((entry) => formatQuestionSourceCitation(entry, t))
    .filter((line): line is string => !!line);
  return lines.length > 0 ? lines.join(' | ') : null;
}

/** Drops empty source values; returns `undefined` when nothing is set. */
export function compactQuestionSource(
  source?: QuestionSourceReference | null,
): QuestionSourceReference | undefined {
  if (!source) return undefined;
  const compactSource: QuestionSourceReference = {};
  for (const [key, value] of Object.entries(source)) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (trimmed) {
      (compactSource as Record<string, string>)[key] = trimmed;
    }
  }
  return Object.keys(compactSource).length > 0 ? compactSource : undefined;
}

export type QuestionSourceCitationTranslator = (
  key: AppTranslationKey,
  params?: Record<string, string | number>,
) => string;

/**
 * Builds a compact citation line from populated source reference parts.
 */
export function formatQuestionSourceCitation(
  source: QuestionSourceReference | undefined,
  t: QuestionSourceCitationTranslator,
): string | null {
  if (!source) return null;
  const parts: string[] = [];
  if (source.bookName) parts.push(source.bookName);
  if (source.series) {
    parts.push(t('questionBank.source.citationSeries', { series: source.series }));
  }
  if (source.hadithCollection) parts.push(source.hadithCollection);
  if (source.author) parts.push(source.author);
  if (source.editor) {
    parts.push(t('questionBank.source.citationEditor', { editor: source.editor }));
  }
  if (source.translator) {
    parts.push(t('questionBank.source.citationTranslator', { translator: source.translator }));
  }
  if (source.bookVolume) {
    parts.push(t('questionBank.source.citationVol', { volume: source.bookVolume }));
  }
  if (source.volumePart) {
    parts.push(t('questionBank.source.citationPart', { part: source.volumePart }));
  }
  if (source.edition) {
    parts.push(t('questionBank.source.citationEdition', { edition: source.edition }));
  }
  if (source.chapter) {
    parts.push(t('questionBank.source.citationChapter', { chapter: source.chapter }));
  }
  if (source.surah) {
    parts.push(t('questionBank.source.citationSurah', { surah: source.surah }));
  }
  if (source.ayah) {
    parts.push(t('questionBank.source.citationAyah', { ayah: source.ayah }));
  }
  if (source.juz) {
    parts.push(t('questionBank.source.citationJuz', { juz: source.juz }));
  }
  if (source.hizb) {
    parts.push(t('questionBank.source.citationHizb', { hizb: source.hizb }));
  }
  if (source.pageNumber) {
    parts.push(t('questionBank.source.citationPage', { page: source.pageNumber }));
  }
  if (source.paragraph) {
    parts.push(t('questionBank.source.citationParagraph', { paragraph: source.paragraph }));
  }
  if (source.footnote) {
    parts.push(t('questionBank.source.citationFootnote', { footnote: source.footnote }));
  }
  if (source.hadithNumber) {
    parts.push(t('questionBank.source.citationHadith', { number: source.hadithNumber }));
  }
  if (source.manuscript) {
    parts.push(t('questionBank.source.citationManuscript', { manuscript: source.manuscript }));
  }
  if (source.catalogNumber) {
    parts.push(t('questionBank.source.citationCatalog', { catalog: source.catalogNumber }));
  }
  if (source.isbn) {
    parts.push(t('questionBank.source.citationIsbn', { isbn: source.isbn }));
  }
  if (source.publisher) parts.push(source.publisher);
  if (source.cityOfPublication) parts.push(source.cityOfPublication);
  if (source.publishDate) parts.push(source.publishDate);
  if (source.yearHijri) {
    parts.push(t('questionBank.source.citationYearHijri', { year: source.yearHijri }));
  }
  if (source.language) {
    parts.push(t('questionBank.source.citationLanguage', { language: source.language }));
  }
  if (source.quote) {
    parts.push(t('questionBank.source.citationQuote', { quote: source.quote }));
  }
  if (source.notes) parts.push(source.notes);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** i18n keys for system question form fields (Setup → Fields registry). */
export const QUESTION_BANK_FIELD_LABEL_KEYS: Record<string, AppTranslationKey> = {
  text: 'questionBank.questionText',
  categoryId: 'questionBank.category',
  questionLanguage: 'questionBank.questionLanguage',
  type: 'questionBank.type',
  difficulty: 'questionBank.difficulty',
  options: 'questionBank.optionsLabel',
  answer: 'questionBank.correctAnswer',
  sourceBookName: 'questionBank.source.bookName',
  sourceSeries: 'questionBank.source.series',
  sourceBookVolume: 'questionBank.source.bookVolume',
  sourceVolumePart: 'questionBank.source.volumePart',
  sourceEdition: 'questionBank.source.edition',
  sourceIsbn: 'questionBank.source.isbn',
  sourceAuthor: 'questionBank.source.author',
  sourceEditor: 'questionBank.source.editor',
  sourceTranslator: 'questionBank.source.translator',
  sourcePublisher: 'questionBank.source.publisher',
  sourceCityOfPublication: 'questionBank.source.cityOfPublication',
  sourcePublishDate: 'questionBank.source.publishDate',
  sourceYearHijri: 'questionBank.source.yearHijri',
  sourceLanguage: 'questionBank.source.language',
  sourceChapter: 'questionBank.source.chapter',
  sourcePageNumber: 'questionBank.source.pageNumber',
  sourceParagraph: 'questionBank.source.paragraph',
  sourceFootnote: 'questionBank.source.footnote',
  sourceSurah: 'questionBank.source.surah',
  sourceAyah: 'questionBank.source.ayah',
  sourceJuz: 'questionBank.source.juz',
  sourceHizb: 'questionBank.source.hizb',
  sourceHadithCollection: 'questionBank.source.hadithCollection',
  sourceHadithNumber: 'questionBank.source.hadithNumber',
  sourceManuscript: 'questionBank.source.manuscript',
  sourceCatalogNumber: 'questionBank.source.catalogNumber',
  sourceQuote: 'questionBank.source.quote',
  sourceNotes: 'questionBank.source.notes',
};

/** Localized "{field} is required" for question bank form validation. */
export function translateQuestionFieldRequired(
  fieldId: string,
  language: string,
  fallbackLabel?: string,
): string {
  const labelKey = QUESTION_BANK_FIELD_LABEL_KEYS[fieldId];
  const fieldName = labelKey
    ? translateAppParams(labelKey, language)
    : (fallbackLabel ?? fieldId);
  return translateAppParams('questionBank.fieldRequired', language, { field: fieldName });
}

export interface QuestionTypeRegistryEntry {
  id: QuestionType;
  enabled: boolean;
}

export interface QuestionDifficultyRegistryEntry {
  id: QuestionDifficulty;
  enabled: boolean;
}

export interface QuestionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** Palette for auto-assigned category colours. */
export const QUESTION_CATEGORY_COLORS: readonly string[] = [
  '#0d9488',
  '#7c3aed',
  '#b45309',
  '#0369a1',
  '#be185d',
  '#059669',
  '#d97706',
  '#dc2626',
  '#4f46e5',
  '#0891b2',
];

/**
 * Slugifies a category display name for stable ids.
 */
export function slugifyCategoryName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'category';
}

/**
 * Creates a unique category entry from a user-provided name.
 */
export function createQuestionCategory(
  name: string,
  existing: readonly QuestionCategory[] = [],
  patch?: Partial<Pick<QuestionCategory, 'icon' | 'color'>>,
): QuestionCategory {
  const trimmed = name.trim();
  const slug = slugifyCategoryName(trimmed);
  let id = `cat-${slug}`;
  let suffix = 1;
  while (existing.some((category) => category.id === id)) {
    id = `cat-${slug}-${suffix}`;
    suffix += 1;
  }
  const colorIdx = existing.length % QUESTION_CATEGORY_COLORS.length;
  return {
    id,
    name: trimmed,
    icon: patch?.icon ?? '📚',
    color: patch?.color ?? QUESTION_CATEGORY_COLORS[colorIdx],
  };
}

/**
 * Merges configured categories with any category ids referenced on questions.
 */
export function mergeQuestionCategories(
  configured: readonly QuestionCategory[],
  questions?: readonly QuestionCategoryRef[],
): QuestionCategory[] {
  const categoryById = new Map<string, QuestionCategory>();
  for (const category of configured) {
    if (category.id) categoryById.set(category.id, category);
  }
  for (const question of questions ?? []) {
    for (const questionCategoryId of getQuestionCategoryIds(question)) {
      if (!questionCategoryId || categoryById.has(questionCategoryId)) continue;
      const inferredName = questionCategoryId.startsWith('cat-')
        ? questionCategoryId
            .slice(4)
            .split('-')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : questionCategoryId;
      categoryById.set(questionCategoryId, {
        id: questionCategoryId,
        name: inferredName,
        icon: '📋',
        color: QUESTION_CATEGORY_COLORS[categoryById.size % QUESTION_CATEGORY_COLORS.length],
      });
    }
  }
  return [...categoryById.values()].sort((leftCategory, rightCategory) => leftCategory.name.localeCompare(rightCategory.name));
}

/**
 * Inserts or replaces a category in the list by id.
 */
export function upsertQuestionCategory(
  categories: readonly QuestionCategory[],
  category: QuestionCategory,
): QuestionCategory[] {
  const categoryIndex = categories.findIndex((existingCategory) => existingCategory.id === category.id);
  if (categoryIndex >= 0) {
    return categories.map((existingCategory, index) => (index === categoryIndex ? category : existingCategory));
  }
  return [...categories, category];
}

export interface QuestionBankQuestion {
  id: string;
  /** All categories for this question (one or more). */
  categoryIds: string[];
  /** @deprecated First category — kept for legacy reads; use `categoryIds`. */
  categoryId?: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  /** Language the question text is written in. */
  questionLanguage: QuestionLanguageCode;
  text: string;
  options: string[];
  answer: string;
  /** @deprecated Marks removed from UI — defaults to 1 for grading; kept for legacy stored questions. */
  marks?: number;
  /** @deprecated Tags removed from UI — kept for legacy stored questions. */
  tags?: string[];
  /** Registered-book citations for this question. */
  sourceCitations?: QuestionBookCitation[];
  /** @deprecated Resolved flat sources — derived from citations for legacy reads. */
  sources?: QuestionSourceReference[];
  /** @deprecated First source — kept for legacy reads; use `sourceCitations`. */
  source?: QuestionSourceReference;
}

export interface QuestionBankTest {
  id: string;
  name: string;
  categoryId: string | null;
  questionIds: string[];
  difficulty: QuestionDifficulty | 'mixed';
  duration: number;
  createdAt: string;
  /** Manual paper-builder class/section label printed on the exam paper. */
  examClass?: string;
  /** Manual paper-builder total marks printed on the exam paper. */
  totalMarks?: number;
  /** Manual paper-builder instructions printed before paper sections. */
  instructions?: string;
  /** Manual paper-builder sections and their selected question order. */
  sections?: QuestionBankPaperSection[];
}

export interface QuestionBankPaperSection {
  id: string;
  title: string;
  instructions: string;
  questionIds: string[];
}

export interface QuestionBankResult {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: Record<string, string>;
  scores: Record<string, number>;
}

export const DEFAULT_QUESTION_SOURCE_BOOKS: QuestionSourceBook[] = [
  {
    id: 'book-quran',
    name: 'Quran',
    fieldIds: ['sourceBookName', 'sourceSurah', 'sourceAyah', 'sourceJuz', 'sourcePageNumber'],
    metadata: { bookName: 'Quran' },
  },
  {
    id: 'book-tafsir-ibn-kathir',
    name: 'Tafsir Ibn Kathir',
    fieldIds: [
      'sourceBookName',
      'sourceAuthor',
      'sourcePublisher',
      'sourceSurah',
      'sourceAyah',
      'sourcePageNumber',
    ],
    metadata: {
      bookName: 'Tafsir Ibn Kathir',
      author: 'Ibn Kathir',
    },
  },
];

export const DEFAULT_QUESTION_CATEGORIES: QuestionCategory[] = [
  { id: 'cat1', name: 'Tajweed', icon: '📖', color: '#0d9488' },
  { id: 'cat2', name: 'Hifz', icon: '🕌', color: '#7c3aed' },
  { id: 'cat3', name: 'Islamic Studies', icon: '☪️', color: '#b45309' },
  { id: 'cat4', name: 'Arabic', icon: '✍️', color: '#0369a1' },
  { id: 'cat5', name: 'Aqeedah', icon: '🌙', color: '#be185d' },
];

const DEFAULT_QUESTION_BANK_QUESTIONS_RAW: Array<Partial<QuestionBankQuestion> & Record<string, unknown>> = [
  {
    id: 'q1',
    categoryIds: ['cat1'],
    categoryId: 'cat1',
    type: 'mcq',
    difficulty: 'easy',
    questionLanguage: 'en',
    text: 'Which rule applies when noon sakinah is followed by a letter from (ي ن م و)?',
    options: ['Izhar', 'Idgham', 'Iqlab', 'Ikhfa'],
    answer: 'Idgham',
  },
  {
    id: 'q2',
    categoryIds: ['cat1'],
    categoryId: 'cat1',
    type: 'true_false',
    difficulty: 'easy',
    text: "Madd Tabee'i has a duration of 2 counts.",
    options: ['True', 'False'],
    answer: 'True',
  },
  {
    id: 'q3',
    categoryIds: ['cat3', 'cat1'],
    categoryId: 'cat3',
    type: 'mcq',
    difficulty: 'medium',
    text: 'Which pillar of Islam comes second after Shahada?',
    options: ['Sawm', 'Salah', 'Zakat', 'Hajj'],
    answer: 'Salah',
  },
  {
    id: 'q4',
    categoryIds: ['cat4'],
    categoryId: 'cat4',
    type: 'mcq',
    difficulty: 'medium',
    questionLanguage: 'ar',
    text: 'What is the plural of كتاب (kitab)?',
    options: ['كتب', 'كاتب', 'مكتبة', 'كتابة'],
    answer: 'كتب',
  },
  {
    id: 'q5',
    categoryIds: ['cat5'],
    categoryId: 'cat5',
    type: 'short',
    difficulty: 'hard',
    text: 'Explain the concept of Tawheed Al-Uluhiyyah in your own words.',
    options: [],
    answer:
      'Singling out Allah alone in acts of worship such as prayer, supplication, sacrifice and vows.',
  },
  {
    id: 'q6',
    categoryIds: ['cat2', 'cat3'],
    categoryId: 'cat2',
    type: 'mcq',
    difficulty: 'hard',
    text: 'In Surah Al-Baqarah, which verse is known as Ayat Al-Kursi?',
    options: ['Verse 255', 'Verse 256', 'Verse 257', 'Verse 258'],
    answer: 'Verse 255',
    sourceCitations: [
      {
        bookId: 'book-quran',
        citation: { surah: 'Al-Baqarah', ayah: '255', juz: '3', pageNumber: '42' },
      },
      {
        bookId: 'book-tafsir-ibn-kathir',
        citation: { surah: 'Al-Baqarah', ayah: '255', pageNumber: '120' },
      },
    ],
  },
  {
    id: 'q7',
    categoryIds: ['cat1'],
    categoryId: 'cat1',
    type: 'mcq',
    difficulty: 'medium',
    text: 'Which letter requires Qalqalah?',
    options: ['ب', 'أ', 'ه', 'ف'],
    answer: 'ب',
  },
  {
    id: 'q8',
    categoryIds: ['cat3'],
    categoryId: 'cat3',
    type: 'true_false',
    difficulty: 'easy',
    text: 'The Quran was revealed over a period of 23 years.',
    options: ['True', 'False'],
    answer: 'True',
  },
  {
    id: 'q9',
    categoryIds: ['cat4'],
    categoryId: 'cat4',
    type: 'fill_blank',
    difficulty: 'easy',
    questionLanguage: 'en',
    text: 'The plural of كتاب (kitab) is ___.',
    options: [],
    answer: 'كتب',
  },
  {
    id: 'q10',
    categoryIds: ['cat3'],
    categoryId: 'cat3',
    type: 'matching',
    difficulty: 'medium',
    text: 'Match each pillar to its order.',
    options: ['Shahada', 'Salah', 'Zakat'],
    answer: '1st pillar|||2nd pillar|||3rd pillar',
  },
  {
    id: 'q11',
    categoryIds: ['cat1'],
    categoryId: 'cat1',
    type: 'numeric',
    difficulty: 'easy',
    text: "How many counts does Madd Tabee'i have?",
    options: ['0'],
    answer: '2',
  },
  {
    id: 'q12',
    categoryIds: ['cat3'],
    categoryId: 'cat3',
    type: 'ordering',
    difficulty: 'medium',
    text: 'Arrange the pillars of Islam in order.',
    options: ['Shahada', 'Salah', 'Zakat', 'Sawm', 'Hajj'],
    answer: 'Shahada|||Salah|||Zakat|||Sawm|||Hajj',
  },
];

export const DEFAULT_QUESTION_BANK_QUESTIONS: QuestionBankQuestion[] =
  DEFAULT_QUESTION_BANK_QUESTIONS_RAW.map((question) => normalizeQuestionBankQuestion(question));

export const DEFAULT_QUESTION_BANK_TESTS: QuestionBankTest[] = [
  {
    id: 't1',
    name: 'Tajweed Basics — Term 1',
    categoryId: 'cat1',
    questionIds: ['q1', 'q2', 'q7'],
    difficulty: 'easy',
    duration: 20,
    createdAt: '2026-03-10',
  },
  {
    id: 't2',
    name: 'Islamic Studies Mid-Term',
    categoryId: 'cat3',
    questionIds: ['q3', 'q8'],
    difficulty: 'medium',
    duration: 30,
    createdAt: '2026-03-25',
  },
  {
    id: 't3',
    name: 'Comprehensive Assessment',
    categoryId: null,
    questionIds: ['q1', 'q3', 'q4', 'q5', 'q6'],
    difficulty: 'mixed',
    duration: 45,
    createdAt: '2026-04-05',
  },
];

export const DEFAULT_QUESTION_BANK_RESULTS: QuestionBankResult[] = [
  {
    id: 'r1',
    testId: 't1',
    studentName: 'Ahmed Ali',
    studentId: 's1',
    submittedAt: '2026-03-15',
    answers: { q1: 'Idgham', q2: 'True', q7: 'ب' },
    scores: { q1: 2, q2: 1, q7: 2 },
  },
  {
    id: 'r2',
    testId: 't1',
    studentName: 'Fatima Zahra',
    studentId: 's2',
    submittedAt: '2026-03-15',
    answers: { q1: 'Izhar', q2: 'True', q7: 'ب' },
    scores: { q1: 0, q2: 1, q7: 2 },
  },
  {
    id: 'r3',
    testId: 't1',
    studentName: 'Umar Hassan',
    studentId: 's3',
    submittedAt: '2026-03-15',
    answers: { q1: 'Idgham', q2: 'False', q7: 'أ' },
    scores: { q1: 2, q2: 0, q7: 0 },
  },
  {
    id: 'r4',
    testId: 't2',
    studentName: 'Ahmed Ali',
    studentId: 's1',
    submittedAt: '2026-03-28',
    answers: { q3: 'Salah', q8: 'True' },
    scores: { q3: 2, q8: 1 },
  },
  {
    id: 'r5',
    testId: 't2',
    studentName: 'Fatima Zahra',
    studentId: 's2',
    submittedAt: '2026-03-28',
    answers: { q3: 'Zakat', q8: 'True' },
    scores: { q3: 0, q8: 1 },
  },
];
