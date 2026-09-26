import React, { useState, useDeferredValue, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, Ban, Download, RefreshCw } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import {
  usePlatformWorkspaces,
  useSetWorkspaceEmailVerification,
  useSetWorkspaceEnabled,
  useResetWorkspaceAdminPassword,
  useCreateWorkspaceAdmin,
} from '@/platform/hooks/usePlatformWorkspaces';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { usePlatformWorkspaceDescriptor } from '@/platform/hooks/usePlatformWorkspaceDescriptor';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformWorkspaceDeleteDialog } from '@/platform/components/PlatformWorkspaceDeleteDialog';
import { PlatformWorkspaceModulesDialog } from '@/platform/components/PlatformWorkspaceModulesDialog';
import { PlatformWorkspaceResetPasswordDialog } from '@/platform/components/PlatformWorkspaceResetPasswordDialog';
import { PlatformWorkspaceCreateAdminDialog } from '@/platform/components/PlatformWorkspaceCreateAdminDialog';
import { PlatformWorkspaceSortMenu } from '@/platform/components/PlatformWorkspaceSortMenu';
import {
  downloadWorkspacesCsv,
  filterWorkspaces,
  sortWorkspaces,
  type WorkspaceSortDirection,
  type WorkspaceSortField,
} from '@/platform/components/platformWorkspaceListData';
import { WorkspaceTableView } from '@/platform/components/workspace/WorkspaceTableView';
import { WorkspaceListCards } from '@/platform/components/workspace/WorkspaceListCards';
import { useWorkspaceDeleteState } from '@/platform/components/workspace/useWorkspaceDeleteState';

/**
 * Super-user workspace list with enable/disable and delete controls.
 * View state lives in the URL params; row data transforms live in `platformWorkspaceListData`.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const setEmailVerification = useSetWorkspaceEmailVerification();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as 'all' | 'active' | 'inactive') ?? 'all';
  const sortField = (searchParams.get('sort') as WorkspaceSortField) ?? 'madrasaName';
  const sortDirection = (searchParams.get('dir') as WorkspaceSortDirection) ?? 'asc';

  const setSearch = (v: string) =>
    setSearchParams((p) => { if (v) { p.set('q', v); } else { p.delete('q'); } return p; }, { replace: true });
  const setStatusFilter = (v: 'all' | 'active' | 'inactive') =>
    setSearchParams((p) => { if (v === 'all') { p.delete('status'); } else { p.set('status', v); } return p; }, { replace: true });
  const setSortField = (v: WorkspaceSortField) =>
    setSearchParams((p) => { p.set('sort', v); return p; }, { replace: true });
  const setSortDirection = (v: WorkspaceSortDirection) =>
    setSearchParams((p) => { p.set('dir', v); return p; }, { replace: true });

  const descriptor = usePlatformWorkspaceDescriptor();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const {
    confirmOpen,
    setConfirmOpen,
    targetWorkspace,
    password,
    setPassword,
    confirmSubdomain,
    setConfirmSubdomain,
    passwordError,
    deletePending,
    handleOpenDelete,
    handleDelete,
  } = useWorkspaceDeleteState();

  // Modules modal state
  const [modulesOpen, setModulesOpen] = useState(false);
  const [targetModulesWorkspace, setTargetModulesWorkspace] = useState<PlatformWorkspaceRowData | null>(null);

  // Reset password modal state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [targetResetWorkspace, setTargetResetWorkspace] = useState<PlatformWorkspaceRowData | null>(null);
  const resetAdminPasswordMutation = useResetWorkspaceAdminPassword();

  // Create admin modal state
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [targetCreateWorkspace, setTargetCreateWorkspace] = useState<PlatformWorkspaceRowData | null>(null);
  const createAdminMutation = useCreateWorkspaceAdmin();

  const items = workspaces ?? [];
  const deferredSearch = useDeferredValue(search);

  const sortedItems = useMemo(
    () => sortWorkspaces(filterWorkspaces(items, deferredSearch, statusFilter), sortField, sortDirection),
    [items, deferredSearch, statusFilter, sortField, sortDirection],
  );

  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const w of items) {
      if (w.enabled) active += 1;
      else inactive += 1;
    }
    return { totalCount: items.length, activeCount: active, inactiveCount: inactive };
  }, [items]);

  const toggleSort = (field: WorkspaceSortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenModules = (workspace: PlatformWorkspaceRowData): void => {
    setTargetModulesWorkspace(workspace);
    setModulesOpen(true);
  };

  const handleOpenResetPassword = (workspace: PlatformWorkspaceRowData): void => {
    setTargetResetWorkspace(workspace);
    setResetPasswordOpen(true);
  };

  const handleOpenCreateAdmin = (workspace: PlatformWorkspaceRowData): void => {
    setTargetCreateWorkspace(workspace);
    setCreateAdminOpen(true);
  };

  const handleToggleEnabled = (subdomain: string, enabled: boolean): void => {
    setEnabled.mutate({ subdomain, enabled });
  };

  const handleToggleEmailVerification = (subdomain: string, requireEmailVerification: boolean): void => {
    setEmailVerification.mutate({ subdomain, requireEmailVerification });
  };

  const isFiltered = Boolean(search || statusFilter !== 'all');

  const handleClearFilters = (): void => {
    setSearchParams((p) => {
      p.delete('q');
      p.delete('status');
      return p;
    }, { replace: true });
  };

  const togglePending = setEnabled.isPending || setEmailVerification.isPending;

  return (
    <div className="space-y-6 w-full text-start">
      <ModuleWorkToolbar
        regionLabel={t('platform.manageMadrasas')}
        shownCountLabel={`${sortedItems.length} of ${totalCount}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('common.search')}
        searchId="platform-workspaces-search"
        isSearching={isFetching}
        hasActiveFilters={isFiltered}
        onClearFilters={handleClearFilters}
        clearFiltersLabel={t('common.clearFilters')}
        viewModeToggle={{
          viewMode,
          onViewModeChange: setViewMode,
        }}
      >
        <SubTabBar
          tabs={[
            { key: 'all', label: `${t('platform.filterAll')} (${totalCount})` },
            { key: 'active', label: `${t('platform.workspaceActive')} (${activeCount})`, icon: Globe },
            { key: 'inactive', label: `${t('platform.workspaceInactive')} (${inactiveCount})`, icon: Ban },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <PlatformWorkspaceSortMenu
          sortField={sortField}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
        />

        {/* Refresh button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="min-h-11 h-11 min-w-11 w-11 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
          title={t('common.refresh')}
          aria-label={t('common.refresh')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
        </Button>

        {/* Export Workspaces CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadWorkspacesCsv(sortedItems)}
          disabled={sortedItems.length === 0}
          className="min-h-11 h-11 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
          title={t('platform.exportWorkspacesCsv')}
        >
          <Download className="w-3.5 h-3.5" aria-hidden />
          {t('platform.exportWorkspacesCsv')}
        </Button>
      </ModuleWorkToolbar>

      <ModuleWorkListStateShell
        isError={isError}
        isLoading={isLoading}
        isFetching={isFetching}
        onRetry={() => void refetch()}
        errorTitle={t('platform.loadFailed')}
        errorHint={t('platform.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={5}
        useServerWork={false}
        pageData={null}
        onPageChange={() => {}}
        i18nNamespace="platform"
        showPagination={false}
        loadingLabel={t('common.loading')}
      >
        {sortedItems.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <EmptyState
              icon={Globe}
              title={
                isFiltered
                  ? t('platform.noSearchResults')
                  : t('apex.noMadrasasYet')
              }
              action={
                isFiltered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="min-h-11 h-11 px-4 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {t('common.clearFilters')}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === 'table' ? (
          <WorkspaceTableView
            workspaces={sortedItems}
            descriptor={descriptor}
            appDomain={appDomain}
            sortField={sortField}
            sortDirection={sortDirection}
            onToggleSort={toggleSort}
            togglePending={togglePending}
            deletePending={deletePending}
            targetWorkspaceSubdomain={targetWorkspace?.subdomain}
            onToggleEnabled={handleToggleEnabled}
            onToggleEmailVerification={handleToggleEmailVerification}
            onOpenModules={handleOpenModules}
            onOpenDelete={handleOpenDelete}
            onOpenResetPassword={handleOpenResetPassword}
            onOpenCreateAdmin={handleOpenCreateAdmin}
          />
        ) : (
          <WorkspaceListCards
            workspaces={sortedItems}
            appDomain={appDomain}
            togglePending={togglePending}
            deletePending={deletePending}
            targetWorkspaceSubdomain={targetWorkspace?.subdomain}
            onToggleEnabled={handleToggleEnabled}
            onToggleEmailVerification={handleToggleEmailVerification}
            onOpenModules={handleOpenModules}
            onOpenDelete={handleOpenDelete}
            onOpenResetPassword={handleOpenResetPassword}
            onOpenCreateAdmin={handleOpenCreateAdmin}
          />
        )}
      </ModuleWorkListStateShell>

      {targetWorkspace ? (
        <PlatformWorkspaceDeleteDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          workspace={targetWorkspace}
          appDomain={appDomain}
          password={password}
          onPasswordChange={setPassword}
          confirmSubdomain={confirmSubdomain}
          onConfirmSubdomainChange={setConfirmSubdomain}
          passwordError={passwordError}
          deletePending={deletePending}
          onConfirm={handleDelete}
        />
      ) : null}

      {targetModulesWorkspace ? (
        <PlatformWorkspaceModulesDialog
          workspace={targetModulesWorkspace}
          open={modulesOpen}
          onOpenChange={setModulesOpen}
        />
      ) : null}

      {targetResetWorkspace ? (
        <PlatformWorkspaceResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          workspace={targetResetWorkspace}
          resetPending={resetAdminPasswordMutation.isPending}
          onConfirm={async (subdomain, newPassword) => {
            const res = await resetAdminPasswordMutation.mutateAsync({ subdomain, newPassword });
            return { newPassword: res.newPassword, adminEmail: res.adminEmail };
          }}
        />
      ) : null}

      {targetCreateWorkspace ? (
        <PlatformWorkspaceCreateAdminDialog
          open={createAdminOpen}
          onOpenChange={setCreateAdminOpen}
          workspace={targetCreateWorkspace}
          createPending={createAdminMutation.isPending}
          onConfirm={async (subdomain, data) => {
            const res = await createAdminMutation.mutateAsync({ subdomain, ...data });
            return { initialPassword: res.initialPassword, adminEmail: res.adminEmail, name: res.name };
          }}
        />
      ) : null}
    </div>
  );
}