import React from 'react';
import { Database, Download, RefreshCw } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import useTranslation from '@/hooks/useTranslation';

interface BackupExportSectionProps {
  adminEmail: string;
  isCreating: boolean;
  lastExportStats: string | null;
  onStartExport: () => void;
}

export default function BackupExportSection({
  adminEmail,
  isCreating,
  lastExportStats,
  onStartExport,
}: BackupExportSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard title={t('backup.createTitle')} subtitle={t('backup.createDesc')} icon={Database}>
      <div className="space-y-3">
        <Button
          type="button"
          onClick={onStartExport}
          disabled={isCreating || !adminEmail}
          className="gap-2"
        >
          {isCreating ? (
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          {isCreating ? t('backup.creating') : t('backup.createButton')}
        </Button>
        {lastExportStats ? <p className="text-xs text-muted-foreground">{lastExportStats}</p> : null}
      </div>
    </SectionCard>
  );
}
