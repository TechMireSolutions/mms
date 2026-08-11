import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Enrollment } from '@/lib/data/enrollmentData';

/** Work directory row selection SSOT for Enrollments (Sessions-shaped). */
export function useEnrollmentsSelection(enrollments: Enrollment[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = enrollments.length > 0
    && enrollments.every((enrollmentItem) => selectedIds.includes(enrollmentItem.id));
  const someVisibleSelected = enrollments.some((enrollmentItem) => selectedIds.includes(enrollmentItem.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = enrollments.map((enrollmentItem) => enrollmentItem.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedEnrollment = (id: string, checked: boolean) => {
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
    toggleSelectedEnrollment,
    clearSelection,
  };
}

export type EnrollmentsSelection = ReturnType<typeof useEnrollmentsSelection>;
export type { Dispatch, SetStateAction };
