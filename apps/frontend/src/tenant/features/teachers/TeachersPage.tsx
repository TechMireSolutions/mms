import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { AnimatePresence } from 'framer-motion';
import { Download, UserPlus, School } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { ActionButton } from '@/components/ui/ActionButton';
import { TeachersModalLayer } from '@/tenant/features/teachers/components/TeachersModalLayer';
import { TeachersReportsTier } from '@/tenant/features/teachers/components/TeachersReportsTier';
import { TeachersSetupTier } from '@/tenant/features/teachers/components/TeachersSetupTier';
import { TeachersWorkTier } from '@/tenant/features/teachers/components/TeachersWorkTier';
import { TeachersCommandMetrics } from '@/tenant/features/teachers/components/TeachersCommandMetrics';
import { useTeachersPageController } from '@/tenant/features/teachers/hooks/useTeachersPageController';

/**
 * Teachers — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function Teachers(): React.JSX.Element {
  const { t } = useTranslation();
  const {
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
    selectedIds,
    clearSelection,
    handleSelectOne,
    handleSelectAll,
    editTeacher,
    setEditTeacher,
    pageActions,
    openComposer,
    canWriteMessaging,
    useServerWork,
    workPageQuery,
    workTeachers,
    shownCount,
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
    handleExportCSV,
    handleBulkExport,
    clearFilters,
    hasActiveFilters,
  } = useTeachersPageController();

  const {
    columnRegistry,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    customizerLabels,
    resetColumnLayout,
  } = columnLayout;

  const {
    messagingTarget,
    closeComposer,
    handleWhatsApp,
    handleSms,
    handleEmail,
    handleSaveTeacher,
    handleDelete,
    handleRestore,
    handleBulkDelete,
    handleBulkRestore,
    handleBulkStatusChange,
  } = pageActions;

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.teachers')}`}
      seoDescription={t('page.teachers.subtitle')}
      headerIcon={School}
      headerTitle={t('nav.teachers')}
      headerSubtitle={
        serverCount != null
          ? `${t('page.teachers.subtitle')} · ${serverCount} ${t('nav.teachers').toLowerCase()}`
          : t('page.teachers.subtitle')
      }
      headerActions={
        <>
          {canExport && !showDeleted ? (
            <ActionButton variant="ghost" icon={Download} onClick={() => void handleExportCSV()}>
              {t('common.export')}
            </ActionButton>
          ) : null}
          {canWrite && !showDeleted ? (
            <ActionButton
              variant="primary"
              icon={UserPlus}
              onClick={() => { setEditTeacher(null); setShowForm(true); }}
            >
              {t('action.addTeacher')}
            </ActionButton>
          ) : null}
        </>
      }
      metricsStrip={
        <TeachersCommandMetrics total={serverCount ?? shownCount} shown={shownCount} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="teachers-tab"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'work' ? (
            <TeachersWorkTier
              search={search}
              filterStatus={filterStatus}
              filterSpecialization={filterSpecialization}
              statusOptions={statusOptions}
              specializationOptions={specializationOptions}
              showDeleted={showDeleted}
              canWrite={canWrite}
              canDelete={canDelete}
              canExport={canExport}
              hasActiveFilters={hasActiveFilters}
              columnRegistry={columnRegistry}
              updateUserColumnLayout={updateUserColumnLayout}
              onResetLayout={resetColumnLayout}
              customizerLabels={customizerLabels}
              teachers={workTeachers}
              workPageData={workPageQuery.data}
              isWorkPageLoading={workPageQuery.isLoading}
              isWorkPageError={workPageQuery.isError}
              isWorkPageFetching={workPageQuery.isFetching}
              useServerWork={useServerWork}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedIds={selectedIds}
              onSelectOne={handleSelectOne}
              onSelectAll={handleSelectAll}
              onClearSelection={clearSelection}
              onBulkExport={handleBulkExport}
              sortField={sortField}
              sortDir={sortDir}
              isColumnVisible={isColumnVisible}
              getColumnWidth={getColumnWidth}
              onColumnResize={setColumnWidth}
              onSearchChange={setSearch}
              onToggleStatus={toggleStatus}
              onSpecializationChange={setFilterSpecialization}
              onToggleDeleted={() => setShowDeleted((previous) => !previous)}
              onClearFilters={clearFilters}
              onRetry={workPageQuery.refetch}
              onEdit={(teacher) => { setEditTeacher(teacher); setShowForm(true); }}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onBulkDelete={handleBulkDelete}
              onBulkRestore={handleBulkRestore}
              onBulkStatusChange={showDeleted ? undefined : handleBulkStatusChange}
              onWhatsApp={showDeleted ? undefined : handleWhatsApp}
              onSms={showDeleted ? undefined : handleSms}
              onEmail={showDeleted ? undefined : handleEmail}
              onSortChange={(field, dir) => {
                setSortField(field);
                setSortDir(dir);
              }}
              onPageChange={setListPage}
              openComposer={openComposer}
              canWriteMessaging={canWriteMessaging}
            />
          ) : activeTab === 'reports' ? (
            <TeachersReportsTier />
          ) : activeTab === 'setup' ? (
            <TeachersSetupTier />
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <TeachersModalLayer
        showForm={showForm}
        canWrite={canWrite}
        editTeacher={editTeacher}
        messagingTarget={messagingTarget}
        onCloseForm={() => { setShowForm(false); setEditTeacher(null); }}
        onSaveTeacher={handleSaveTeacher}
        onCloseComposer={closeComposer}
      />
    </ModulePageShell>
  );
}
