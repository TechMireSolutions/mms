import { useCallback, useEffect, useState } from 'react';
import {
  isFacultyQuickFilter,
  type FacultyQuickFilter,
} from '@mms/shared';
import { useDebounce } from '@/hooks/useDebounce';
import { useDirectoryTrashState } from '@/hooks/useDirectoryTrashState';
import {
  toggleIdInSelection,
  togglePageIdsInSelection,
} from '@/lib/directorySelection';
import {
  FACULTY_WORK_DRILLDOWN_EVENT,
  consumeFacultyWorkDrillDown,
  type FacultyWorkDrillDown,
} from '@/tenant/features/faculty/hooks/facultyWorkDrillDown';
import type { FacultySortField } from '@/tenant/features/faculty/components/facultyListTypes';

/** Directory filters, sort, trash, and selection SSOT for Faculty Work. */
export function useFacultyDirectoryFilters({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useDirectoryTrashState();
  const [sortField, setSortField] = useState<FacultySortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterReportingFacultyId, setFilterReportingFacultyId] = useState('');
  const [quickFilter, setQuickFilter] = useState<FacultyQuickFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setListPage(1);
  }, [
    debouncedSearch,
    filterStatus,
    filterSpecialization,
    filterGender,
    filterDepartment,
    filterDesignation,
    filterReportingFacultyId,
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
    filterDepartment,
    filterDesignation,
    filterReportingFacultyId,
    quickFilter,
    showDeleted,
    sortField,
    sortDir,
  ]);

  const toggleStatus = useCallback((status: string) => {
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
  }, []);

  const applyDrillDown = useCallback(
    (filter: FacultyWorkDrillDown) => {
      setQuickFilter('all');
      setFilterStatus([]);
      if (filter.quickFilter && isFacultyQuickFilter(filter.quickFilter)) {
        setQuickFilter(filter.quickFilter);
      }
      if (filter.department) setFilterDepartment(filter.department);
      if (filter.designation) setFilterDesignation(filter.designation);
      if (filter.reportingFacultyId) setFilterReportingFacultyId(filter.reportingFacultyId);
      setActiveTab('faculties');
    },
    [setActiveTab],
  );

  useEffect(() => {
    const pending = consumeFacultyWorkDrillDown();
    if (pending) applyDrillDown(pending);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FacultyWorkDrillDown>).detail;
      if (detail) applyDrillDown(detail);
    };
    window.addEventListener(FACULTY_WORK_DRILLDOWN_EVENT, handler);
    return () => window.removeEventListener(FACULTY_WORK_DRILLDOWN_EVENT, handler);
  }, [applyDrillDown]);

  const changeQuickFilter = useCallback((preset: string) => {
    if (!isFacultyQuickFilter(preset)) return;
    // Status presets express status via the preset; clear the overlapping status filter.
    setFilterStatus([]);
    setQuickFilter(preset);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilterStatus([]);
    setFilterSpecialization('');
    setFilterGender('');
    setFilterDepartment('');
    setFilterDesignation('');
    setFilterReportingFacultyId('');
    setQuickFilter('all');
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filterStatus.length > 0 ||
    Boolean(filterSpecialization) ||
    Boolean(filterGender) ||
    Boolean(filterDepartment) ||
    Boolean(filterDesignation) ||
    Boolean(filterReportingFacultyId) ||
    quickFilter !== 'all';

  const activeFilterCount =
    filterStatus.length +
    (filterSpecialization ? 1 : 0) +
    (filterGender ? 1 : 0) +
    (filterDepartment ? 1 : 0) +
    (filterDesignation ? 1 : 0) +
    (filterReportingFacultyId ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (quickFilter !== 'all' ? 1 : 0);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((current) => toggleIdInSelection(current, id));
  }, []);

  const handleSelectAll = useCallback((pageIds: string[]) => {
    setSelectedIds((current) => togglePageIdsInSelection(current, pageIds));
  }, []);

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
    filterDepartment,
    setFilterDepartment,
    filterDesignation,
    setFilterDesignation,
    filterReportingFacultyId,
    setFilterReportingFacultyId,
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
