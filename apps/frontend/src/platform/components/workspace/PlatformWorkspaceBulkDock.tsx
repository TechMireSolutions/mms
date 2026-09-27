import React from 'react';
import { CheckCircle2, Ban } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { WorkActionDock } from '@/components/common/work/WorkActionDock';
import { downloadWorkspacesCsv } from '@/platform/components/platformWorkspaceListData';

export interface PlatformWorkspaceBulkDockProps {
  selectedCount: number;
  selectedWorkspaces: PlatformWorkspaceRowData[];
  onClearSelection: () => void;
  onBulkEnable: (workspaces: PlatformWorkspaceRowData[]) => void;
  onBulkDisable: (workspaces: PlatformWorkspaceRowData[]) => void;
  busy?: boolean;
}

export function PlatformWorkspaceBulkDock({
  selectedCount,
  selectedWorkspaces,
  onClearSelection,
  onBulkEnable,
  onBulkDisable,
  busy = false,
}: PlatformWorkspaceBulkDockProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

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
        onExport: () => downloadWorkspacesCsv(selectedWorkspaces),
      }}
      transitions={[
        {
          id: 'bulk-enable',
          label: t('platform.workspaces.enableSelected'),
          icon: CheckCircle2,
          tone: 'secondary',
          disabled: busy,
          className: 'border-success/30 text-success hover:bg-success/10',
          onClick: () => onBulkEnable(selectedWorkspaces),
        },
        {
          id: 'bulk-disable',
          label: t('platform.workspaces.disableSelected'),
          icon: Ban,
          tone: 'destructive',
          disabled: busy,
          onClick: () => onBulkDisable(selectedWorkspaces),
        },
      ]}
    />
  );
}
