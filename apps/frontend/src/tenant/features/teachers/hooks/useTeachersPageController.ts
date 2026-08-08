import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import type { Teacher } from '@/lib/data/teachersData';
import { TEACHER_SPECIALIZATION_VALUES, TEACHER_STATUS_VALUES, TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { useTeacherCount } from '@/tenant/features/teachers/hooks/useTeacherCount';
import { useTeacherMutations, useTeachersPaginated } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTeachersDirectoryFilters } from '@/tenant/features/teachers/hooks/useTeachersDirectoryFilters';
import { useTeachersKeyboardShortcuts } from '@/tenant/features/teachers/hooks/useTeachersKeyboardShortcuts';
import { useTeachersPageActions } from '@/tenant/features/teachers/hooks/useTeachersPageActions';
import { useTeacherColumnLayout } from '@/tenant/features/teachers/hooks/useTeacherColumnLayout';
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
  } = useModulePermissions(TEACHERS_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const { data: serverCount } = useTeacherCount();
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
    setFilterStatus,
    filterSpecialization,
    setFilterSpecialization,
    toggleStatus,
    clearFilters,
    clearSelection,
    hasActiveFilters,
    selectionClearToken,
  } = useTeachersDirectoryFilters();
  const [showForm, setShowForm] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const { settings, statuses, specializations } = useTeacherConfig();

  const statusOptions = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const columnLayout = useTeacherColumnLayout(settings);

  const [activeTab, setActiveTab] = usePersistedTabState<string>('teachers_active_tab', 'work');
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  useTeachersKeyboardShortcuts({
    selectedCount,
    hasActiveFilters,
    clearFilters,
    clearSelection,
    canWrite,
    showDeleted,
    onCreate: () => {
      setEditTeacher(null);
      setShowForm(true);
    },
  });

  const pageActions = useTeachersPageActions({ editTeacher });
  const { logExportAudit } = useTeacherMutations();

  const exportColumns = useMemo(() => {
    const visible = columnLayout.columnRegistry.filter((col) =>
      columnLayout.isColumnVisible(col.key),
    );
    if (visible.length === 0) return defaultTeachersExportColumns(t);
    return visible.map((col) => ({
      id: col.key,
      label: col.label || col.key,
    }));
  }, [columnLayout, t]);

  const { handleExportCSV } = useTeachersExportActions({
    tableColumns: exportColumns,
    canExport,
    search,
    filterStatus,
    filterSpecialization,
    sortField,
    sortDir,
    viewingDeleted: showDeleted,
    selectedIds: [],
    logExportAudit,
  });

  const useServerWork = activeTab === 'work';
  const workPageQuery = useTeachersPaginated({
    page: listPage,
    limit: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    search: debouncedSearch,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    sortField,
    sortDir,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  const workTeachers = useMemo(
    () => (workPageQuery.data?.teachers ?? []) as unknown as Teacher[],
    [workPageQuery.data],
  );
  const shownCount = workPageQuery.data?.total ?? workTeachers.length;

  return {
    canWrite,
    canDelete,
    canExport,
    visibleTabs,
    serverCount,
    showForm,
    setShowForm,
    showDeleted,
    sortField,
    sortDir,
    statusOptions,
    specializationOptions,
    columnLayout,
    activeTab,
    setActiveTab,
    search,
    filterStatus,
    filterSpecialization,
    editTeacher,
    setEditTeacher,
    pageActions,
    useServerWork,
    workPageQuery,
    workTeachers,
    shownCount,
    listPage,
    toggleStatus,
    setSearch,
    setFilterStatus,
    setFilterSpecialization,
    setShowDeleted,
    setSortField,
    setSortDir,
    setListPage,
    viewMode,
    setViewMode,
    exportColumns,
    logExportAudit,
    handleExportCSV,
    clearFilters,
    selectionClearToken,
    setSelectedCount,
  };
}
