import { useState } from 'react';
import { Globe, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useDeleteWorkspace,
  usePlatformWorkspaces,
  useSetWorkspaceEnabled,
} from '@/platform/hooks/usePlatformWorkspaces';
import { SearchBar } from '@/components/ui/SearchBar';
import { SubTabBar } from '@/components/ui/SubTabBar';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlatformWorkspaceRow } from '@/platform/components/PlatformWorkspaceRow';

/**
 * Super-user workspace list with enable/disable and delete controls.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const deleteWorkspace = useDeleteWorkspace();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  if (isLoading) {
    return <RouteStatusFallback />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t('apex.loadError')}
        onRetry={() => void refetch()}
      />
    );
  }

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

  return (
    <div className="space-y-6 w-full text-start">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
          className="w-full md:max-w-md"
        />
        <SubTabBar
          tabs={[
            { key: 'all', label: t('attendance.filter.all') },
            { key: 'active', label: t('platform.workspaceActive'), icon: Globe },
            { key: 'inactive', label: t('platform.workspaceInactive'), icon: Ban },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={search ? t('platform.noAdmins') : t('apex.noMadrasasYet')}
          description={search ? t('platform.noSearchResults') : undefined}
          compact
        />
      ) : (
        <motion.ul layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((workspace) => (
              <PlatformWorkspaceRow
                key={workspace.subdomain}
                workspace={workspace}
                appDomain={appDomain}
                togglePending={setEnabled.isPending && setEnabled.variables?.subdomain === workspace.subdomain}
                deletePending={deleteWorkspace.isPending && deleteWorkspace.variables?.subdomain === workspace.subdomain}
                onToggle={(enabled) => setEnabled.mutate({ subdomain: workspace.subdomain, enabled })}
                onDelete={(password) =>
                  deleteWorkspace.mutateAsync({ subdomain: workspace.subdomain, password })
                }
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
