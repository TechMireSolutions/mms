import React, { useState, useDeferredValue, useMemo } from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { DETAIL_SECTION_TITLE } from '@/components/ui/formStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionButton } from '@/components/ui/ActionButton';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { exportPlatformAdminsCsv } from '@/platform/components/admin/exportPlatformAdminsCsv';
import { PlatformAdminsListCards } from '@/platform/components/admin/PlatformAdminsListCards';
import { PlatformAdminsTableView, type DangerMode } from '@/platform/components/admin/PlatformAdminsTableView';
import { PlatformAdminsDialogs } from '@/platform/components/admin/PlatformAdminsDialogs';
import { useVerifyPlatformAdminEmail } from '@/platform/hooks/usePlatformAdmins';
import { usePlatformUserDescriptor } from '@/platform/hooks/usePlatformUserDescriptor';

export type AdminRoleFilter = 'all' | 'super_user' | 'admin';

interface PlatformAdminsListProps {
  admins: PlatformUserProfile[] | undefined;
  loading: boolean;
  fetchError: boolean;
  onRetry: () => void;
}

export function PlatformAdminsList({
  admins,
  loading,
  fetchError,
  onRetry,
}: PlatformAdminsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const descriptor = usePlatformUserDescriptor();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all');
  const [editingAdmin, setEditingAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerAdmin, setDangerAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerMode, setDangerMode] = useState<DangerMode>('disable');
  const [inspectAdmin, setInspectAdmin] = useState<PlatformUserProfile | null>(null);

  const verifyEmailMutation = useVerifyPlatformAdminEmail();

  const openDanger = (admin: PlatformUserProfile, mode: DangerMode): void => {
    setDangerAdmin(admin);
    setDangerMode(mode);
  };

  const rawItems = admins ?? [];
  const deferredQuery = useDeferredValue(searchQuery);

  const superUserCount = rawItems.filter((a) => a.role === 'super_user').length;
  const adminCount = rawItems.filter((a) => a.role === 'admin').length;

  const filteredItems = useMemo(() => {
    let list = rawItems;
    if (roleFilter !== 'all') {
      list = list.filter((a) => a.role === roleFilter);
    }
    if (!deferredQuery.trim()) return list;
    const q = deferredQuery.trim().toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q),
    );
  }, [rawItems, roleFilter, deferredQuery]);

  const hasActiveFilters = Boolean(searchQuery || roleFilter !== 'all');
  const handleClearFilters = (): void => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  const actionProps = {
    descriptor,
    onInspect: setInspectAdmin,
    onEditAccess: setEditingAdmin,
    onToggleStatus: openDanger,
    onDelete: (a: PlatformUserProfile) => openDanger(a, 'delete'),
    verifyPending: verifyEmailMutation.isPending,
    onVerifyEmail: (id: string) => verifyEmailMutation.mutate(id),
  };

  return (
    <div className="lg:col-span-2 space-y-4 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className={`${DETAIL_SECTION_TITLE} text-balance`}>
          {t('platform.manageAdmins')} ({rawItems.length})
        </h2>
        <SubTabBar
          tabs={[
            { key: 'all', label: `${t('platform.roleAll')} (${rawItems.length})` },
            { key: 'super_user', label: `${t('platform.roleSuperUser')} (${superUserCount})` },
            { key: 'admin', label: `${t('platform.roleAdmin')} (${adminCount})` },
          ]}
          value={roleFilter}
          onChange={(k) => setRoleFilter(k as AdminRoleFilter)}
        />
      </div>

      <ModuleWorkToolbar
        regionLabel={t('platform.manageAdmins')}
        shownCountLabel={`${filteredItems.length} of ${rawItems.length}`}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('platform.searchAdminsPlaceholder')}
        searchId="platform-admins-search"
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        clearFiltersLabel={t('common.clearFilters')}
        viewModeToggle={{
          viewMode,
          onViewModeChange: setViewMode,
        }}
        primaryAction={
          <ActionButton
            variant="secondary"
            icon={Download}
            onClick={() => exportPlatformAdminsCsv(filteredItems, descriptor)}
            disabled={filteredItems.length === 0}
            title={t('platform.exportAdminsCsv')}
          >
            {t('platform.exportAdminsCsv')}
          </ActionButton>
        }
      />

      <ModuleWorkListStateShell
        isError={fetchError}
        isLoading={loading}
        isFetching={false}
        onRetry={onRetry}
        errorTitle={t('platform.loadFailed')}
        errorHint={t('platform.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={4}
        useServerWork={false}
        pageData={null}
        onPageChange={() => {}}
        i18nNamespace="platform"
        showPagination={false}
        loadingLabel={t('common.loading')}
      >
        {filteredItems.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <EmptyState
              icon={ShieldCheck}
              title={hasActiveFilters ? t('platform.noMatchingAdmins') : t('platform.noAdmins')}
              action={
                hasActiveFilters ? (
                  <ActionButton
                    variant="secondary"
                    onClick={handleClearFilters}
                  >
                    {t('common.clearFilters')}
                  </ActionButton>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === 'table' ? (
          <PlatformAdminsTableView admins={filteredItems} {...actionProps} />
        ) : (
          <PlatformAdminsListCards admins={filteredItems} {...actionProps} />
        )}
      </ModuleWorkListStateShell>

      <PlatformAdminsDialogs
        editingAdmin={editingAdmin}
        onCloseEditing={() => setEditingAdmin(null)}
        dangerAdmin={dangerAdmin}
        dangerMode={dangerMode}
        onCloseDanger={() => setDangerAdmin(null)}
        inspectAdmin={inspectAdmin}
        onCloseInspect={() => setInspectAdmin(null)}
        descriptor={descriptor}
      />
    </div>
  );
}
