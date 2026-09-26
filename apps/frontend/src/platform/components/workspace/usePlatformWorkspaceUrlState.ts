import { useSearchParams } from 'react-router-dom';
import type { WorkspaceSortDirection, WorkspaceSortField } from '@/platform/components/platformWorkspaceListData';

export function usePlatformWorkspaceUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as 'all' | 'active' | 'inactive') ?? 'all';
  const sortField = (searchParams.get('sort') as WorkspaceSortField) ?? 'madrasaName';
  const sortDirection = (searchParams.get('dir') as WorkspaceSortDirection) ?? 'asc';

  const setSearch = (v: string) =>
    setSearchParams((p) => { if (v) { p.set('q', v); } else { p.delete('q'); } return p; }, { replace: true });

  const setStatusFilter = (v: 'all' | 'active' | 'inactive') =>
    setSearchParams((p) => { if (v === 'all') { p.delete('status'); } else { p.set('status', v); } return p; }, { replace: true });

  const toggleSort = (field: WorkspaceSortField): void => {
    setSearchParams((p) => {
      if (sortField === field) {
        p.set('dir', sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        p.set('sort', field);
        p.set('dir', 'asc');
      }
      return p;
    }, { replace: true });
  };

  const isFiltered = Boolean(search || statusFilter !== 'all');

  const handleClearFilters = (): void => {
    setSearchParams((p) => {
      p.delete('q');
      p.delete('status');
      return p;
    }, { replace: true });
  };

  return {
    search,
    statusFilter,
    sortField,
    sortDirection,
    setSearch,
    setStatusFilter,
    toggleSort,
    isFiltered,
    handleClearFilters,
  };
}
