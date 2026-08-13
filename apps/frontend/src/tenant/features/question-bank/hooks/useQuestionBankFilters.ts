import { useEffect, useState } from 'react';
import { QUESTION_BANK_MODULE_MANIFEST, type QuestionBankQuestion as Question } from '@mms/shared';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuestionBankPaginated } from '@/tenant/features/question-bank/hooks/useQuestionBankApi';
import type { UseQueryResult } from '@tanstack/react-query';
import type { QuestionBankListPageResult } from '@mms/shared';

const QUESTION_SEARCH_DEBOUNCE_MS = 300;

interface UseQuestionBankFiltersOptions {
  showDeleted?: boolean;
  onFilteredCountChange?: (count: number) => void;
}

/**
 * Owns the Work questions filter state + SQL-paged query. The list display reads
 * `pageQuestions`/`serverTotal` from the server; the full question list stays
 * with the controller for `useQuestionBankConfig` (category/difficulty options)
 * and PaperBuilder.
 */
export function useQuestionBankFilters({
  showDeleted = false,
  onFilteredCountChange,
}: UseQuestionBankFiltersOptions) {
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);

  const debouncedSearch = useDebounce(search, QUESTION_SEARCH_DEBOUNCE_MS);

  // Server-side filter/page reset whenever a filter dimension changes.
  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterCats, filterDiff, showDeleted]);

  const pageQuery: UseQueryResult<QuestionBankListPageResult> = useQuestionBankPaginated({
    page: listPage,
    limit: QUESTION_BANK_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    categoryId: filterCats.length ? filterCats.join(',') : undefined,
    difficulty: filterDiff.length ? filterDiff.join(',') : undefined,
    includeDeleted: showDeleted,
  });

  const pageQuestions: Question[] = pageQuery.data?.questions ?? [];
  const serverTotal = pageQuery.data?.total ?? 0;
  const serverPage = pageQuery.data?.page ?? listPage;
  const serverLimit = pageQuery.data?.limit ?? QUESTION_BANK_MODULE_MANIFEST.defaultPageSize;
  const serverHasMore = pageQuery.data?.hasMore ?? false;

  useEffect(() => {
    onFilteredCountChange?.(serverTotal);
  }, [onFilteredCountChange, serverTotal]);

  return {
    search,
    setSearch,
    filterCats,
    setFilterCats,
    filterDiff,
    setFilterDiff,
    listPage,
    setListPage,
    pageQuestions,
    pageQuery,
    serverTotal,
    serverPage,
    serverLimit,
    serverHasMore,
  };
}