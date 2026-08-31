import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import type { Teacher } from '@mms/shared';
import {
  resolveModuleTierTab,
  teacherColumnLabelKey,
  TEACHERS_MODULE_MANIFEST,
} from '@mms/shared';
import { useTeacherMutations, useTeachersMetrics } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTeachersContractList } from '@/tenant/features/teachers/hooks/useTeachersTsrHooks';
import { useTeachersDirectoryFilters } from '@/tenant/features/teachers/hooks/useTeachersDirectoryFilters';
import { useEmployeeIdMigration } from '@/tenant/features/teachers/hooks/useEmployeeIdMigration';
import { useTeachersKeyboardShortcuts } from '@/tenant/features/teachers/hooks/useTeachersKeyboardShortcuts';
import { useTeachersPageActions } from '@/tenant/features/teachers/hooks/useTeachersPageActions';
import { useTeachersPageFormState } from '@/tenant/features/teachers/hooks/useTeachersPageFormState';
import { useTeachersPageOverlayState } from '@/tenant/features/teachers/hooks/useTeachersPageOverlayState';
import { useTeachersPageOverlayProps } from '@/tenant/features/teachers/hooks/useTeachersPageOverlayProps';
import { useTeachersPageTabPanelProps } from '@/tenant/features/teachers/hooks/useTeachersPageTabPanelProps';
import { useTeacherColumnLayout } from '@/tenant/features/teachers/hooks/useTeacherColumnLayout';
import {
  buildTeachersDirectoryQuery,
} from '@/tenant/features/teachers/hooks/teachersQueryShared';
import { useTeacherLookupOptions } from '@/tenant/features/teachers/hooks/useTeacherStatusConfig';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import {
  defaultTeachersExportColumns,
  useTeachersExportActions,
} from '@/tenant/features/teachers/hooks/useTeachersExportActions';

export function useTeachersPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(TEACHERS_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const { data: metrics } = useTeachersMetrics();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const { settings, genderFilters } = useTeacherConfig();
  const { statusOptions, specializationOptions } = useTeacherLookupOptions();

  const columnLayout = useTeacherColumnLayout(settings);

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
  } = useTeachersDirectoryFilters({ setActiveTab });

  useEffect(() => {
    setListPage(1);
  }, [viewMode, setListPage]);

  const formState = useTeachersPageFormState();
  const overlays = useTeachersPageOverlayState();

  useTeachersKeyboardShortcuts({
    selectedCount: selectedIds.length,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate: formState.openCreate,
  });

  const mutations = useTeacherMutations();
  const pageActions = useTeachersPageActions({ editTeacher: formState.editTeacher });

  const exportColumns = (() => {
    const visible = columnLayout.columnRegistry.filter((col) =>
      columnLayout.isColumnVisible(col.key),
    );
    if (visible.length === 0) return defaultTeachersExportColumns(t);
    const columns = visible.map((col) => ({
      id: col.key,
      label: col.label || col.key,
    }));
    // CSV identity — not a Work directory column (shown under name).
    if (!columns.some((col) => col.id === 'employeeId')) {
      const nameIndex = columns.findIndex((col) => col.id === 'name');
      columns.splice(nameIndex >= 0 ? nameIndex + 1 : 0, 0, {
        id: 'employeeId',
        label: t(teacherColumnLabelKey('employeeId')),
      });
    }
    return columns;
  })();

  const { handleExportCSV, handleBulkExport } = useTeachersExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    filterStatus,
    filterSpecialization,
    filterGender,
    quickFilter,
    sortField,
    sortDir,
    viewingDeleted: showDeleted,
    selectedIds,
    logExportAudit: mutations.logExportAudit,
  });

  const useServerWork = effectiveTab === 'work';
  const workPageQuery = useTeachersContractList({
    page: listPage,
    limit: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    ...buildTeachersDirectoryQuery({
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

  const workTeachers = (() => (workPageQuery.data?.body?.teachers ?? []) as unknown as Teacher[])();
  const shownCount = workPageQuery.data?.body?.total ?? workTeachers.length;

  const isWorkError = workPageQuery.isError || (workPageQuery.data != null && workPageQuery.data.status !== 200);
  const workPageData = workPageQuery.data?.status === 200 ? workPageQuery.data.body : undefined;

  const tabPanelProps = useTeachersPageTabPanelProps(effectiveTab, {
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
    onSortChange: (field, dir) => {
      setSortField(field);
      setSortDir(dir);
    },
    setSearch,
    toggleStatus,
    setFilterSpecialization,
    setFilterGender,
    toggleViewingDeleted: () => setShowDeleted((previous) => !previous),
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

  const pageOverlaysProps = useTeachersPageOverlayProps({
    canWrite,
    canDelete,
    formState,
    overlays,
    workActions: {
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
