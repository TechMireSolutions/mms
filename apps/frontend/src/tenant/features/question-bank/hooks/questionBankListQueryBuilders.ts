import {
  QUESTION_BANK_MODULE_MANIFEST,
  type QuestionBankQuestion,
  type QuestionBankListPageResult,
  type QuestionBankListQuery,
} from '@mms/shared';
import {
  QUESTION_BANK_API,
  QUESTION_BANK_QUESTIONS_QUERY_KEY,
} from '@/tenant/features/question-bank/hooks/useQuestionBankApi';

export type { QuestionBankQuestion, QuestionBankListPageResult };

/** Work list Query params — shared {@link QuestionBankListQuery} + FE-only `enabled`. */
export type QuestionBankPaginatedParams = QuestionBankListQuery & {
  page: number;
  enabled?: boolean;
};

export function buildQuestionBankPageUrl(params: QuestionBankPaginatedParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(params.page));
  queryParams.set('limit', String(params.limit ?? QUESTION_BANK_MODULE_MANIFEST.defaultPageSize));
  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.categoryId?.trim()) queryParams.set('categoryId', params.categoryId.trim());
  if (params.difficulty?.trim()) queryParams.set('difficulty', params.difficulty.trim());
  if (params.sortField?.trim()) queryParams.set('sortField', params.sortField.trim());
  if (params.sortDir?.trim()) queryParams.set('sortDir', params.sortDir.trim());
  if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
  return `${QUESTION_BANK_API}/questions?${queryParams.toString()}`;
}

export function questionBankListQueryKeyParams(params: QuestionBankPaginatedParams) {
  return {
    page: params.page,
    limit: params.limit ?? QUESTION_BANK_MODULE_MANIFEST.defaultPageSize,
    search: params.search?.trim() || '',
    categoryId: params.categoryId?.trim() || '',
    difficulty: params.difficulty?.trim() || '',
    sortField: params.sortField?.trim() || '',
    sortDir: params.sortDir?.trim() || '',
    includeDeleted: Boolean(params.includeDeleted),
  } as const;
}

export function questionBankPaginatedQueryKey(params: QuestionBankPaginatedParams) {
  return [...QUESTION_BANK_QUESTIONS_QUERY_KEY, 'page', questionBankListQueryKeyParams(params)] as const;
}

/** Keep previous page data only when filters match (avoid stale flash on filter change). */
export function sameQuestionBankListFilters(
  previous: ReturnType<typeof questionBankListQueryKeyParams> | undefined,
  next: ReturnType<typeof questionBankListQueryKeyParams>,
): boolean {
  if (!previous) return false;
  return (
    previous.search === next.search &&
    previous.categoryId === next.categoryId &&
    previous.difficulty === next.difficulty &&
    previous.sortField === next.sortField &&
    previous.sortDir === next.sortDir &&
    previous.includeDeleted === next.includeDeleted &&
    previous.limit === next.limit
  );
}