import React, { useState } from 'react';
import { Code2, Check, Copy } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import type { PlatformActivityLogItem } from '@/platform/hooks/usePlatformActivityLogs';

interface ActivityLogInspectModalProps {
  log: PlatformActivityLogItem | null;
  onClose: () => void;
}

export function ActivityLogInspectModal({ log, onClose }: ActivityLogInspectModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('platform.logs.copied') : t('platform.logs.copyJson')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
