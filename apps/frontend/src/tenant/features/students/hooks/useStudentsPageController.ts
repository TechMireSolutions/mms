import { useEffect, useMemo, useState } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { type Student, STUDENTS_MODULE_MANIFEST, resolveStudentStatuses } from "@mms/shared";
import { useStudentCount } from "@/tenant/features/students/hooks/useStudentCount";
import { useStudentsPaginated, useStudentMutations } from "@/tenant/features/students/hooks/useStudents";
import { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useGrMigration } from "@/tenant/features/students/hooks/useGrMigration";
import { useStudentsDirectoryFilters } from "@/tenant/features/students/hooks/useStudentsDirectoryFilters";
import { useStudentsKeyboardShortcuts } from "@/tenant/features/students/hooks/useStudentsKeyboardShortcuts";
import { useStudentsPageDirectoryProps } from "@/tenant/features/students/hooks/useStudentsPageDirectoryProps";
import { useStudentsSelectionTargets } from "@/tenant/features/students/hooks/useStudentsSelectionTargets";
import { useStudentsWorkActions } from "@/tenant/features/students/hooks/useStudentsWorkActions";
import type { StudentListSortField } from "@/tenant/features/students/components/StudentListContentTypes";

const SORT_FIELD_TO_API: Record<StudentListSortField, string> = {
  name: "name",
  age: "dob",
  fatherName: "fatherName",
  status: "status",
  grNumber: "grNumber",
};

export function useStudentsPageController() {
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
  const { data: serverCount } = useStudentCount();
  const mutations = useStudentMutations();
  const { settings, statuses: configuredStatuses, genderFilters } = useStudentConfig();
  const studentStatusOptions = resolveStudentStatuses(configuredStatuses);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("students_active_tab", "work");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  useGrMigration(activeTab, canEditSetup);

  const columnLayout = useStudentColumnLayout(settings);
  const directory = useStudentsDirectoryFilters();
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
    showDeleted: directory.showDeleted,
    onCreate: () => {
      setEditStudent(null);
      setShowStudentForm(true);
    },
  });

  const useServerWork = activeTab === "work";
  const workLimit = STUDENTS_MODULE_MANIFEST.defaultPageSize;

  const workPageQuery = useStudentsPaginated({
    page: directory.listPage,
    limit: workLimit,
    search: directory.debouncedSearch,
    status:
      directory.studentFilterStatus.length > 0
        ? directory.studentFilterStatus.join(",")
        : undefined,
    gender: directory.studentFilterGender || undefined,
    sortField: directory.sortField ? SORT_FIELD_TO_API[directory.sortField] : undefined,
    sortDir: directory.sortField ? directory.sortDir : undefined,
    includeDeleted: directory.showDeleted,
    enabled: useServerWork,
  });

  const workStudents = useMemo(
    () => (workPageQuery.data?.students ?? []) as Student[],
    [workPageQuery.data],
  );
  const shownCount = workPageQuery.data?.total ?? 0;

  const { allSelected, someSelected } = useStudentsPageDirectoryProps({
    workStudents,
    selectedIds: directory.selectedIds,
  });

  const selectedTargets = useStudentsSelectionTargets({
    selectedIds: directory.selectedIds,
    workStudents,
  });

  const workActions = useStudentsWorkActions({ editStudent, mutations });

  const openCreateForm = () => {
    setEditStudent(null);
    setShowStudentForm(true);
  };

  const openEditForm = (studentToEdit: Student) => {
    setEditStudent(studentToEdit);
    setShowStudentForm(true);
  };

  const closeStudentForm = () => {
    setShowStudentForm(false);
    setEditStudent(null);
  };

  return {
    canWrite,
    canDelete,
    canExport,
    visibleTabs,
    serverCount,
    studentStatusOptions,
    genderFilters,
    activeTab,
    setActiveTab,
    showStudentForm,
    editStudent,
    openCreateForm,
    openEditForm,
    closeStudentForm,
    showDeleted: directory.showDeleted,
    toggleShowDeleted: directory.toggleShowDeleted,
    columnLayout,
    studentSearch: directory.studentSearch,
    setStudentSearch: directory.setStudentSearch,
    studentFilterStatus: directory.studentFilterStatus,
    studentFilterGender: directory.studentFilterGender,
    setStudentFilterGender: directory.setStudentFilterGender,
    useServerWork,
    viewMode,
    setViewMode,
    workPageQuery,
    workStudents,
    shownCount,
    selectedIds: directory.selectedIds,
    selectedTargets,
    allSelected,
    someSelected,
    handleSelectOne: directory.handleSelectOne,
    handleSelectAll: directory.handleSelectAll,
    clearSelection: directory.clearSelection,
    handleSaveStudent: workActions.handleSaveStudent,
    handleDelete: workActions.handleDelete,
    handleRestore: workActions.handleRestore,
    handleBulkDelete: workActions.handleBulkDelete,
    handleBulkRestore: workActions.handleBulkRestore,
    handleBulkStatusChange: workActions.handleBulkStatusChange,
    toggleStudentStatus: directory.toggleStudentStatus,
    setListPage: directory.setListPage,
    sortField: directory.sortField,
    sortDir: directory.sortDir,
    handleServerSort: directory.handleServerSort,
    clearFilters: directory.clearFilters,
    hasActiveFilters: directory.hasActiveFilters,
    activeFilterCount: directory.activeFilterCount,
    bulkActions: STUDENTS_MODULE_MANIFEST.work.bulkActions,
  };
}
