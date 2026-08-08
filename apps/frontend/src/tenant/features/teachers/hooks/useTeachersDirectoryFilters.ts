import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeacherList';

/** Directory filters, sort, and trash SSOT for Teachers Work (Students-shaped). */
export function useTeachersDirectoryFilters() {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<TeacherSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [selectionClearToken, setSelectionClearToken] = useState(0);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterStatus, filterSpecialization, showDeleted, sortField, sortDir]);

  const toggleStatus = (status: string) =>
    setFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterStatus([]);
    setFilterSpecialization('');
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionClearToken((token) => token + 1);
  }, []);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterStatus.length > 0 ||
    Boolean(filterSpecialization);

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
    toggleStatus,
    clearFilters,
    clearSelection,
    hasActiveFilters,
    selectionClearToken,
  };
}
