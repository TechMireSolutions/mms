import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import {
  FACULTY_MODULE_MANIFEST,
  resolveModuleTierTab,
  type FacultySortField,
  type FacultyMember,
} from '@mms/shared';
import { useFacultyMutations, useFacultyMetrics } from '@/tenant/features/faculty/hooks/useFaculty';
import { useFacultyContractList } from '@/tenant/features/faculty/hooks/useFacultyTsrHooks';
import { useFacultyDirectoryFilters } from '@/tenant/features/faculty/hooks/useFacultyDirectoryFilters';
import { useEmployeeIdMigration } from '@/tenant/features/faculty/hooks/useEmployeeIdMigration';
import { useFacultyKeyboardShortcuts } from '@/tenant/features/faculty/hooks/useFacultyKeyboardShortcuts';
import { useFacultyPageActions } from '@/tenant/features/faculty/hooks/useFacultyPageActions';
import { useFacultyPageFormState } from '@/tenant/features/faculty/hooks/useFacultyPageFormState';
import { useFacultyPageOverlayState } from '@/tenant/features/faculty/hooks/useFacultyPageOverlayState';
import { useFacultyPageOverlayProps } from '@/tenant/features/faculty/hooks/useFacultyPageOverlayProps';
import { useFacultyPageTabPanelProps } from '@/tenant/features/faculty/hooks/useFacultyPageTabPanelProps';
import { useFacultyColumnLayout } from '@/tenant/features/faculty/hooks/useFacultyColumnLayout';
import { buildFacultyDirectoryQuery } from '@/tenant/features/faculty/hooks/facultyQueryShared';
import { useFacultyLookupOptions } from '@/tenant/features/faculty/hooks/useFacultyStatusConfig';
import { useFacultyConfig } from '@/hooks/useStandardModuleConfig';
import {
  resolveFacultyExportColumns,
  useFacultyExportActions,
} from '@/tenant/features/faculty/hooks/useFacultyExportActions';


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

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const { data: metrics } = useFacultyMetrics();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const { settings, genderFilters } = useFacultyConfig();
  const { statusOptions, specializationOptions } = useFacultyLookupOptions();

  const columnLayout = useFacultyColumnLayout(settings);

  const [activeTab, setActiveTab] = usePersistedTabState<string>('teachers_active_tab', 'work');
  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTabs.map((tab) => tab.id),
  );

  useEmployeeIdMigration(effectiveTab, canEditSetup);

  const {
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
  } = useFacultyDirectoryFilters({ setActiveTab });

  useEffect(() => {
    setListPage(1);
  }, [viewMode, setListPage]);

  const formState = useFacultyPageFormState();
  const overlays = useFacultyPageOverlayState();

  useFacultyKeyboardShortcuts({
    selectedCount: selectedIds.length,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate: formState.openCreate,
  });

  const mutations = useFacultyMutations();
  const pageActions = useFacultyPageActions({ editTeacher: formState.editTeacher, editFaculty: formState.editFaculty });

  const exportColumns = resolveFacultyExportColumns(
    columnLayout.columnRegistry,
    columnLayout.isColumnVisible,
    t,
  );

  const { handleExportCSV, handleBulkExport } = useFacultyExportActions({
    tableColumns: exportColumns,
    canExport,
    // Debounced: the export must cover exactly what the visible list was filtered by.
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
    logExportAudit: mutations.logExportAudit,
  });

  const useServerWork = effectiveTab === 'work';
  const workPageQuery = useFacultyContractList({
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
  }, useServerWork);

  const workTeachers = (() => (workPageQuery.data?.body?.teachers ?? []) as unknown as FacultyMember[])();
  const shownCount = workPageQuery.data?.body?.total ?? workTeachers.length;

  const isWorkError = workPageQuery.isError || (workPageQuery.data != null && workPageQuery.data.status !== 200);
  const workPageData = workPageQuery.data?.status === 200 ? workPageQuery.data.body : undefined;

  const tabPanelProps = useFacultyPageTabPanelProps(effectiveTab, {
    search,
    filterStatus,
    filterSpecialization,
    filterGender,
    quickFilter,
    changeQuickFilter,
    genderFilters,
    activeFilterCount,
    statusOptions,
    specializationOptions,
    showDeleted,
    canWrite,
    canDelete,
    canExport,
    hasActiveFilters,
    columnRegistry: columnLayout.columnRegistry,
    isColumnVisible: columnLayout.isColumnVisible,
    getColumnWidth: columnLayout.getColumnWidth,
    onColumnResize: columnLayout.setColumnWidth,
    updateUserColumnLayout: columnLayout.updateUserColumnLayout,
    onResetLayout: columnLayout.resetColumnLayout,
    customizerLabels: columnLayout.customizerLabels,
    teachers: workTeachers,
    workPageQuery: {
      data: workPageData,
      isLoading: workPageQuery.isLoading,
      isError: isWorkError,
      isFetching: workPageQuery.isFetching,
      refetch: () => {
        void workPageQuery.refetch();
      },
    },
    useServerWork,
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    handleBulkExport,
    sortField,
    sortDir,
    onSortChange: (field: FacultySortField, dir: "asc" | "desc") => {
      setSortField(field);
      setSortDir(dir);
    },
    setSearch,
    toggleStatus,
    setFilterSpecialization,
    setFilterGender,
    toggleViewingDeleted: () => setShowDeleted((previous: boolean) => !previous),
    clearFilters,
    onRetry: () => {
      void workPageQuery.refetch();
    },
    openEditForm: formState.openEdit,
    handleRestore: pageActions.handleRestore,
    handleBulkStatusChange: showDeleted ? undefined : pageActions.handleBulkStatusChange,
    bulkStatusPending: mutations.bulkUpdateTeacherStatus.isPending,
    handleBulkSpecializationChange: showDeleted ? undefined : pageActions.handleBulkSpecializationChange,
    bulkSpecializationPending: pageActions.isBulkSpecializationPending,
    handleWhatsApp: showDeleted ? undefined : pageActions.handleWhatsApp,
    handleSms: showDeleted ? undefined : pageActions.handleSms,
    handleEmail: showDeleted ? undefined : pageActions.handleEmail,
    setListPage,
    viewMode,
    setViewMode,
    workOverlays: {
      openComposer: overlays.openComposer,
      openSelectionMessage: overlays.openSelectionMessage,
      canWriteMessaging: overlays.canWriteMessaging,
      setConfirmBulkDeleteOpen: overlays.setConfirmBulkDeleteOpen,
      setConfirmBulkRestoreOpen: overlays.setConfirmBulkRestoreOpen,
      setDeleteTarget: overlays.setDeleteTarget,
      setViewTeacher: overlays.setViewTeacher,
      idCardTeachers: overlays.idCardTeachers,
      openIdCardsModal: overlays.openIdCardsModal,
      closeIdCardsModal: overlays.closeIdCardsModal,
    },
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
    selectedIds,
    clearSelection,
  });

  return {
    canWrite,
    canExport,
    visibleTabs,
    metricsTotal: metrics?.total,
    activeTab: effectiveTab,
    setActiveTab,
    viewingDeleted: showDeleted,
    shownCount,
    openCreateForm: formState.openCreate,
    handleExportCSV,
    tabPanelProps,
    pageOverlaysProps,
  };
}

export const useTeachersPageController = useFacultyPageController;


