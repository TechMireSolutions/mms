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
import {
  FACULTY_WORK_SUB_TAB_DEFAULT,
  FACULTY_WORK_SUB_TAB_IDS,
  FACULTY_WORK_SUB_TAB_ICONS,
  FACULTY_WORK_SUB_TAB_KEYS,
  resolveFacultyWorkSubTab,
  type FacultyWorkSubTabId,
} from '@/tenant/features/faculty/facultyPageWorkSubTabs';
import { useFacultyIoActions } from '@/tenant/features/faculty/hooks/useFacultyIoActions';

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

  const baseTabs = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const visibleTabs = baseTabs.map((tab) =>
    tab.id === 'work' ? { ...tab, label: t('faculty.tabs.faculties') } : tab,
  );
  const workSubTabs = FACULTY_WORK_SUB_TAB_IDS.map((id) => ({
    key: id,
    label: t(FACULTY_WORK_SUB_TAB_KEYS[id]),
    icon: FACULTY_WORK_SUB_TAB_ICONS[id],
  }));
  const { data: metrics } = useFacultyMetrics();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const config = useFacultyConfig();
  const lookups = useFacultyLookupOptions();
  const columnLayout = useFacultyColumnLayout(config.settings);

  const [activeTab, setActiveTab] = usePersistedTabState<string>('faculty_active_tab', 'work');
  const [rawWorkSubTab, setActiveWorkSubTab] = usePersistedTabState<string>(
    'faculty_work_subtab',
    FACULTY_WORK_SUB_TAB_DEFAULT,
  );
  const activeWorkSubTab = resolveFacultyWorkSubTab(rawWorkSubTab);
  const effectiveTab = resolveModuleTierTab(activeTab, visibleTabs.map((tab) => tab.id));
  const showDirectoryActions = effectiveTab === 'work' && activeWorkSubTab === 'faculties';
  const showWorkHeaderActions = effectiveTab === 'work';

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
    canWrite: canWrite && showDirectoryActions,
    showDeleted: filters.showDeleted,
    onCreate: formState.openCreate,
  });

  const mutations = useFacultyMutations();
  const pageActions = useFacultyPageActions({ editFaculty: formState.editFaculty });

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
      handleRestore: pageActions.handleRestore,
      handleDelete: pageActions.handleDelete,
      handleBulkDelete: pageActions.handleBulkDelete,
      handleBulkRestore: pageActions.handleBulkRestore,
    },
    selectedIds: filters.selectedIds,
    clearSelection: filters.clearSelection,
  });

  const { onExportEntity, onImportEntity } = useFacultyIoActions({
    canExport,
    handleFacultyExport: workTierState.handleExportCSV,
    setImportEntity: overlays.setImportEntity,
  });

  return {
    canWrite,
    canExport,
    visibleTabs,
    workSubTabs,
    activeWorkSubTab,
    setActiveWorkSubTab: (subTab: FacultyWorkSubTabId) => setActiveWorkSubTab(subTab),
    showDirectoryActions,
    showWorkHeaderActions,
    metricsTotal: metrics?.total,
    activeTab: effectiveTab,
    setActiveTab,
    viewingDeleted: filters.showDeleted,
    shownCount: workTierState.shownCount,
    openCreateForm: formState.openCreate,
    openCreateDepartment: () => overlays.setCreateDepartmentOpen(true),
    openCreateDesignation: () => overlays.setCreateDesignationOpen(true),
    onExportEntity,
    onImportEntity,
    tabPanelProps,
    pageOverlaysProps,
  };
}
