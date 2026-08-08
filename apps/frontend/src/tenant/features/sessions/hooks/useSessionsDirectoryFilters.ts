import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { SessionSortField, SessionStatus, SessionType } from '@/tenant/features/sessions/components/sessionPageTypes';

/** Directory filters, sort, and trash SSOT for Sessions Work (Teachers/Users-shaped). */
export function useSessionsDirectoryFilters() {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<SessionSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterStatus, setFilterStatus] = useState<SessionStatus[]>([]);
  const [filterType, setFilterType] = useState<SessionType[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedSearch, filterStatus, filterType, showDeleted, sortField, sortDir]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterStatus([]);
    setFilterType([]);
  }, []);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterStatus.length > 0 ||
    filterType.length > 0;

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
    filterType,
    setFilterType,
    clearFilters,
    hasActiveFilters,
  };
}
