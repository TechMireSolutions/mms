import React, { useState, useDeferredValue, useMemo } from 'react';
import { ShieldCheck, Download, Mail } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { DETAIL_SECTION_TITLE } from '@/components/ui/formStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformEditAdminAccessDialog } from '@/platform/components/PlatformEditAdminAccessDialog';
import { PlatformAdminDangerDialog } from '@/platform/components/PlatformAdminDangerDialog';
import { triggerFileDownload } from '@/lib/download';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { PlatformAdminsListCards } from '@/platform/components/admin/PlatformAdminsListCards';
import { PlatformAdminStatusBadges, PlatformAdminPermissionsBadges } from '@/platform/components/admin/PlatformAdminBadges';
import { PlatformAdminActionButtons } from '@/platform/components/admin/PlatformAdminActionButtons';
import { DetailSheet } from '@/components/common/DetailSheet';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import { useVerifyPlatformAdminEmail } from '@/platform/hooks/usePlatformAdmins';
import { formatDate } from '@mms/shared';
import { usePlatformUserDescriptor } from '@/platform/hooks/usePlatformUserDescriptor';

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
  const descriptor = usePlatformUserDescriptor();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredItems = useMemo(() => {
    if (!deferredQuery.trim()) return rawItems;
    const q = deferredQuery.trim().toLowerCase();
    return rawItems.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q),
    );
  }, [rawItems, deferredQuery]);

  const handleExportCsv = () => {
    if (filteredItems.length === 0) return;
    const columns = descriptor.getTableColumns();
    const headers = ['ID', ...columns.map((c) => c.label)];
    const rows = filteredItems.map((admin) => [
      admin.id,
      ...columns.map((col) => descriptor.formatFieldValue(col.id, admin)),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `platform-admins-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="lg:col-span-2 space-y-4 text-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className={DETAIL_SECTION_TITLE}>
          {t('platform.manageAdmins')} ({rawItems.length})
        </h2>
      </div>

      <ModuleWorkToolbar
        regionLabel={t('platform.manageAdmins')}
        shownCountLabel={`${filteredItems.length} of ${rawItems.length}`}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('platform.searchAdminsPlaceholder')}
        searchId="platform-admins-search"
        hasActiveFilters={Boolean(searchQuery)}
        onClearFilters={() => setSearchQuery('')}
        clearFiltersLabel={t('common.clearFilters')}
        viewModeToggle={{
          viewMode,
          onViewModeChange: setViewMode,
        }}
        primaryAction={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
            className="min-h-11 h-11 px-3.5 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-muted/80 shrink-0 cursor-pointer"
            title={t('platform.exportAdminsCsv')}
          >
            <Download className="w-3.5 h-3.5" aria-hidden />
            {t('platform.exportAdminsCsv')}
          </Button>
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
              title={searchQuery ? t('platform.noMatchingAdmins') : t('platform.noAdmins')}
              action={
                searchQuery ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="min-h-11 h-11 px-4 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {t('common.clearFilters')}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === 'table' ? (
          <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
            <Table>
              <ModuleWorkTableHeader
                columns={descriptor.getTableColumns().map(col => ({
                  id: col.id,
                  label: col.label,
                  sortField: col.id,
                  headerClassName: col.id === "name" ? "" : "w-40",
                }))}
                getColumnWidth={() => undefined}
                setColumnWidth={() => {}}
                actionsLabel={t('common.actions')}
              />
              <TableBody className="divide-y divide-border/50">
                {filteredItems.map((admin) => (
                  <TableRow
                    key={admin.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setInspectAdmin(admin)}
                  >
                    <TableCell className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <p className="font-bold text-foreground">{admin.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" aria-hidden />
                          <span dir="ltr">{admin.email}</span>
                        </div>
                        {admin.createdAt ? (
                          <p className="text-2xs text-muted-foreground font-semibold mt-1">
                            {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top">
                      <PlatformAdminStatusBadges admin={admin} />
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top">
                      <PlatformAdminPermissionsBadges admin={admin} />
                    </TableCell>
                    <TableCell className="px-4 py-3 align-top text-end" onClick={(e) => e.stopPropagation()}>
                      <PlatformAdminActionButtons
                        admin={admin}
                        onEditAccess={(a) => setEditingAdmin(a)}
                        onToggleStatus={(a, mode) => openDanger(a, mode)}
                        onDelete={(a) => openDanger(a, 'delete')}
                        verifyPending={verifyEmailMutation.isPending}
                        onVerifyEmail={(adminId) => verifyEmailMutation.mutate(adminId)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <PlatformAdminsListCards
            admins={filteredItems}
            descriptor={descriptor}
            onInspect={setInspectAdmin}
            onEditAccess={(a) => setEditingAdmin(a)}
            onToggleStatus={(a, mode) => openDanger(a, mode)}
            onDelete={(a) => openDanger(a, 'delete')}
            verifyPending={verifyEmailMutation.isPending}
            onVerifyEmail={(adminId) => verifyEmailMutation.mutate(adminId)}
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

      <DetailSheet<PlatformUserProfile>
        open={Boolean(inspectAdmin)}
        onClose={() => setInspectAdmin(null)}
        entityType="platformUsers"
        descriptor={descriptor}
        entity={inspectAdmin ?? undefined}
        title={inspectAdmin?.name ?? "Admin"}
      />
    </div>
  );
}

