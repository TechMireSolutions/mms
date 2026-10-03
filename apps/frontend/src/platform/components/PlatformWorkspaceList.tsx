import React, { useDeferredValue, useMemo } from 'react';
import { Globe } from 'lucide-react';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { usePlatformWorkspaceDescriptor } from '@/platform/hooks/usePlatformWorkspaceDescriptor';
import { useDescriptorColumnLayout } from '@/hooks/useDescriptorColumnLayout';
import { ActionButton } from '@/components/ui/ActionButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { ListPagination } from '@/components/ui/ListPagination';
import { PlatformWorkspaceDialogs } from '@/platform/components/workspace/PlatformWorkspaceDialogs';
import { PlatformWorkspaceToolbar } from '@/platform/components/workspace/PlatformWorkspaceToolbar';
import { usePlatformWorkspaceUrlState } from '@/platform/components/workspace/usePlatformWorkspaceUrlState';
import { downloadWorkspacesCsv, filterWorkspaces, sortWorkspaces } from '@/platform/components/platformWorkspaceListData';
import { PlatformWorkspaceDirectoryView } from '@/platform/components/workspace/PlatformWorkspaceDirectoryView';
import { useWorkspaceDeleteState } from '@/platform/components/workspace/useWorkspaceDeleteState';
import { usePlatformWorkspaceModalState } from '@/platform/components/workspace/usePlatformWorkspaceModalState';
import { usePlatformWorkspaceSelection } from '@/platform/components/workspace/usePlatformWorkspaceSelection';
import { PlatformWorkspaceBulkDock } from '@/platform/components/workspace/PlatformWorkspaceBulkDock';
import { usePlatformWorkspaceListActions } from '@/platform/components/workspace/usePlatformWorkspaceListActions';
import { usePlatformDensity } from '@/platform/hooks/usePlatformDensity';

/**
 * Super-user workspace list with enable/disable, delete controls, bulk selection, and pagination.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();

  const {
    search, statusFilter, sortField, sortDirection, page, pageSize,
    setSearch, setStatusFilter, toggleSort, setPage, isFiltered, handleClearFilters,
  } = usePlatformWorkspaceUrlState();

  const descriptor = usePlatformWorkspaceDescriptor();
  const columnLayout = useDescriptorColumnLayout('platform.workspaces', descriptor);
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const { density, setDensity } = usePlatformDensity();
  const deleteState = useWorkspaceDeleteState();
  const modalState = usePlatformWorkspaceModalState();
  const listActions = usePlatformWorkspaceListActions();

  const items = workspaces ?? [];
  const deferredSearch = useDeferredValue(search);

  const sortedItems = useMemo(
    () => sortWorkspaces(filterWorkspaces(items, deferredSearch, statusFilter), sortField, sortDirection),
    [items, deferredSearch, statusFilter, sortField, sortDirection],
  );

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

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

  return (
    <div className="space-y-6 w-full text-start pb-24 scroll-pb-24">
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
        density={density}
        onDensityChange={setDensity}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortField={sortField}
        sortDirection={sortDirection}
        onToggleSort={toggleSort}
        onRefetch={() => void refetch()}
        onExportCsv={() => downloadWorkspacesCsv(sortedItems)}
        columnLayout={columnLayout}
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
          <div className="space-y-4">
            <PlatformWorkspaceDirectoryView
              viewMode={viewMode}
              workspaces={paginatedItems}
              descriptor={descriptor}
              columnLayout={columnLayout}
              appDomain={appDomain}
              density={density}
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={toggleSort}
              togglePending={listActions.togglePending}
              deletePending={deleteState.deletePending}
              targetWorkspaceSubdomain={deleteState.targetWorkspace?.subdomain}
              onToggleEnabled={listActions.handleToggleEnabled}
              onToggleEmailVerification={listActions.handleToggleEmailVerification}
              onOpenModules={modalState.handleOpenModules}
              onOpenDelete={deleteState.handleOpenDelete}
              onOpenResetPassword={modalState.handleOpenResetPassword}
              onOpenCreateAdmin={modalState.handleOpenCreateAdmin}
              onInspect={modalState.handleOpenInspect}
              selectedSubdomains={selection.selectedSubdomains}
              onToggleSelect={selection.toggleSelect}
              onToggleSelectAll={() => selection.toggleSelectAll(sortedItems)}
            />
            {sortedItems.length > pageSize && (
              <ListPagination
                page={page}
                total={sortedItems.length}
                limit={pageSize}
                onPageChange={setPage}
                i18nNamespace="platform"
                variant="range"
              />
            )}
          </div>
        )}
      </ModuleWorkListStateShell>

      <PlatformWorkspaceDialogs
        appDomain={appDomain}
        deleteState={deleteState}
        modalState={modalState}
        descriptor={descriptor}
      />

      <PlatformWorkspaceBulkDock
        selectedCount={selection.selectedCount}
        selectedWorkspaces={selection.selectedWorkspaces}
        onClearSelection={selection.clearSelection}
        onBulkEnable={listActions.handleBulkEnable}
        onBulkDisable={listActions.handleBulkDisable}
        busy={listActions.togglePending}
      />
    </div>
  );
}