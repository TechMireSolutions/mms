import {
  FACULTY_MODULE_MANIFEST,
  type FacultyMember,
  type FacultySortField,
  type TeachersQuickFilter,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { useFacultyContractList } from "@/tenant/features/faculty/hooks/useFacultyTsrHooks";
import { buildFacultyDirectoryQuery } from "@/tenant/features/faculty/hooks/facultyQueryShared";
import type { useFacultyColumnLayout } from "@/tenant/features/faculty/hooks/useFacultyColumnLayout";
import {
  resolveFacultyExportColumns,
  useFacultyExportActions,
  type UseTeachersExportActionsOptions,
} from "@/tenant/features/faculty/hooks/useFacultyExportActions";

export interface UseFacultyWorkTierStateInput {
  effectiveTab: string;
  listPage: number;
  debouncedSearch: string;
  filterStatus: string[];
  filterSpecialization: string;
  filterGender: string;
  quickFilter: TeachersQuickFilter;
  sortField: FacultySortField;
  sortDir: "asc" | "desc";
  showDeleted: boolean;
  columnLayout: ReturnType<typeof useFacultyColumnLayout>;
  canExport: boolean;
  hasActiveFilters: boolean;
  selectedIds: string[];
  logExportAudit: UseTeachersExportActionsOptions["logExportAudit"];
  t: TranslationFunction;
}

export function useFacultyWorkTierState({
  effectiveTab,
  listPage,
  debouncedSearch,
  filterStatus,
  filterSpecialization,
  filterGender,
  quickFilter,
  sortField,
  sortDir,
  showDeleted,
  columnLayout,
  canExport,
  hasActiveFilters,
  selectedIds,
  logExportAudit,
  t,
}: UseFacultyWorkTierStateInput) {
  const exportColumns = resolveFacultyExportColumns(
    columnLayout.columnRegistry,
    columnLayout.isColumnVisible,
    t,
  );

  const { handleExportCSV, handleBulkExport } = useFacultyExportActions({
    tableColumns: exportColumns,
    canExport,
    search: debouncedSearch,
    filterStatus,
    filterSpecialization,
    filterGender,
    quickFilter,
    sortField,
    sortDir,
    viewingDeleted: showDeleted,
    hasActiveFilters,
    selectedIds,
    logExportAudit,
  });

  const useServerWork = effectiveTab === "work";
  const workPageQuery = useFacultyContractList(
    {
      page: listPage,
      limit: FACULTY_MODULE_MANIFEST.defaultPageSize,
      ...buildFacultyDirectoryQuery({
        search: debouncedSearch,
        filterStatus,
        filterSpecialization,
        filterGender,
        quickFilter,
        sortField,
        sortDir,
      }),
      includeDeleted: showDeleted,
    },
    useServerWork,
  );

  const workTeachers = (workPageQuery.data?.body?.teachers ?? []) as FacultyMember[];
  const shownCount = workPageQuery.data?.body?.total ?? workTeachers.length;
  const isWorkError = workPageQuery.isError || (workPageQuery.data != null && workPageQuery.data.status !== 200);
  const workPageData = workPageQuery.data?.status === 200 ? workPageQuery.data.body : undefined;

  return {
    useServerWork,
    workPageQuery,
    workTeachers,
    shownCount,
    isWorkError,
    workPageData,
    handleExportCSV,
    handleBulkExport,
  };
}
