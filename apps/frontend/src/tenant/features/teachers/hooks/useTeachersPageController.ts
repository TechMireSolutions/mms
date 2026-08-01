import { useEffect, useMemo, useState } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import type { TeacherSortField } from '@/tenant/features/teachers/components/TeacherList';
import type { Teacher } from '@/lib/data/teachersData';
import { TEACHER_SPECIALIZATION_VALUES, TEACHER_STATUS_VALUES, TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { useTeacherCount } from '@/tenant/features/teachers/hooks/useTeacherCount';
import { useTeachersPaginated } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTeachersPageActions } from '@/tenant/features/teachers/hooks/useTeachersPageActions';
import { useTeacherColumnLayout } from '@/tenant/features/teachers/hooks/useTeacherColumnLayout';
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';

export function useTeachersPageController() {
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(TEACHERS_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });

  const { data: serverCount } = useTeacherCount();
  const [listPage, setListPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortField, setSortField] = useState<TeacherSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const { settings, statuses, specializations } = useTeacherConfig();

  const statusOptions = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const columnLayout = useTeacherColumnLayout(settings);

  const [activeTab, setActiveTab] = usePersistedTabState<string>('teachers_active_tab', 'work');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setEditTeacher(null);
      setShowForm(true);
    },
  });

  const pageActions = useTeachersPageActions({ editTeacher });

  const useServerWork = activeTab === 'work';
  const workPageQuery = useTeachersPaginated({
    page: listPage,
    limit: TEACHERS_MODULE_MANIFEST.defaultPageSize,
    search,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    sortField,
    sortDir,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
  }, [search, filterStatus, filterSpecialization, showDeleted, sortField, sortDir]);

  const workTeachers = useMemo(
    () => (workPageQuery.data?.teachers ?? []) as unknown as Teacher[],
    [workPageQuery.data],
  );
  const shownCount = workPageQuery.data?.total ?? workTeachers.length;

  const toggleStatus = (status: string) =>
    setFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  return {
    canWrite,
    canDelete,
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
  };
}
