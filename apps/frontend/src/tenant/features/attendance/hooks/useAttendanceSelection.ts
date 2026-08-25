import { useState, useCallback } from 'react';
import type { AttendanceRecord } from '@/lib/data/attendanceData';

/** Work directory row selection SSOT for attendance records (person-directory shape). */
export function useAttendanceSelection(records: AttendanceRecord[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allVisibleSelected = records.length > 0
    && records.every((record) => selectedIds.includes(record.id));
  const someVisibleSelected = records.some((record) => selectedIds.includes(record.id));

  const toggleSelectAll = useCallback((checked: boolean) => {
    const visibleIds = records.map((record) => record.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  }, [records]);

  const toggleSelectedRecord = useCallback((id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  return {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedRecord,
    clearSelection,
  };
}
