import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AnimatePresence } from 'framer-motion';
import { UserPlus, GraduationCap } from 'lucide-react';
import { notify } from '@/lib/notify';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ActionButton } from '@/components/ui/ActionButton';
import StudentForm from '@/tenant/features/students/components/StudentForm';
import type { Student } from '@mms/shared';
import { StudentsCommandMetrics } from '@/tenant/features/students/components/StudentsCommandMetrics';
import { StudentsReportsTier } from '@/tenant/features/students/components/StudentsReportsTier';
import { StudentsSetupTier } from '@/tenant/features/students/components/StudentsSetupTier';
import { StudentsWorkTier } from '@/tenant/features/students/components/StudentsWorkTier';
import { useStudentsPageController } from '@/tenant/features/students/hooks/useStudentsPageController';

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Work | Reports | Setup).
 */
export default function Students() {
  const { t } = useTranslation();
  const {
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
    isListView,
    workLimit,
    workPageQuery,
    workStudents,
    shownCount,
    workTruncated,
    handleSaveStudent,
    toggleStudentStatus,
    setListPage,
  } = useStudentsPageController();

  const {
    deleteStudent,
    bulkDeleteStudents,
    restoreStudent,
    bulkRestoreStudents,
    bulkUpdateStudentStatus,
  } = mutations;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.students')}`}
      seoDescription={t('page.students.subtitle')}
      headerIcon={GraduationCap}
      headerTitle={t('nav.students')}
      headerSubtitle={
        serverCount != null
          ? `${t('page.students.subtitle')} · ${serverCount} ${t('nav.students').toLowerCase()}`
          : t('page.students.subtitle')
      }
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={() => { setEditStudent(null); setShowStudentForm(true); }}
          >
            {t('action.addStudent')}
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
          {activeTab === 'work' ? (
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
              workPageData={workPageQuery.data}
              isWorkPageLoading={workPageQuery.isLoading}
              isWorkPageError={workPageQuery.isError}
              isWorkPageFetching={workPageQuery.isFetching}
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
                setStudentFilterGender('');
              }}
              onRetry={() => void workPageQuery.refetch()}
              onPageChange={setListPage}
              onEdit={(studentToEdit) => { setEditStudent(studentToEdit); setShowStudentForm(true); }}
              onDelete={(studentId) => deleteStudent.mutate(String(studentId))}
              onRestore={(studentId) => {
                restoreStudent.mutate(String(studentId), {
                  onSuccess: () => notify.success(t('students.restoreSuccess')),
                });
              }}
              onBulkDelete={(studentIds) => bulkDeleteStudents.mutate(studentIds.map(String))}
              onBulkRestore={(studentIds) => {
                bulkRestoreStudents.mutate(studentIds.map(String), {
                  onSuccess: () => notify.success(t('students.restoreSuccess')),
                });
              }}
              onBulkStatusChange={(studentIds, status) => bulkUpdateStudentStatus.mutate({ ids: studentIds.map(String), status })}
            />
          ) : activeTab === 'reports' ? (
            <StudentsReportsTier />
          ) : activeTab === 'setup' ? (
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
