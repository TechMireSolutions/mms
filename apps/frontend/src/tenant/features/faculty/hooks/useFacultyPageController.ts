import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { FACULTY_MODULE_MANIFEST, resolveModuleTierTab } from '@mms/shared';
import { useFacultyMutations, useFacultyMetrics } from '@/tenant/features/faculty/hooks/useFaculty';
import { useFacultyDirectoryFilters } from '@/tenant/features/faculty/hooks/useFacultyDirectoryFilters';
import { useEmployeeIdMigration } from '@/tenant/features/faculty/hooks/useEmployeeIdMigration';
import { useFacultyKeyboardShortcuts } from '@/tenant/features/faculty/hooks/useFacultyKeyboardShortcuts';
import { useFacultyPageActions } from '@/tenant/features/faculty/hooks/useFacultyPageActions';
import { useFacultyPageFormState } from '@/tenant/features/faculty/hooks/useFacultyPageFormState';
import { useFacultyPageOverlayState } from '@/tenant/features/faculty/hooks/useFacultyPageOverlayState';
import { useFacultyPageOverlayProps } from '@/tenant/features/faculty/hooks/useFacultyPageOverlayProps';
import { useFacultyColumnLayout } from '@/tenant/features/faculty/hooks/useFacultyColumnLayout';
import { useFacultyLookupOptions } from '@/tenant/features/faculty/hooks/useFacultyStatusConfig';
import { useFacultyConfig } from '@/hooks/useStandardModuleConfig';
import { useFacultyWorkTierState } from '@/tenant/features/faculty/hooks/useFacultyWorkTierState';
import { useFacultyWorkPanelProps } from '@/tenant/features/faculty/hooks/useFacultyWorkPanelProps';

export function useFacultyPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(FACULTY_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { data: metrics } = useFacultyMetrics();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const config = useFacultyConfig();
  const lookups = useFacultyLookupOptions();
  const columnLayout = useFacultyColumnLayout(config.settings);

  const [activeTab, setActiveTab] = usePersistedTabState<string>('faculty_active_tab', 'work');
  const effectiveTab = resolveModuleTierTab(activeTab, visibleTabs.map((tab) => tab.id));

  useEmployeeIdMigration(effectiveTab, canEditSetup);

  const filters = useFacultyDirectoryFilters({ setActiveTab });

  useEffect(() => {
    filters.setListPage(1);
  }, [viewMode, filters.setListPage]);

  const formState = useFacultyPageFormState();
  const overlays = useFacultyPageOverlayState();

  useFacultyKeyboardShortcuts({
    selectedCount: filters.selectedIds.length,
    hasActiveFilters: filters.hasActiveFilters,
    clearFilters: filters.clearFilters,
    clearSelection: filters.clearSelection,
    canWrite,
    showDeleted: filters.showDeleted,
    onCreate: formState.openCreate,
  });

  const mutations = useFacultyMutations();
  const pageActions = useFacultyPageActions({ editTeacher: formState.editTeacher, editFaculty: formState.editFaculty });

  const workTierState = useFacultyWorkTierState({
    effectiveTab,
    listPage: filters.listPage,
    debouncedSearch: filters.debouncedSearch,
    filterStatus: filters.filterStatus,
    filterSpecialization: filters.filterSpecialization,
    filterGender: filters.filterGender,
    quickFilter: filters.quickFilter,
    sortField: filters.sortField,
    sortDir: filters.sortDir,
    showDeleted: filters.showDeleted,
    columnLayout,
    canExport,
    hasActiveFilters: filters.hasActiveFilters,
    selectedIds: filters.selectedIds,
    logExportAudit: mutations.logExportAudit,
    t,
  });

  const tabPanelProps = useFacultyWorkPanelProps({
    effectiveTab,
    filters,
    config,
    lookups,
    columnLayout,
    workTierState,
    mutations,
    pageActions,
    formState,
    overlays,
    viewMode,
    setViewMode,
    canWrite,
    canDelete,
    canExport,
  });

  const pageOverlaysProps = useFacultyPageOverlayProps({
    canWrite,
    canDelete,
    formState,
    overlays,
    workActions: {
      handleSaveFaculty: pageActions.handleSaveFaculty,
      handleSaveTeacher: pageActions.handleSaveTeacher,
      handleRestore: pageActions.handleRestore,
      handleDelete: pageActions.handleDelete,
      handleBulkDelete: pageActions.handleBulkDelete,
      handleBulkRestore: pageActions.handleBulkRestore,
    },
    selectedIds: filters.selectedIds,
    clearSelection: filters.clearSelection,
  });

  return {
    canWrite,
    canExport,
    visibleTabs,
    metricsTotal: metrics?.total,
    activeTab: effectiveTab,
    setActiveTab,
    viewingDeleted: filters.showDeleted,
    shownCount: workTierState.shownCount,
    openCreateForm: formState.openCreate,
    handleExportCSV: workTierState.handleExportCSV,
    tabPanelProps,
    pageOverlaysProps,
  };
}

export const useTeachersPageController = useFacultyPageController;
