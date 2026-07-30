import { useEffect, useMemo, useState } from 'react';
import {
  getQuestionCategoryIds,
  type QuestionBankQuestion as Question,
} from '@mms/shared';

interface UseQuestionBankFiltersOptions {
  questions: Question[];
  showDeleted: boolean;
  onFilteredCountChange?: (count: number) => void;
}

export function useQuestionBankFilters({
  questions,
  showDeleted,
  onFilteredCountChange,
}: UseQuestionBankFiltersOptions) {
  const [search, setSearch] = useState('');
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [filterDiff, setFilterDiff] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const toggleSelected = (id: string, checked: boolean): void => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((question) => selectedIds.includes(question.id));

  const toggleSelectAllFiltered = (checked: boolean): void => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((question) => question.id === id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((question) => question.id)])));
  };

  return {
    search,
    setSearch,
    filterCats,
    setFilterCats,
    filterDiff,
    setFilterDiff,
    selectedIds,
    setSelectedIds,
    filtered,
    toggleSelected,
    allFilteredSelected,
    toggleSelectAllFiltered,
  };
}
