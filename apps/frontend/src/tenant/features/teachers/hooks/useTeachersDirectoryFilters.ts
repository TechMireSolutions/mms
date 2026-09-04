import { useCallback, useEffect, useState } from 'react';
import {
  isTeachersQuickFilter,
  type TeachersQuickFilter,
} from '@mms/shared';
import { useDebounce } from '@/hooks/useDebounce';
import {
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';
import {
  TEACHERS_WORK_DRILLDOWN_EVENT,
  consumeTeachersWorkDrillDown,
  type TeachersWorkDrillDown,
} from '@/tenant/features/teachers/hooks/teachersWorkDrillDown';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeachersList';

/** Directory filters, sort, trash, and selection SSOT for Teachers Work (Students-shaped). */
export function useTeachersDirectoryFilters({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<TeacherSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [quickFilter, setQuickFilter] = useState<TeachersQuickFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [
    debouncedSearch,
    filterStatus,
    filterSpecialization,
    filterGender,
    quickFilter,
    showDeleted,
    sortField,
    sortDir,
  ]);

  useEffect(() => {
    setSelectedIds([]);
  }, [
    listPage,
    debouncedSearch,
    filterStatus,
    filterSpecialization,
    filterGender,
    quickFilter,
    showDeleted,
    sortField,
    sortDir,
  ]);

  const toggleStatus = ((status: string) => {
    // Manual status selection supersedes any quick-filter preset.
    setQuickFilter('all');
    setFilterStatus((selectedStatuses) => {
      const nextSet = new Set(selectedStatuses);
      if (nextSet.has(status)) {
        nextSet.delete(status);
      } else {
        nextSet.add(status);
      }
      return [...nextSet];
    });
  });

  const applyDrillDown = useCallback(
    (filter: TeachersWorkDrillDown) => {
      setQuickFilter('all');
      setFilterStatus([]);
      if (filter.quickFilter && isTeachersQuickFilter(filter.quickFilter)) {
        setQuickFilter(filter.quickFilter);
      }
      setActiveTab('work');
    },
    [setActiveTab],
  );

  useEffect(() => {
    const pending = consumeTeachersWorkDrillDown();
    if (pending) applyDrillDown(pending);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TeachersWorkDrillDown>).detail;
      if (detail) applyDrillDown(detail);
    };
    window.addEventListener(TEACHERS_WORK_DRILLDOWN_EVENT, handler);
    return () => window.removeEventListener(TEACHERS_WORK_DRILLDOWN_EVENT, handler);
  }, [applyDrillDown]);

  const changeQuickFilter = ((preset: string) => {
    if (!isTeachersQuickFilter(preset)) return;
    // Status presets express status via the preset; clear the overlapping status filter.
    setFilterStatus([]);
    setQuickFilter(preset);
  });

  const clearFilters = (() => {
    setSearch('');
    setFilterStatus([]);
    setFilterSpecialization('');
    setFilterGender('');
    setQuickFilter('all');
  });

  const clearSelection = (() => {
    setSelectedIds([]);
  });

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterStatus.length > 0 ||
    Boolean(filterSpecialization) ||
    Boolean(filterGender) ||
    quickFilter !== 'all';

  const activeFilterCount =
    filterStatus.length +
    (filterSpecialization ? 1 : 0) +
    (filterGender ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (quickFilter !== 'all' ? 1 : 0);

  const handleSelectOne = ((id: string) => {
    setSelectedIds((current) => toggleIdInSelection(current, id));
  });

  const handleSelectAll = ((pageIds: string[]) => {
    setSelectedIds((current) => togglePageIdsInSelection(current, pageIds));
  });

  return {
    listPage,
    setListPage,
    showDeleted,
    setShowDeleted,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    search,
    setSearch,
    debouncedSearch,
    filterStatus,
    setFilterStatus,
    filterSpecialization,
    setFilterSpecialization,
    filterGender,
    setFilterGender,
    quickFilter,
    changeQuickFilter,
    selectedIds,
    clearSelection,
    handleSelectOne,
    handleSelectAll,
    toggleStatus,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}
