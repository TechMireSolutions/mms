import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { DETAIL_SECTION_TITLE } from '@/components/ui/formStyles';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleWorkListStateShell } from '@/components/ui/ModuleWorkListStateShell';
import { PlatformEditAdminAccessDialog } from '@/platform/components/PlatformEditAdminAccessDialog';
import { PlatformAdminDangerDialog } from '@/platform/components/PlatformAdminDangerDialog';
import { PlatformAdminTable } from '@/platform/components/admin/PlatformAdminTable';
import { PlatformAdminCards } from '@/platform/components/admin/PlatformAdminCards';

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
  const [editingAdmin, setEditingAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerAdmin, setDangerAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerMode, setDangerMode] = useState<DangerMode>('disable');

  const openDanger = (admin: PlatformUserProfile, mode: DangerMode): void => {
    setDangerAdmin(admin);
    setDangerMode(mode);
  };

  const items = admins ?? [];

  return (
    <div className="lg:col-span-2 space-y-4 text-start">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className={DETAIL_SECTION_TITLE}>
          {t('platform.manageAdmins')}
        </h2>
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
        {items.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-xl p-6">
            <EmptyState
              icon={ShieldCheck}
              title={t('platform.noAdmins')}
            />
          </div>
        ) : viewMode === 'table' ? (
          <PlatformAdminTable
            admins={items}
            onEditAccess={(a) => setEditingAdmin(a)}
            onToggleStatus={(a, mode) => openDanger(a, mode)}
            onDelete={(a) => openDanger(a, 'delete')}
          />
        ) : (
          <PlatformAdminCards
            admins={items}
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
