import { useEffect, useMemo, useState } from 'react';
import {
  getQuestionCategoryIds,
  type QuestionBankQuestion as Question,
} from '@mms/shared';

interface UseQuestionBankFiltersOptions {
  questions: Question[];
  onFilteredCountChange?: (count: number) => void;
}

export function useQuestionBankFilters({
  questions,
  onFilteredCountChange,
}: UseQuestionBankFiltersOptions) {
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      questions.filter((question) => {
        const matchesSearch = !search || question.text.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          filterCats.length === 0 ||
          getQuestionCategoryIds(question).some((categoryId) => filterCats.includes(categoryId));
        const matchesDifficulty = filterDiff.length === 0 || filterDiff.includes(question.difficulty);
        return matchesSearch && matchesCategory && matchesDifficulty;
      }),
    [questions, search, filterCats, filterDiff],
  );

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  return {
    search,
    setSearch,
    filterCats,
    setFilterCats,
    filterDiff,
    setFilterDiff,
    filtered,
  };
}
