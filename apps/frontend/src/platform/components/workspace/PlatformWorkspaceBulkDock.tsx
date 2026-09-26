import React from 'react';
import { CheckCircle2, Ban } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { BulkActionDock, BulkSelectionExportAction } from '@/components/common/BulkActionDock';
import { ActionButton } from '@/components/ui/ActionButton';
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
    <BulkActionDock
      selectedCount={selectedCount}
      countLabel={t('platform.workspaces.selectedCount', { count: selectedCount })}
      onClearSelection={onClearSelection}
      clearLabel={t('common.deselect')}
      placement="floating"
      tone="glass"
      className="z-elevated"
    >
      <div className="flex items-center gap-2">
        <BulkSelectionExportAction
          label={t('platform.workspaces.exportSelected')}
          onClick={() => downloadWorkspacesCsv(selectedWorkspaces)}
        />

        <ActionButton
          variant="secondary"
          size="sm"
          icon={CheckCircle2}
          disabled={busy}
          className="border-success/30 text-success hover:bg-success/10"
          onClick={() => onBulkEnable(selectedWorkspaces)}
        >
          {t('platform.workspaces.enableSelected')}
        </ActionButton>

        <ActionButton
          variant="danger"
          size="sm"
          icon={Ban}
          disabled={busy}
          onClick={() => onBulkDisable(selectedWorkspaces)}
        >
          {t('platform.workspaces.disableSelected')}
        </ActionButton>
      </div>
    </BulkActionDock>
  );
}
