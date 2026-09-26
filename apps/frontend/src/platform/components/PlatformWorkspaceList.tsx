import React, { useDeferredValue, useMemo } from 'react';
import { Globe } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformWorkspaces, useSetWorkspaceEmailVerification, useSetWorkspaceEnabled } from '@/platform/hooks/usePlatformWorkspaces';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { usePlatformWorkspaceDescriptor } from '@/platform/hooks/usePlatformWorkspaceDescriptor';
import { ActionButton } from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformWorkspaceDialogs } from '@/platform/components/workspace/PlatformWorkspaceDialogs';
import { PlatformWorkspaceToolbar } from '@/platform/components/workspace/PlatformWorkspaceToolbar';
import { usePlatformWorkspaceUrlState } from '@/platform/components/workspace/usePlatformWorkspaceUrlState';
import { downloadWorkspacesCsv, filterWorkspaces, sortWorkspaces } from '@/platform/components/platformWorkspaceListData';
import { PlatformWorkspaceDirectoryView } from '@/platform/components/workspace/PlatformWorkspaceDirectoryView';
import { useWorkspaceDeleteState } from '@/platform/components/workspace/useWorkspaceDeleteState';
import { usePlatformWorkspaceModalState } from '@/platform/components/workspace/usePlatformWorkspaceModalState';
import { usePlatformWorkspaceSelection } from '@/platform/components/workspace/usePlatformWorkspaceSelection';
import { PlatformWorkspaceBulkDock } from '@/platform/components/workspace/PlatformWorkspaceBulkDock';

/**
 * Super-user workspace list with enable/disable, delete controls, and bulk selection.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const setEmailVerification = useSetWorkspaceEmailVerification();

  const {
    search, statusFilter, sortField, sortDirection,
    setSearch, setStatusFilter, toggleSort, isFiltered, handleClearFilters,
  } = usePlatformWorkspaceUrlState();

  const descriptor = usePlatformWorkspaceDescriptor();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const deleteState = useWorkspaceDeleteState();
  const modalState = usePlatformWorkspaceModalState();

  const items = workspaces ?? [];
  const deferredSearch = useDeferredValue(search);

  const sortedItems = useMemo(
    () => sortWorkspaces(filterWorkspaces(items, deferredSearch, statusFilter), sortField, sortDirection),
    [items, deferredSearch, statusFilter, sortField, sortDirection],
  );

  const selection = usePlatformWorkspaceSelection(sortedItems);

  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const w of items) {
      if (w.enabled) active += 1;
      else inactive += 1;
    }
    return { totalCount: items.length, activeCount: active, inactiveCount: inactive };
  }, [items]);

  const handleToggleEnabled = (subdomain: string, enabled: boolean): void => {
    setEnabled.mutate({ subdomain, enabled });
  };

  const handleToggleEmailVerification = (subdomain: string, requireEmailVerification: boolean): void => {
    setEmailVerification.mutate({ subdomain, requireEmailVerification });
  };

  const handleBulkEnable = (selected: PlatformWorkspaceRowData[]): void => {
    for (const item of selected) {
      if (!item.enabled) setEnabled.mutate({ subdomain: item.subdomain, enabled: true });
    }
  };

  const handleBulkDisable = (selected: PlatformWorkspaceRowData[]): void => {
    for (const item of selected) {
      if (item.enabled) setEnabled.mutate({ subdomain: item.subdomain, enabled: false });
    }
  };

  const togglePending = setEnabled.isPending || setEmailVerification.isPending;

  return (
    <div className="space-y-6 w-full text-start">
      <PlatformWorkspaceToolbar
        shownCount={sortedItems.length}
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        search={search}
        onSearchChange={setSearch}
        isSearching={isFetching}
        hasActiveFilters={isFiltered}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        onToggleSort={toggleSort}
        onRefetch={() => void refetch()}
        onExportCsv={() => downloadWorkspacesCsv(sortedItems)}
      />

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
              title={isFiltered ? t('platform.noSearchResults') : t('apex.noMadrasasYet')}
              action={
                isFiltered ? (
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
        ) : (
          <PlatformWorkspaceDirectoryView
            viewMode={viewMode}
            workspaces={sortedItems}
            descriptor={descriptor}
            appDomain={appDomain}
            sortField={sortField}
            sortDirection={sortDirection}
            onToggleSort={toggleSort}
            togglePending={togglePending}
            deletePending={deleteState.deletePending}
            targetWorkspaceSubdomain={deleteState.targetWorkspace?.subdomain}
            onToggleEnabled={handleToggleEnabled}
            onToggleEmailVerification={handleToggleEmailVerification}
            onOpenModules={modalState.handleOpenModules}
            onOpenDelete={deleteState.handleOpenDelete}
            onOpenResetPassword={modalState.handleOpenResetPassword}
            onOpenCreateAdmin={modalState.handleOpenCreateAdmin}
            selectedSubdomains={selection.selectedSubdomains}
            onToggleSelect={selection.toggleSelect}
            onToggleSelectAll={() => selection.toggleSelectAll(sortedItems)}
          />
        )}
      </ModuleWorkListStateShell>

      <PlatformWorkspaceDialogs
        appDomain={appDomain}
        deleteState={deleteState}
        modalState={modalState}
      />

      <PlatformWorkspaceBulkDock
        selectedCount={selection.selectedCount}
        selectedWorkspaces={selection.selectedWorkspaces}
        onClearSelection={selection.clearSelection}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        busy={togglePending}
      />
    </div>
  );
}