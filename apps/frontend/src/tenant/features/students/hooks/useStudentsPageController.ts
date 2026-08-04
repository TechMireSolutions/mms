import { useEffect, useMemo, useState } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { type Student, STUDENTS_MODULE_MANIFEST, resolveStudentStatuses } from '@mms/shared';
import { useStudentCount } from '@/tenant/features/students/hooks/useStudentCount';
import { useStudentsPaginated, useStudentMutations, type StudentRecord } from '@/tenant/features/students/hooks/useStudents';
import { useStudentColumnLayout } from '@/tenant/features/students/hooks/useStudentColumnLayout';
import { useStudentConfig } from '@/hooks/useStandardModuleConfig';
import { useGrMigration } from '@/tenant/features/students/hooks/useGrMigration';
import type { StudentListSortField } from '@/tenant/features/students/components/StudentListContentTypes';

const SORT_FIELD_TO_API: Record<StudentListSortField, string> = {
  name: 'name',
  age: 'dob',
  fatherName: 'fatherName',
  status: 'status',
  grNumber: 'grNumber',
};

export function useStudentsPageController() {
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(STUDENTS_MODULE_MANIFEST);

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup,
    canViewReports,
  });
  const { data: serverCount } = useStudentCount();
  const mutations = useStudentMutations();
  const { settings, statuses: configuredStatuses, genderFilters } = useStudentConfig();
  const studentStatusOptions = resolveStudentStatuses(configuredStatuses);
  const [activeTab, setActiveTab] = usePersistedTabState<string>('students_active_tab', 'work');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [sortField, setSortField] = useState<StudentListSortField | null>('grNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useGrMigration(activeTab, canWrite);

  const columnLayout = useStudentColumnLayout(settings);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setEditStudent(null);
      setShowStudentForm(true);
    },
  });

  const useServerWork = activeTab === 'work';
  const workLimit = STUDENTS_MODULE_MANIFEST.defaultPageSize;

  const workPageQuery = useStudentsPaginated({
    page: listPage,
    limit: workLimit,
    search: studentSearch,
    status: studentFilterStatus.length > 0 ? studentFilterStatus.join(',') : undefined,
    gender: studentFilterGender || undefined,
    sortField: sortField ? SORT_FIELD_TO_API[sortField] : undefined,
    sortDir: sortField ? sortDir : undefined,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
  }, [studentSearch, studentFilterStatus, studentFilterGender, viewMode, showDeleted, sortField, sortDir]);

  const handleServerSort = (field: StudentListSortField) => {
    if (sortField === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const workStudents = useMemo(
    () => (workPageQuery.data?.students ?? []) as Student[],
    [workPageQuery.data],
  );
  const shownCount = workPageQuery.data?.total ?? 0;

  const handleSaveStudent = async (studentToSave: Student) => {
    if (editStudent) {
      await mutations.updateStudent.mutateAsync({
        id: String(studentToSave.id),
        student: studentToSave as StudentRecord,
      });
    } else {
      await mutations.createStudent.mutateAsync(studentToSave as StudentRecord);
    }
  };

  const toggleStudentStatus = (status: string) =>
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  return {
    canWrite,
    canDelete,
    visibleTabs,
    serverCount,
    mutations,
    settings,
    studentStatusOptions,
    genderFilters,
    activeTab,
    setActiveTab,
    showStudentForm,
    setShowStudentForm,
    showDeleted,
    setShowDeleted,
    columnLayout,
    studentSearch,
    setStudentSearch,
    studentFilterStatus,
    setStudentFilterStatus,
    studentFilterGender,
    setStudentFilterGender,
    editStudent,
    setEditStudent,
    useServerWork,
    viewMode,
    setViewMode,
    workPageQuery,
    workStudents,
    shownCount,
    handleSaveStudent,
    toggleStudentStatus,
    setListPage,
    sortField,
    sortDir,
    handleServerSort,
  };
}
