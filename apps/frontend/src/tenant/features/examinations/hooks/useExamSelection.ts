import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Exam } from '@mms/shared';

/** Work directory row selection SSOT for Examinations (Question Bank-shaped). */
export function useExamSelection(exams: Exam[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = exams.length > 0
    && exams.every((exam) => selectedIds.includes(exam.id));
  const someVisibleSelected = exams.some((exam) => selectedIds.includes(exam.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = exams.map((exam) => exam.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedExam = (id: string, checked: boolean) => {
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
    toggleSelectedExam,
    clearSelection,
  };
}

export type ExamSelection = ReturnType<typeof useExamSelection>;
export type { Dispatch, SetStateAction };
