import React, { useMemo, useState, useEffect } from 'react';
import useModuleTierTabs from '@/hooks/useModuleTierTabs';
import useConfigSubTabs from '@/hooks/useConfigSubTabs';
import useTranslation from '@/hooks/useTranslation';
import usePermissions from '@/hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, School, Filter, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/ui/PageHeader';
import ResponsiveAccordionTabs from '@/components/ui/ResponsiveAccordionTabs';
import SubTabBar from '@/components/ui/SubTabBar';
import SearchBar from '@/components/ui/SearchBar';
import FilterChips from '@/components/ui/FilterChips';
import ActionButton from '@/components/ui/ActionButton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import TeacherList from '@/components/teachers/TeacherList';
import TeacherForm from '@/components/teachers/TeacherForm';
import TeachersSettingsPanel from '@/components/teachers/TeachersSettings';
import type { Teacher } from '@/lib/data/teachersData';
import { TEACHER_SPECIALIZATION_VALUES, TEACHER_STATUS_VALUES, DEFAULT_TEACHERS_SETTINGS, TEACHERS_MODULE_CONTRACT, type AppTranslationKey, type TeachersSettings } from '@mms/shared';
import ModuleReports from '@/components/reports/ModuleReports';
import KPISummary from '@/components/reports/KPISummary';
import useTeacherCount from '@/hooks/useTeacherCount';
import { useTeachersPaginated, useTeacherMutations, type TeacherRecord } from '@/hooks/useTeachers';
import { useTeacherColumnLayout } from '@/hooks/useTeacherColumnLayout';
import ModuleColumnCustomizer from '@/components/ui/ModuleColumnCustomizer';
import TeachersCommandMetrics from '@/components/teachers/TeachersCommandMetrics';
import TeachersListPagination from '@/components/teachers/TeachersListPagination';
import { getObject } from '@/lib/db';
import { notify } from '@/lib/notify';

const TEACHER_STATUS_OPTIONS = [...TEACHER_STATUS_VALUES] as const;

function teacherStatusLabel(t: (key: AppTranslationKey) => string, status: string): string {
  const key = `teachers.status.${status}` as AppTranslationKey;
  return t(key);
}

/**
 * Teachers — faculty roster and profiles. Standard 3-tier layout (Work | Reports | Setup).
 */
export default function Teachers(): React.JSX.Element {
  const PAGE_TABS = useModuleTierTabs();
  const configSubTabs = useConfigSubTabs();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canWrite = can('teachers.write');
  const { data: serverCount } = useTeacherCount();
  const { createTeacher, updateTeacher, deleteTeacher } = useTeacherMutations();
  const [listPage, setListPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const settings = useMemo(
    () => getObject<TeachersSettings>('teachers_settings', DEFAULT_TEACHERS_SETTINGS),
    [],
  );
  const {
    columnRegistry,
    isColumnVisible,
    updateUserColumnLayout,
    customizerLabels,
  } = useTeacherColumnLayout(settings);

  const [activeTab, setActiveTab] = useState('work');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [subTab, setSubTab] = useState('fields');

  const useServerWork = activeTab === 'work';
  const { data: workPageData, isFetching: isWorkPageFetching, isLoading: isWorkPageLoading } = useTeachersPaginated({
    page: listPage,
    limit: TEACHERS_MODULE_CONTRACT.defaultPageSize,
    search,
    status: filterStatus.length > 0 ? filterStatus.join(',') : undefined,
    specialization: filterSpecialization || undefined,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
  }, [search, filterStatus, filterSpecialization]);

  const workTeachers = useMemo(
    () => (workPageData?.teachers ?? []) as unknown as Teacher[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? 0;

  const filteredTeachers = workTeachers;

  const toggleStatus = (s: string) =>
    setFilterStatus((st) => (st.includes(s) ? st.filter((x) => x !== s) : [...st, s]));

  const filterChips = [
    ...filterStatus.map((s) => ({
      key: s,
      label: teacherStatusLabel(t, s),
      onRemove: () => toggleStatus(s),
    })),
    ...(filterSpecialization
      ? [{
          key: 'specialization',
          label: filterSpecialization,
          onRemove: () => setFilterSpecialization(''),
        }]
      : []),
  ];

  const handleSaveTeacher = (data: Teacher) => {
    if (editTeacher) {
      updateTeacher.mutate(
        { id: String(data.id), teacher: data as unknown as TeacherRecord },
        {
          onSuccess: () => {
            notify.success(t('teachers.toast.updated'));
            setShowForm(false);
            setEditTeacher(null);
          },
        },
      );
    } else {
      createTeacher.mutate(data as unknown as TeacherRecord, {
        onSuccess: () => {
          notify.success(t('teachers.toast.created'));
          setShowForm(false);
          setEditTeacher(null);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteTeacher.mutate(id, {
      onSuccess: () => notify.info(t('teachers.toast.deleted')),
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <title>MMS - Teachers</title>
      <meta name="description" content={t('page.teachers.subtitle')} />

      <PageHeader
        icon={School}
        title={t('nav.teachers')}
        subtitle={
          serverCount != null
            ? `${t('page.teachers.subtitle')} · ${serverCount} ${t('nav.teachers').toLowerCase()}`
            : t('page.teachers.subtitle')
        }
        actions={
          canWrite ? (
            <ActionButton
              variant="primary"
              icon={UserPlus}
              onClick={() => { setEditTeacher(null); setShowForm(true); }}
            >
              {t('action.addTeacher')}
            </ActionButton>
          ) : undefined
        }
      />

      <TeachersCommandMetrics total={serverCount ?? shownCount} shown={shownCount} />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="teachers-tab"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'work' ? (
            <motion.div
              key="work"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder={t('teachers.searchPlaceholder')}
                  className="flex-1"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        filterStatus.length > 0
                          ? 'border-primary/30 bg-primary/5 text-primary'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {t('teachers.filter.status')}
                      {filterStatus.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {filterStatus.length}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs">{t('teachers.filter.status')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {TEACHER_STATUS_OPTIONS.map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s}
                        checked={filterStatus.includes(s)}
                        onCheckedChange={() => toggleStatus(s)}
                      >
                        {teacherStatusLabel(t, s)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                        filterSpecialization
                          ? 'border-primary/30 bg-primary/5 text-primary'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {filterSpecialization || t('teachers.filter.specialization')}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuCheckboxItem
                      checked={!filterSpecialization}
                      onCheckedChange={() => setFilterSpecialization('')}
                    >
                      {t('teachers.filter.allSpecializations')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {TEACHER_SPECIALIZATION_VALUES.map((spec) => (
                      <DropdownMenuCheckboxItem
                        key={spec}
                        checked={filterSpecialization === spec}
                        onCheckedChange={() => setFilterSpecialization(spec)}
                      >
                        {spec}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ModuleColumnCustomizer
                  columnRegistry={columnRegistry}
                  updateUserColumnLayout={updateUserColumnLayout}
                  labels={customizerLabels}
                />
              </div>

              <FilterChips
                chips={filterChips}
                onClearAll={() => {
                  setFilterStatus([]);
                  setFilterSpecialization('');
                }}
              />

              <ErrorBoundary>
                {isWorkPageLoading ? (
                  <p className="text-sm text-muted-foreground px-1">{t('teachers.loading')}</p>
                ) : (
                  <>
                    <TeacherList
                      teachers={filteredTeachers}
                      onEdit={(teacher) => { setEditTeacher(teacher); setShowForm(true); }}
                      onDelete={handleDelete}
                      canWrite={canWrite}
                      isColumnVisible={isColumnVisible}
                    />
                    {useServerWork && workPageData && (
                      <TeachersListPagination
                        page={workPageData.page}
                        total={workPageData.total}
                        limit={workPageData.limit}
                        hasMore={workPageData.hasMore}
                        onPageChange={setListPage}
                      />
                    )}
                    {useServerWork && isWorkPageFetching && (
                      <p className="text-xs text-muted-foreground px-1">{t('common.loading')}</p>
                    )}
                  </>
                )}
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ErrorBoundary>
                <div className="space-y-4">
                  <KPISummary category="teachers" />
                  <ModuleReports category="teachers" />
                </div>
              </ErrorBoundary>
            </motion.div>
          ) : activeTab === 'setup' ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ErrorBoundary>
                <div className="space-y-4">
                  <SubTabBar
                    tabs={configSubTabs.map((tab) => ({ key: tab.id, label: tab.label }))}
                    value={subTab}
                    onChange={setSubTab}
                  />
                  {subTab === 'fields' && <TeachersSettingsPanel mode="fields" />}
                  {subTab === 'preferences' && <TeachersSettingsPanel mode="preferences" />}
                </div>
              </ErrorBoundary>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        {showForm && canWrite && (
          <TeacherForm
            teacher={editTeacher ?? undefined}
            onClose={() => { setShowForm(false); setEditTeacher(null); }}
            onSave={handleSaveTeacher}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
