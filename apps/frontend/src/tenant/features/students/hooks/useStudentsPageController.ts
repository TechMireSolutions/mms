import { useEffect, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import {
  STUDENTS_MODULE_MANIFEST,
  resolveModuleTierTab,
  resolveStudentStatuses,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsMetrics } from "@/tenant/features/students/hooks/useStudentsAnalyticsQueries";
import { useStudentMutations } from "@/tenant/features/students/hooks/useStudents";
import { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useGrMigration } from "@/tenant/features/students/hooks/useGrMigration";
import { useStudentsDirectoryFilters } from "@/tenant/features/students/hooks/useStudentsDirectoryFilters";
import { useStudentsKeyboardShortcuts } from "@/tenant/features/students/hooks/useStudentsKeyboardShortcuts";
import { useStudentsPageDirectoryProps } from "@/tenant/features/students/hooks/useStudentsPageDirectoryProps";
import { useStudentsPageFormState } from "@/tenant/features/students/hooks/useStudentsPageFormState";
import { useStudentsPageTabPanelProps } from "@/tenant/features/students/hooks/useStudentsPageTabPanelProps";
import { useStudentsPageWorkQuery } from "@/tenant/features/students/hooks/useStudentsPageWorkQuery";
import { useStudentsSelectionTargets } from "@/tenant/features/students/hooks/useStudentsSelectionTargets";
import { useStudentsCrudActions } from "@/tenant/features/students/hooks/useStudentsCrudActions";
import { useStudentsPageOverlayState } from "@/tenant/features/students/hooks/useStudentsPageOverlayState";
import { useStudentsPageOverlayProps } from "@/tenant/features/students/hooks/useStudentsPageOverlayProps";
import {
  defaultStudentsExportColumns,
  useStudentsExportActions,
} from "@/tenant/features/students/hooks/useStudentsExportActions";

export function useStudentsPageController() {
  const { t } = useTranslation();
  const {
    canWrite,
    canDelete,
    canExport,
    canReports: canViewReports,
    canViewSetup,
    canEditSetup,
  } = useModulePermissions(STUDENTS_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });
  const { data: metrics } = useStudentsMetrics();
  const mutations = useStudentMutations();
  const { settings, statuses: configuredStatuses, genderFilters, isFieldEnabled } = useStudentConfig();
  const studentStatusOptions = resolveStudentStatuses(configuredStatuses);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("students_active_tab", "work");
  const effectiveTab = resolveModuleTierTab(
    activeTab,
    visibleTabs.map((tab) => tab.id),
  );
  const formState = useStudentsPageFormState();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  useGrMigration(effectiveTab, canEditSetup);

  const columnLayout = useStudentColumnLayout(settings);
  const directory = useStudentsDirectoryFilters({ setActiveTab });
  const { setListPage } = directory;

  useEffect(() => {
    setListPage(1);
  }, [viewMode, setListPage]);

  useStudentsKeyboardShortcuts({
    selectedCount: directory.selectedIds.length,
    hasActiveFilters: directory.hasActiveFilters,
    clearFilters: directory.clearFilters,
    clearSelection: directory.clearSelection,
    canWrite,
    showDeleted: directory.viewingDeleted,
    onCreate: formState.openCreateForm,
  });

  const useServerWork = effectiveTab === "work";
  const { workPageQuery, workStudents, shownCount } = useStudentsPageWorkQuery({
    enabled: useServerWork,
    listPage: directory.listPage,
    debouncedSearch: directory.debouncedSearch,
    studentFilterStatus: directory.studentFilterStatus,
    studentFilterGender: directory.studentFilterGender,
    quickFilter: directory.quickFilter,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    viewingDeleted: directory.viewingDeleted,
  });

  const { allSelected, someSelected } = useStudentsPageDirectoryProps({
    workStudents,
    selectedIds: directory.selectedIds,
  });

  const selectedTargets = useStudentsSelectionTargets({
    selectedIds: directory.selectedIds,
    workStudents,
  });

  const workActions = useStudentsCrudActions({
    editStudent: formState.editStudent,
    mutations,
  });

  const overlays = useStudentsPageOverlayState();

  const exportColumns = useMemo(() => {
    const visible = columnLayout.columnRegistry.filter(
      (col) => columnLayout.isColumnVisible(col.key) && col.key !== "sessions",
    );
    if (visible.length === 0) return defaultStudentsExportColumns(t);
    return visible.map((col) => ({
      id: col.key,
      label: col.label || col.key,
    }));
  }, [columnLayout, t]);

  const { handleExportCSV, handleBulkExport } = useStudentsExportActions({
    tableColumns: exportColumns,
    canExport,
    search: directory.studentSearch,
    filterStatus: directory.studentFilterStatus,
    filterGender: directory.studentFilterGender,
    quickFilter: directory.quickFilter,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    viewingDeleted: directory.viewingDeleted,
    selectedIds: directory.selectedIds,
    logExportAudit: mutations.logExportAudit,
  });

  const tabPanelProps = useStudentsPageTabPanelProps(effectiveTab, {
    studentSearch: directory.studentSearch,
    studentFilterStatus: directory.studentFilterStatus,
    studentFilterGender: directory.studentFilterGender,
    quickFilter: directory.quickFilter,
    changeQuickFilter: directory.changeQuickFilter,
    studentStatusOptions,
    genderFilters,
    viewingDeleted: directory.viewingDeleted,
    canWrite,
    canDelete,
    canExport,
    isStatusEnabled: isFieldEnabled("status"),
    isGenderEnabled: isFieldEnabled("gender"),
    bulkActions: STUDENTS_MODULE_MANIFEST.work.bulkActions,
    workStudents,
    workPageQuery,
    useServerWork,
    viewMode,
    setViewMode,
    columnLayout,
    setStudentSearch: directory.setStudentSearch,
    toggleStudentStatus: directory.toggleStudentStatus,
    setStudentFilterGender: directory.setStudentFilterGender,
    toggleViewingDeleted: directory.toggleViewingDeleted,
    clearFilters: directory.clearFilters,
    hasActiveFilters: directory.hasActiveFilters,
    activeFilterCount: directory.activeFilterCount,
    selectedIds: directory.selectedIds,
    selectedTargets,
    allSelected,
    someSelected,
    handleSelectOne: directory.handleSelectOne,
    handleSelectAll: directory.handleSelectAll,
    clearSelection: directory.clearSelection,
    setListPage: directory.setListPage,
    openEditForm: formState.openEditForm,
    handleRestore: workActions.handleRestore,
    handleBulkStatusChange: workActions.handleBulkStatusChange,
    handleBulkEnroll: async (payload) => {
      try {
        await workActions.handleBulkEnroll(directory.selectedIds, payload);
        directory.clearSelection();
      } catch {
        // Keep selection on error
      }
    },
    bulkEnrollPending: workActions.bulkEnrollPending,
    handleBulkPrintIdCards: () => {
      const selectedList = workStudents.filter((s) => directory.selectedIds.includes(String(s.id)));
      if (selectedList.length > 0) {
        overlays.openIdCards(selectedList);
      }
    },
    handleBulkExport,
    bulkStatusPending: mutations.bulkUpdateStudentStatus.isPending,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    handleServerSort: directory.handleServerSort,
    workOverlays: {
      statusBadgeConfig: overlays.statusBadgeConfig,
      openComposer: overlays.openComposer,
      openSelectionMessage: overlays.openSelectionMessage,
      canWriteMessaging: overlays.canWriteMessaging,
      setConfirmBulkDeleteOpen: overlays.setConfirmBulkDeleteOpen,
      setConfirmBulkRestoreOpen: overlays.setConfirmBulkRestoreOpen,
      setDeleteTarget: overlays.setDeleteTarget,
      setViewStudent: overlays.setViewStudent,
      openIdCards: overlays.openIdCards,
    },
  });

  const pageOverlaysProps = useStudentsPageOverlayProps({
    canWrite,
    canDelete,
    formState,
    overlays,
    workActions,
    selectedIds: directory.selectedIds,
    clearSelection: directory.clearSelection,
  });

  return {
    canWrite,
    canExport,
    visibleTabs,
    metricsTotal: metrics?.total,
    activeTab: effectiveTab,
    setActiveTab,
    viewingDeleted: directory.viewingDeleted,
    shownCount,
    openCreateForm: formState.openCreateForm,
    handleExportCSV,
    tabPanelProps,
    pageOverlaysProps,
  };
}
