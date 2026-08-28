import React, { useState, useMemo } from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { DETAIL_SECTION_TITLE } from '@/components/ui/formStyles';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/SearchBar';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformEditAdminAccessDialog } from '@/platform/components/PlatformEditAdminAccessDialog';
import { PlatformAdminDangerDialog } from '@/platform/components/PlatformAdminDangerDialog';
import { PlatformAdminTable } from '@/platform/components/admin/PlatformAdminTable';
import { PlatformAdminCards } from '@/platform/components/admin/PlatformAdminCards';
import { triggerFileDownload } from '@/lib/download';

interface PlatformAdminsListProps {
  admins: PlatformUserProfile[] | undefined;
  loading: boolean;
  fetchError: boolean;
  onRetry: () => void;
}

type DangerMode = 'disable' | 'enable' | 'delete';

export function PlatformAdminsList({
  admins,
  loading,
  fetchError,
  onRetry,
}: PlatformAdminsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerAdmin, setDangerAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerMode, setDangerMode] = useState<DangerMode>('disable');

  const openDanger = (admin: PlatformUserProfile, mode: DangerMode): void => {
    setDangerAdmin(admin);
    setDangerMode(mode);
  };

  const rawItems = admins ?? [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.trim().toLowerCase();
    return rawItems.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q),
    );
  }, [rawItems, searchQuery]);

  const handleExportCsv = () => {
    if (filteredItems.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At'];
    const rows = filteredItems.map((a) => [
      a.id,
      a.name,
      a.email,
      a.role,
      a.disabledAt ? 'Disabled' : 'Active',
      a.createdAt,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `platform-admins-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="lg:col-span-2 space-y-4 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <h2 className={DETAIL_SECTION_TITLE}>
          {t('platform.manageAdmins')} ({rawItems.length})
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('platform.searchAdminsPlaceholder')}
            className="w-full sm:w-56"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="h-9 px-3 text-xs font-semibold rounded-xl shrink-0 cursor-pointer"
            title={t('platform.exportAdminsCsv')}
          >
            <Download className="w-3.5 h-3.5 me-1.5" aria-hidden />
            {t('platform.exportAdminsCsv')}
          </Button>

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

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
              title={searchQuery ? t('platform.noMatchingAdmins') : t('platform.noAdmins')}
            />
          </div>
        ) : viewMode === 'table' ? (
          <PlatformAdminTable
            admins={filteredItems}
            onEditAccess={(a) => setEditingAdmin(a)}
            onToggleStatus={(a, mode) => openDanger(a, mode)}
            onDelete={(a) => openDanger(a, 'delete')}
          />
        ) : (
          <PlatformAdminCards
            admins={filteredItems}
            onEditAccess={(a) => setEditingAdmin(a)}
            onToggleStatus={(a, mode) => openDanger(a, mode)}
            onDelete={(a) => openDanger(a, 'delete')}
          />
        )}
      </ModuleWorkListStateShell>

      {editingAdmin ? (
        <PlatformEditAdminAccessDialog
          admin={editingAdmin}
          open={Boolean(editingAdmin)}
          onOpenChange={(open) => {
            if (!open) setEditingAdmin(null);
          }}
        />
      ) : null}

      {dangerAdmin ? (
        <PlatformAdminDangerDialog
          admin={dangerAdmin}
          mode={dangerMode}
          open={Boolean(dangerAdmin)}
          onOpenChange={(open) => {
            if (!open) setDangerAdmin(null);
          }}
        />
      ) : null}
    </div>
  );
}

export default PlatformAdminsList;

