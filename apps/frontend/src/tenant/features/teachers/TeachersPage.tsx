import React, { useMemo, useState, useEffect } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, School, Filter, ChevronDown, Archive } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChips } from '@/components/ui/FilterChips';
import { ActionButton } from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TeacherList, type TeacherSortField } from "@/tenant/features/teachers/components/TeacherList";
import { TeacherForm } from "@/tenant/features/teachers/components/TeacherForm";
import { TeachersSettings as TeachersSettingsPanel } from "@/tenant/features/teachers/components/TeachersSettings";
import type { Teacher } from '@/lib/data/teachersData';
import { TEACHER_SPECIALIZATION_VALUES, TEACHER_STATUS_VALUES, TEACHERS_MODULE_MANIFEST, type AppTranslationKey, toTitleCase } from '@mms/shared';
import ModuleReports from '@/tenant/features/reports/components/ModuleReports';
import KPISummary from '@/tenant/features/reports/components/KPISummary';
import { useTeacherCount } from '@/tenant/features/teachers/hooks/useTeacherCount';
import { useTeachersPaginated, useTeacherMutations, type TeacherRecord } from '@/tenant/features/teachers/hooks/useTeachers';
import { useTeacherColumnLayout } from '@/tenant/features/teachers/hooks/useTeacherColumnLayout';
import { ModuleColumnCustomizer } from '@/components/ui/ModuleColumnCustomizer';
import { TeachersCommandMetrics } from "@/tenant/features/teachers/components/TeachersCommandMetrics";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { useTeacherConfig } from '@/hooks/useStandardModuleConfig';
import { notify } from '@/lib/notify';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

function teacherStatusLabel(t: (key: AppTranslationKey) => string, status: string): string {
  const key = `teachers.status.${status}` as AppTranslationKey;
  const translatedStatus = t(key);
  return translatedStatus === key ? toTitleCase(status) : translatedStatus;
}

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
  const {
    createTeacher,
    updateTeacher,
    deleteTeacher,
    bulkDeleteTeachers,
    restoreTeacher,
    bulkRestoreTeachers,
    bulkUpdateTeacherStatus,
  } = useTeacherMutations();
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        if (canWrite && !showDeleted) {
          event.preventDefault();
          setEditTeacher(null);
          setShowForm(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canWrite, showDeleted]);

  const { messagingTarget, openComposer, closeComposer, canWriteMessaging } = useMessageComposerState();

  const toTeacherRecipients = (teachersList: Teacher[]) =>
    teachersList.map((tr) => ({
      id: tr.id,
      name: tr.name || '',
      phone: tr.phone || '',
      email: tr.email || '',
    }));

  const handleWhatsApp = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer('whatsapp', toTeacherRecipients(teachersList));
  };

  const handleSms = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer('sms', toTeacherRecipients(teachersList));
  };

  const handleEmail = (teachersList: Teacher[]) => {
    if (!canWriteMessaging) return;
    openComposer('email', toTeacherRecipients(teachersList));
  };

  const useServerWork = activeTab === 'work';
  const { data: workPageData, isFetching: isWorkPageFetching, isLoading: isWorkPageLoading } = useTeachersPaginated({
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

  const filterChips = [
    ...filterStatus.map((status) => ({
      key: status,
      label: teacherStatusLabel(t, status),
      onRemove: () => toggleStatus(status),
    })),
    ...(filterSpecialization
      ? [{
          key: 'specialization',
          label: filterSpecialization,
          onRemove: () => setFilterSpecialization(''),
        }]
      : []),
  ];

  const handleSaveTeacher = async (teacherToSave: Teacher) => {
    if (editTeacher) {
      await updateTeacher.mutateAsync({
        id: String(teacherToSave.id),
        teacher: teacherToSave as unknown as TeacherRecord,
      });
      notify.success(t('teachers.toast.updated'));
    } else {
      await createTeacher.mutateAsync(teacherToSave as unknown as TeacherRecord);
      notify.success(t('teachers.toast.created'));
    }
  };

  const handleDelete = (id: string) => {
    deleteTeacher.mutate(id, {
      onSuccess: () => notify.info(t('teachers.toast.deleted')),
      onError: (err) => notify.error(t('settings.serverSaveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreTeacher.mutate(id, {
      onSuccess: () => notify.success(t('teachers.restoreSuccess')),
      onError: (err) => notify.error(t('settings.serverSaveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteTeachers.mutate(ids, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t('teachers.toast.bulkPartial', {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.info(t('teachers.toast.deleted'));
        }
      },
      onError: (err) => notify.error(t('settings.serverSaveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkRestore = (ids: string[]) => {
    bulkRestoreTeachers.mutate(ids, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t('teachers.toast.bulkPartial', {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t('teachers.restoreSuccess'));
        }
      },
      onError: (err) => notify.error(t('settings.serverSaveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkStatusChange = (ids: string[], status: string) => {
    bulkUpdateTeacherStatus.mutate({ ids, status }, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t('teachers.toast.bulkPartial', {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t('teachers.toast.statusUpdated'));
        }
      },
      onError: (err) => notify.error(t('settings.serverSaveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

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
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
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
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs">{t('teachers.filter.status')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statusOptions.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={filterStatus.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      >
                        {teacherStatusLabel(t, status)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                        filterSpecialization
                          ? 'border-primary/30 bg-primary/5 text-primary'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {filterSpecialization || t('teachers.filter.specialization')}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuRadioGroup
                      value={filterSpecialization}
                      onValueChange={setFilterSpecialization}
                    >
                      <DropdownMenuRadioItem value="">
                        {t('teachers.filter.allSpecializations')}
                      </DropdownMenuRadioItem>
                      {specializationOptions.map((specialization) => (
                        <DropdownMenuRadioItem key={specialization} value={specialization}>
                          {specialization}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ModuleColumnCustomizer
                  columnRegistry={columnRegistry}
                  updateUserColumnLayout={updateUserColumnLayout}
                  labels={customizerLabels}
                />

                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleted((previous) => !previous)}
                    aria-pressed={showDeleted}
                    className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
                      showDeleted
                        ? 'border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{showDeleted ? t('teachers.showActive') : t('teachers.showDeleted')}</span>
                  </Button>
                )}
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
                  <TableSkeleton rows={6} cols={columnRegistry.length} />
                ) : (
                  <>
                    <TeacherList
                      teachers={filteredTeachers}
                      onEdit={(teacher) => { setEditTeacher(teacher); setShowForm(true); }}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                      onBulkDelete={handleBulkDelete}
                      onBulkRestore={handleBulkRestore}
                      onBulkStatusChange={showDeleted ? undefined : handleBulkStatusChange}
                      onWhatsApp={showDeleted ? undefined : handleWhatsApp}
                      onSms={showDeleted ? undefined : handleSms}
                      onEmail={showDeleted ? undefined : handleEmail}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      showDeleted={showDeleted}
                      selectionResetKey={`${listPage}:${search}:${filterStatus.join(',')}:${filterSpecialization}:${sortField}:${sortDir}`}
                      isColumnVisible={isColumnVisible}
                      getColumnWidth={getColumnWidth}
                      onColumnResize={setColumnWidth}
                      sortField={sortField}
                      sortDir={sortDir}
                      onSortChange={(field, dir) => {
                        setSortField(field);
                        setSortDir(dir);
                      }}
                    />
                    {useServerWork && workPageData && (
                      <ListPagination
                        page={workPageData.page}
                        total={workPageData.total}
                        limit={workPageData.limit}
                        hasMore={workPageData.hasMore}
                        onPageChange={setListPage}
                        i18nNamespace="teachers"
                        variant="range"
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
                <TeachersSettingsPanel />
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

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </React.Suspense>
      )}
    </ModulePageShell>
  );
}
