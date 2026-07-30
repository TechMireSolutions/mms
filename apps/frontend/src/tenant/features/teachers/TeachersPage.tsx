import React, { useMemo, useState, useEffect } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useModuleCreateHotkey } from '@/hooks/useModuleCreateHotkey';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { AnimatePresence } from 'framer-motion';
import { UserPlus, School } from 'lucide-react';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from '@/components/ui/ActionButton';
import type { TeacherSortField } from "@/tenant/features/teachers/components/TeacherList";
import { TeachersModalLayer } from "@/tenant/features/teachers/components/TeachersModalLayer";
import { TeachersReportsTier } from "@/tenant/features/teachers/components/TeachersReportsTier";
import { TeachersSetupTier } from "@/tenant/features/teachers/components/TeachersSetupTier";
import { TeachersWorkTier } from "@/tenant/features/teachers/components/TeachersWorkTier";
import type { Teacher } from '@/lib/data/teachersData';
import { TEACHER_SPECIALIZATION_VALUES, TEACHER_STATUS_VALUES, TEACHERS_MODULE_MANIFEST } from '@mms/shared';
import { useTeacherCount } from '@/tenant/features/teachers/hooks/useTeacherCount';
import { useTeachersPaginated } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTeachersPageActions } from "@/tenant/features/teachers/hooks/useTeachersPageActions";
import { useTeacherColumnLayout } from '@/tenant/features/teachers/hooks/useTeacherColumnLayout';
import { TeachersCommandMetrics } from "@/tenant/features/teachers/components/TeachersCommandMetrics";
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';

/**
 * Teachers — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function Teachers(): React.JSX.Element {
  const { t } = useTranslation();
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

  const { settings, statuses, specializations } = useTeacherConfig();

  const statusOptions = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const {
    columnRegistry,
    isColumnVisible,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    customizerLabels,
  } = useTeacherColumnLayout(settings);

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
  } = useTeachersPageActions({ editTeacher });

  const useServerWork = activeTab === 'work';
  const {
    data: workPageData,
    isFetching: isWorkPageFetching,
    isLoading: isWorkPageLoading,
    isError: isWorkPageError,
    refetch: refetchWorkPage,
  } = useTeachersPaginated({
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
    () => (workPageData?.teachers ?? []) as unknown as Teacher[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? workTeachers.length;

  const filteredTeachers = workTeachers;

  const toggleStatus = (status: string) =>
    setFilterStatus((selectedStatuses) =>
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status)
        : [...selectedStatuses, status],
    );

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
        canWrite && !showDeleted ? (
          <ActionButton
            variant="primary"
            icon={UserPlus}
            onClick={() => { setEditTeacher(null); setShowForm(true); }}
          >
            {t('action.addTeacher')}
          </ActionButton>
        ) : undefined
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
              columnRegistry={columnRegistry}
              updateUserColumnLayout={updateUserColumnLayout}
              customizerLabels={customizerLabels}
              teachers={filteredTeachers}
              workPageData={workPageData}
              isWorkPageLoading={isWorkPageLoading}
              isWorkPageError={isWorkPageError}
              isWorkPageFetching={isWorkPageFetching}
              useServerWork={useServerWork}
              selectionResetKey={`${listPage}:${search}:${filterStatus.join(',')}:${filterSpecialization}:${sortField}:${sortDir}`}
              sortField={sortField}
              sortDir={sortDir}
              isColumnVisible={isColumnVisible}
              getColumnWidth={getColumnWidth}
              onColumnResize={setColumnWidth}
              onSearchChange={setSearch}
              onToggleStatus={toggleStatus}
              onSpecializationChange={setFilterSpecialization}
              onToggleDeleted={() => setShowDeleted((previous) => !previous)}
              onClearFilters={() => {
                setFilterStatus([]);
                setFilterSpecialization('');
              }}
              onRetry={refetchWorkPage}
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
