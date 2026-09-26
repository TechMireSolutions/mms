import React from 'react';
import { Download, CheckCircle2, Ban } from 'lucide-react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { BulkActionDock } from '@/components/common/BulkActionDock';
import { Button } from '@/components/ui/button';
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadWorkspacesCsv(selectedWorkspaces)}
          className="min-h-11 h-11 px-3 text-xs font-bold gap-1.5 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden />
          <span>{t('platform.workspaces.exportSelected')}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onBulkEnable(selectedWorkspaces)}
          className="min-h-11 h-11 px-3 text-xs font-bold gap-1.5 rounded-xl border-success/30 text-success hover:bg-success/10 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
          <span>{t('platform.workspaces.enableSelected')}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onBulkDisable(selectedWorkspaces)}
          className="min-h-11 h-11 px-3 text-xs font-bold gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          <Ban className="w-3.5 h-3.5" aria-hidden />
          <span>{t('platform.workspaces.disableSelected')}</span>
        </Button>
      </div>
    </BulkActionDock>
  );
}
