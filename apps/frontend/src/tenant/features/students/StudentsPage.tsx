import React, { useState, useMemo, useEffect } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useModuleCreateHotkey } from "@/hooks/useModuleCreateHotkey";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatePresence } from "framer-motion";
import { UserPlus, GraduationCap } from "lucide-react";
import { notify } from "@/lib/notify";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";

import StudentForm from "@/tenant/features/students/components/StudentForm";
import { type Student, STUDENTS_MODULE_MANIFEST, resolveStudentStatuses } from "@mms/shared";


import { useStudentCount } from "@/tenant/features/students/hooks/useStudentCount";
import { useStudentsPaginated, useStudentMutations, type StudentRecord } from "@/tenant/features/students/hooks/useStudents";
import { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { StudentsReportsTier } from "@/tenant/features/students/components/StudentsReportsTier";
import { StudentsSetupTier } from "@/tenant/features/students/components/StudentsSetupTier";
import { StudentsWorkTier } from "@/tenant/features/students/components/StudentsWorkTier";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useGrMigration } from "@/tenant/features/students/hooks/useGrMigration";

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Work | Reports | Setup).
 */
export default function Students() {
  const { t } = useTranslation();
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
  const {
    createStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    restoreStudent,
    bulkRestoreStudents,
    bulkUpdateStudentStatus,
  } = useStudentMutations();
  const { settings, statuses: configuredStatuses, genderFilters } = useStudentConfig();
  const studentStatusOptions = resolveStudentStatuses(configuredStatuses);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("students_active_tab", "work");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);

  useGrMigration(settings, updateStudent, activeTab, canWrite);

  const columnLayout = useStudentColumnLayout(settings);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterStatus, setStudentFilterStatus] = useState<string[]>([]);
  const [studentFilterGender, setStudentFilterGender] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  useModuleCreateHotkey({
    enabled: canWrite && !showDeleted,
    onCreate: () => {
      setEditStudent(null);
      setShowStudentForm(true);
    },
  });

  const useServerWork = activeTab === "work";
  const isListView = settings.defaultViewLayout === "list";
  const workLimit = isListView
    ? STUDENTS_MODULE_MANIFEST.defaultPageSize
    : STUDENTS_MODULE_MANIFEST.maxPageSize;

  const {
    data: workPageData,
    isFetching: isWorkPageFetching,
    isLoading: isWorkPageLoading,
    isError: isWorkPageError,
    refetch: refetchWorkPage,
  } = useStudentsPaginated({
    page: isListView ? listPage : 1,
    limit: workLimit,
    search: studentSearch,
    status: studentFilterStatus.length > 0 ? studentFilterStatus.join(",") : undefined,
    gender: studentFilterGender || undefined,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
  }, [studentSearch, studentFilterStatus, studentFilterGender, settings.defaultViewLayout, showDeleted]);

  const workStudents = useMemo(() => {
    const rows = (workPageData?.students ?? []) as Student[];
    return showDeleted ? rows.filter((row) => Boolean(row.deletedAt)) : rows;
  }, [workPageData, showDeleted]);
  const shownCount = showDeleted ? workStudents.length : (workPageData?.total ?? 0);
  const workTruncated = useServerWork && !isListView && Boolean(workPageData?.hasMore);

  const handleSaveStudent = async (studentToSave: Student) => {
    if (editStudent) {
      await updateStudent.mutateAsync({
        id: String(studentToSave.id),
        student: studentToSave as StudentRecord,
      });
    } else {
      await createStudent.mutateAsync(studentToSave as StudentRecord);
    }
  };

  const toggleStudentStatus = (status: string) =>
    setStudentFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.students")}`}
      seoDescription={t("page.students.subtitle")}
      headerIcon={GraduationCap}
      headerTitle={t("nav.students")}
      headerSubtitle={
        serverCount != null
          ? `${t("page.students.subtitle")} · ${serverCount} ${t("nav.students").toLowerCase()}`
          : t("page.students.subtitle")
      }
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={() => { setEditStudent(null); setShowStudentForm(true); }}
          >
            {t("action.addStudent")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <StudentsCommandMetrics total={serverCount ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="students-tab"
      >
      <AnimatePresence mode="wait">
        {activeTab === "work" ? (
          <StudentsWorkTier
            studentSearch={studentSearch}
            studentFilterStatus={studentFilterStatus}
            studentFilterGender={studentFilterGender}
            studentStatusOptions={studentStatusOptions}
            genderFilters={genderFilters}
            showDeleted={showDeleted}
            canWrite={canWrite}
            canDelete={canDelete}
            workStudents={workStudents}
            workPageData={workPageData}
            isWorkPageLoading={isWorkPageLoading}
            isWorkPageError={isWorkPageError}
            isWorkPageFetching={isWorkPageFetching}
            useServerWork={useServerWork}
            isListView={isListView}
            workLimit={workLimit}
            shownCount={shownCount}
            workTruncated={workTruncated}
            defaultViewLayout={settings.defaultViewLayout}
            columnLayout={columnLayout}
            onSearchChange={setStudentSearch}
            onToggleStatus={toggleStudentStatus}
            onGenderChange={setStudentFilterGender}
            onToggleDeleted={() => setShowDeleted((previous) => !previous)}
            onClearFilters={() => {
              setStudentFilterStatus([]);
              setStudentFilterGender("");
            }}
            onRetry={() => void refetchWorkPage()}
            onPageChange={setListPage}
            onEdit={(studentToEdit) => { setEditStudent(studentToEdit); setShowStudentForm(true); }}
            onDelete={(studentId) => deleteStudent.mutate(String(studentId))}
            onRestore={(studentId) => {
              restoreStudent.mutate(String(studentId), {
                onSuccess: () => notify.success(t("students.restoreSuccess")),
              });
            }}
            onBulkDelete={(studentIds) => bulkDeleteStudents.mutate(studentIds.map(String))}
            onBulkRestore={(studentIds) => {
              bulkRestoreStudents.mutate(studentIds.map(String), {
                onSuccess: () => notify.success(t("students.restoreSuccess")),
              });
            }}
            onBulkStatusChange={(studentIds, status) => bulkUpdateStudentStatus.mutate({ ids: studentIds.map(String), status })}
          />
        ) : activeTab === "reports" ? (
          <StudentsReportsTier />
        ) : activeTab === "setup" ? (
          <StudentsSetupTier />
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {showStudentForm && (
          <StudentForm
            student={editStudent as unknown as Partial<Student> | null}
            onClose={() => { setShowStudentForm(false); setEditStudent(null); }}
            onSave={handleSaveStudent}
          />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
