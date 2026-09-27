import React from 'react';
import { CheckCircle2, Ban } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { WorkActionDock } from '@/components/common/work/WorkActionDock';

export interface PlatformAdminBulkDockProps {
  selectedCount: number;
  selectedAdmins: PlatformUserProfile[];
  onClearSelection: () => void;
  onBulkExport: () => void;
  onBulkEnable?: (admins: PlatformUserProfile[]) => void;
  onBulkDisable?: (admins: PlatformUserProfile[]) => void;
  busy?: boolean;
}

export function PlatformAdminBulkDock({
  selectedCount,
  selectedAdmins,
  onClearSelection,
  onBulkExport,
  onBulkEnable,
  onBulkDisable,
  busy = false,
}: PlatformAdminBulkDockProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  const transitions = [];
  if (onBulkEnable) {
    transitions.push({
      id: 'bulk-enable',
      label: t('platform.enableAdminConfirm'),
      icon: CheckCircle2,
      tone: 'secondary' as const,
      disabled: busy,
      className: 'border-success/30 text-success hover:bg-success/10',
      onClick: () => onBulkEnable(selectedAdmins),
    });
  }
  if (onBulkDisable) {
    transitions.push({
      id: 'bulk-disable',
      label: t('platform.disableAdminConfirm'),
      icon: Ban,
      tone: 'destructive' as const,
      disabled: busy,
      onClick: () => onBulkDisable(selectedAdmins),
    });
  }

  return (
    <WorkActionDock
      selectedCount={selectedCount}
      countLabel={t('platform.workspaces.selectedCount', { count: selectedCount })}
      onClearSelection={onClearSelection}
      clearLabel={t('common.deselect')}
      placement="floating"
      tone="glass"
      className="z-elevated"
      exportAction={{
        label: t('platform.workspaces.exportSelected'),
        onExport: onBulkExport,
      }}
      transitions={transitions}
    />
  );
}
