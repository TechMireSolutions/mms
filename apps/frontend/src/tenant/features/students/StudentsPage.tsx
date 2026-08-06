import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatePresence } from "framer-motion";
import { UserPlus, GraduationCap } from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import StudentForm from "@/tenant/features/students/components/StudentForm";
import type { Student } from "@mms/shared";
import { StudentsCommandMetrics } from "@/tenant/features/students/components/StudentsCommandMetrics";
import { StudentsReportsTier } from "@/tenant/features/students/components/StudentsReportsTier";
import { StudentsSetupTier } from "@/tenant/features/students/components/StudentsSetupTier";
import { StudentsWorkTier } from "@/tenant/features/students/components/StudentsWorkTier";
import { useStudentsPageController } from "@/tenant/features/students/hooks/useStudentsPageController";

/**
 * Students Directory and Records Page.
 * Implements the standard 3-tier tab system (Work | Reports | Setup).
 */
export default function Students() {
  const { t } = useTranslation();
  const {
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
    showDeleted,
    toggleShowDeleted,
    columnLayout,
    studentSearch,
    setStudentSearch,
    studentFilterStatus,
    studentFilterGender,
    setStudentFilterGender,
    useServerWork,
    viewMode,
    setViewMode,
    workPageQuery,
    workStudents,
    shownCount,
    selectedIds,
    selectedTargets,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    handleSaveStudent,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
    toggleStudentStatus,
    setListPage,
    sortField,
    sortDir,
    handleServerSort,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    allSelected,
    someSelected,
    bulkActions,
  } = useStudentsPageController();

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
          <ActionButton variant="primary" icon={UserPlus} onClick={openCreateForm}>
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
              canExport={canExport}
              bulkActions={bulkActions}
              workStudents={workStudents}
              workPageData={workPageQuery.data}
              isWorkPageLoading={workPageQuery.isLoading}
              isWorkPageError={workPageQuery.isError}
              isWorkPageFetching={workPageQuery.isFetching}
              useServerWork={useServerWork}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              columnLayout={columnLayout}
              onSearchChange={setStudentSearch}
              onToggleStatus={toggleStudentStatus}
              onGenderChange={setStudentFilterGender}
              onToggleDeleted={toggleShowDeleted}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              selectedIds={selectedIds}
              selectedTargets={selectedTargets}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectOne={handleSelectOne}
              onSelectAll={handleSelectAll}
              onClearSelection={clearSelection}
              onRetry={() => void workPageQuery.refetch()}
              onPageChange={setListPage}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onBulkStatusChange={handleBulkStatusChange}
              sortField={sortField}
              sortDir={sortDir}
              onServerSort={handleServerSort}
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
            onClose={closeStudentForm}
            onSave={handleSaveStudent}
          />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
