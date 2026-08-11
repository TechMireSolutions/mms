import { useState, type Dispatch, type SetStateAction } from 'react';
import type { QuestionBankQuestion as Question } from '@mms/shared';

/** Work directory row selection SSOT for Question Bank (Finance-shaped). */
export function useQuestionBankSelection(questions: Question[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = questions.length > 0
    && questions.every((question) => selectedIds.includes(question.id));
  const someVisibleSelected = questions.some((question) => selectedIds.includes(question.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = questions.map((question) => question.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedQuestion = (id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  };

  const clearSelection = () => setSelectedIds([]);

  return {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedQuestion,
    clearSelection,
  };
}

export type QuestionBankSelection = ReturnType<typeof useQuestionBankSelection>;
export type { Dispatch, SetStateAction };
