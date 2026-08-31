import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, Ban, Download, ArrowUpDown } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { getAppDomain } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useDeleteWorkspace,
  usePlatformWorkspaces,
  useSetWorkspaceEmailVerification,
  useSetWorkspaceEnabled,
} from '@/platform/hooks/usePlatformWorkspaces';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { SearchBar } from '@/components/ui/SearchBar';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformWorkspaceTable } from '@/platform/components/PlatformWorkspaceTable';
import { PlatformWorkspaceCards } from '@/platform/components/PlatformWorkspaceCards';
import { PlatformWorkspaceDeleteDialog } from '@/platform/components/PlatformWorkspaceDeleteDialog';
import { PlatformWorkspaceModulesDialog } from '@/platform/components/PlatformWorkspaceModulesDialog';
import { getPlatformErrorMessage } from '@/platform/lib/platformAuthErrors';
import { triggerFileDownload } from '@/lib/download';

type SortField = 'name' | 'subdomain' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

/**
 * Super-user workspace list with enable/disable and delete controls.
 * Single Source of Truth (SSOT) managing directory view modes, sorting, and action dialogs.
 */
export default function PlatformWorkspaceList(): React.JSX.Element {
  const { t } = useTranslation();
  const appDomain = getAppDomain();
  const { data: workspaces, isLoading, isError, refetch, isFetching } = usePlatformWorkspaces();
  const setEnabled = useSetWorkspaceEnabled();
  const setEmailVerification = useSetWorkspaceEmailVerification();
  const deleteWorkspace = useDeleteWorkspace();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as 'all' | 'active' | 'inactive') ?? 'all';
  const sortField = (searchParams.get('sort') as SortField) ?? 'name';
  const sortDirection = (searchParams.get('dir') as SortDirection) ?? 'asc';

  const setSearch = (v: string) =>
    setSearchParams((p) => { if (v) { p.set('q', v); } else { p.delete('q'); } return p; }, { replace: true });
  const setStatusFilter = (v: 'all' | 'active' | 'inactive') =>
    setSearchParams((p) => { if (v === 'all') { p.delete('status'); } else { p.set('status', v); } return p; }, { replace: true });
  const setSortField = (v: SortField) =>
    setSearchParams((p) => { p.set('sort', v); return p; }, { replace: true });
  const setSortDirection = (v: SortDirection) =>
    setSearchParams((p) => { p.set('dir', v); return p; }, { replace: true });

  const { viewMode, setViewMode } = useWorkDirectoryViewMode();

  // Delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState<PlatformWorkspaceRowData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmSubdomain, setConfirmSubdomain] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Modules modal state
  const [modulesOpen, setModulesOpen] = useState(false);
  const [targetModulesWorkspace, setTargetModulesWorkspace] = useState<PlatformWorkspaceRowData | null>(null);

  useEffect(() => {
    if (!confirmOpen) {
      setTargetWorkspace(null);
      setPassword('');
      setConfirmSubdomain('');
      setPasswordError(null);
    }
  }, [confirmOpen]);

  const items = workspaces ?? [];

  const filteredItems = (() => {
    return items.filter((workspace) => {
      const matchesSearch =
        workspace.madrasaName.toLowerCase().includes(search.toLowerCase()) ||
        workspace.subdomain.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && workspace.enabled) ||
        (statusFilter === 'inactive' && !workspace.enabled);

      return matchesSearch && matchesStatus;
    });
  })();

  const sortedItems = (() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.madrasaName.localeCompare(b.madrasaName);
      } else if (sortField === 'subdomain') {
        comparison = a.subdomain.localeCompare(b.subdomain);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'status') {
        comparison = Number(b.enabled) - Number(a.enabled);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  })();

  const totalCount = items.length;
  const activeCount = items.filter((w) => w.enabled).length;
  const inactiveCount = items.filter((w) => !w.enabled).length;

  const handleExportCsv = (): void => {
    if (sortedItems.length === 0) return;
    const headers = ['Subdomain', 'Madrasa Name', 'Status', 'Email Verification', 'Created At'];
    const rows = sortedItems.map((w) => [
      w.subdomain,
      w.madrasaName,
      w.enabled ? 'Active' : 'Disabled',
      w.requireEmailVerification ? 'Required' : 'Optional',
      w.createdAt,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `platform-workspaces-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const toggleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = (): void => {
    if (!targetWorkspace) return;
    if (confirmSubdomain.trim().toLowerCase() !== targetWorkspace.subdomain.toLowerCase()) {
      setPasswordError(t('platform.deleteWorkspaceConfirmSubdomainMismatch'));
      return;
    }
    if (!password.trim()) {
      setPasswordError(t('platform.deleteWorkspacePasswordHint'));
      return;
    }
    setPasswordError(null);
    deleteWorkspace
      .mutateAsync({
        subdomain: targetWorkspace.subdomain,
        password,
        confirmSubdomain: confirmSubdomain.trim(),
      })
      .then(() => setConfirmOpen(false))
      .catch((error: unknown) => {
        setPasswordError(getPlatformErrorMessage(error, t));
      });
  };

  const handleOpenDelete = (workspace: PlatformWorkspaceRowData): void => {
    setTargetWorkspace(workspace);
    setConfirmOpen(true);
  };

  const handleOpenModules = (workspace: PlatformWorkspaceRowData): void => {
    setTargetModulesWorkspace(workspace);
    setModulesOpen(true);
  };

  return (
    <div className="space-y-6 w-full text-start">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('common.search')}
          className="w-full md:max-w-md"
        />

        <div className="flex flex-wrap items-center gap-3">
          <SubTabBar
            tabs={[
              { key: 'all', label: `${t('platform.filterAll')} (${totalCount})` },
              { key: 'active', label: `${t('platform.workspaceActive')} (${activeCount})`, icon: Globe },
              { key: 'inactive', label: `${t('platform.workspaceInactive')} (${inactiveCount})`, icon: Ban },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer select-none"
              >
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden />
                {t('platform.sort.sortBy')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
              <DropdownMenuItem
                onClick={() => toggleSort('name')}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('platform.sort.name')} {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleSort('subdomain')}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('platform.sort.subdomain')} {sortField === 'subdomain' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleSort('createdAt')}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('platform.sort.createdAt')} {sortField === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleSort('status')}
                className="text-xs font-semibold cursor-pointer"
              >
                {t('platform.sort.status')} {sortField === 'status' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Workspaces CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={sortedItems.length === 0}
            className="h-10 px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 cursor-pointer"
            title={t('platform.exportWorkspacesCsv')}
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            {t('platform.exportWorkspacesCsv')}
          </Button>

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
        {sortedItems.length === 0 ? (
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
            workspaces={sortedItems}
            appDomain={appDomain}
            togglePending={setEnabled.isPending || setEmailVerification.isPending}
            deletePending={deleteWorkspace.isPending}
            targetDeleteSubdomain={targetWorkspace?.subdomain}
            onToggle={(subdomain, enabled) => setEnabled.mutate({ subdomain, enabled })}
            onToggleEmailVerification={(subdomain, requireEmailVerification) =>
              setEmailVerification.mutate({ subdomain, requireEmailVerification })
            }
            onOpenModules={handleOpenModules}
            onOpenDelete={handleOpenDelete}
          />
        ) : (
          <PlatformWorkspaceCards
            workspaces={sortedItems}
            appDomain={appDomain}
            togglePending={setEnabled.isPending || setEmailVerification.isPending}
            deletePending={deleteWorkspace.isPending}
            targetDeleteSubdomain={targetWorkspace?.subdomain}
            onToggle={(subdomain, enabled) => setEnabled.mutate({ subdomain, enabled })}
            onToggleEmailVerification={(subdomain, requireEmailVerification) =>
              setEmailVerification.mutate({ subdomain, requireEmailVerification })
            }
            onOpenModules={handleOpenModules}
            onOpenDelete={handleOpenDelete}
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
          deletePending={deleteWorkspace.isPending}
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
    </div>
  );
}
