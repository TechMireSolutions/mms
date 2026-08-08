import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeacherList';

/** Directory filters, sort, trash, and selection SSOT for Teachers Work (Students-shaped). */
export function useTeachersDirectoryFilters() {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<TeacherSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterStatus, filterSpecialization, showDeleted, sortField, sortDir]);

  useEffect(() => {
    setSelectedIds([]);
  }, [listPage, debouncedSearch, filterStatus, filterSpecialization, showDeleted, sortField, sortDir]);

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
    setSelectedIds([]);
  }, []);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((current) => toggleIdInSelection(current, id));
  }, []);

  const handleSelectAll = useCallback((pageIds: string[]) => {
    setSelectedIds((current) => togglePageIdsInSelection(current, pageIds));
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
    selectedIds,
    clearSelection,
    handleSelectOne,
    handleSelectAll,
    toggleStatus,
    clearFilters,
    hasActiveFilters,
  };
}
