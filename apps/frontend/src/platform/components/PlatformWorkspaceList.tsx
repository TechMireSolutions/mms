import { useState } from 'react';
import { Globe, Ban } from 'lucide-react';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useDeleteWorkspace,
  usePlatformWorkspaces,
  useSetWorkspaceEnabled,
} from '@/platform/hooks/usePlatformWorkspaces';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { SearchBar } from '@/components/ui/SearchBar';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformWorkspaceTable } from '@/platform/components/PlatformWorkspaceTable';
import { PlatformWorkspaceCards } from '@/platform/components/PlatformWorkspaceCards';

/**
 * Super-user workspace list with enable/disable and delete controls.
 * Hosts the single primary "Create new madrasa" onboarding trigger for the platform.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const deleteWorkspace = useDeleteWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  const items = workspaces ?? [];

  const filteredItems = items.filter((workspace) => {
    const matchesSearch =
      workspace.madrasaName.toLowerCase().includes(search.toLowerCase()) ||
      workspace.subdomain.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && workspace.enabled) ||
      (statusFilter === 'inactive' && !workspace.enabled);

    return matchesSearch && matchesStatus;
  });

  const totalCount = items.length;
  const activeCount = items.filter((w) => w.enabled).length;
  const inactiveCount = items.filter((w) => !w.enabled).length;

  return (
    <div className="space-y-6 w-full text-start">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
          className="w-full md:max-w-md"
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SubTabBar
            tabs={[
              { key: 'all', label: `${t('platform.filterAll')} (${totalCount})` },
              { key: 'active', label: `${t('platform.workspaceActive')} (${activeCount})`, icon: Globe },
              { key: 'inactive', label: `${t('platform.workspaceInactive')} (${inactiveCount})`, icon: Ban },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      <ModuleWorkListStateShell
        isError={isError}
        isLoading={isLoading}
        isFetching={isFetching}
        onRetry={() => void refetch()}
        errorTitle={t('platform.loadFailed')}
        errorHint={t('platform.loadFailedHint')}
        viewMode={viewMode}
        skeletonColumnCount={3}
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
              icon={Globe}
              title={
                search || statusFilter !== 'all'
                  ? t('platform.noSearchResults')
                  : t('apex.noMadrasasYet')
              }
            />
          </div>
        ) : viewMode === 'table' ? (
          <PlatformWorkspaceTable
            workspaces={filteredItems}
            appDomain={appDomain}
            togglePending={setEnabled.isPending}
            deletePending={deleteWorkspace.isPending}
            onToggle={(subdomain, enabled) => setEnabled.mutate({ subdomain, enabled })}
            onDelete={(subdomain, { password, confirmSubdomain }) =>
              deleteWorkspace.mutateAsync({
                subdomain,
                password,
                confirmSubdomain,
              })
            }
          />
        ) : (
          <PlatformWorkspaceCards
            workspaces={filteredItems}
            appDomain={appDomain}
            togglePending={setEnabled.isPending}
            deletePending={deleteWorkspace.isPending}
            onToggle={(subdomain, enabled) => setEnabled.mutate({ subdomain, enabled })}
            onDelete={(subdomain, { password, confirmSubdomain }) =>
              deleteWorkspace.mutateAsync({
                subdomain,
                password,
                confirmSubdomain,
              })
            }
          />
        )}
      </ModuleWorkListStateShell>
    </div>
  );
}
