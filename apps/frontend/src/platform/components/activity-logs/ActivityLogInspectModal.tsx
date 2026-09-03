import React from 'react';
import { Code2 } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { CopyBtn } from '@/components/ui/CopyBtn';
import type { PlatformActivityLogItem } from '@/platform/hooks/usePlatformActivityLogs';

interface ActivityLogInspectModalProps {
  log: PlatformActivityLogItem | null;
  onClose: () => void;
}

export function ActivityLogInspectModal({ log, onClose }: ActivityLogInspectModalProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!log) return null;

  return (
    <Modal
      open={Boolean(log)}
      onClose={onClose}
      title={t('platform.logs.inspectJson')}
      subtitle={`${log.action} — ${formatDate(log.createdAt)}`}
      icon={Code2}
      size="lg"
    >
      <div className="space-y-4 pt-2 text-start">
        <div className="relative rounded-xl border border-border/60 bg-muted/60 p-4 font-mono text-xs overflow-x-auto max-h-80 select-all">
          <pre>{JSON.stringify(log, null, 2)}</pre>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-2xs text-muted-foreground font-mono">ID: {log.id}</span>
          <CopyBtn
            text={JSON.stringify(log, null, 2)}
            label={t('platform.logs.copyJson')}
            labelCopied={t('platform.logs.copied')}
            variant="outline"
          />
        </div>
      </div>
    </Modal>
  );
}
