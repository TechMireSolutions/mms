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
    <SectionCard
      title={t('backup.createTitle')}
      subtitle={t('backup.createDesc')}
      icon={Database}
      className="border border-border bg-gradient-to-br from-card to-muted/20 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-300" />
      
      <div className="space-y-4 relative z-10 pt-1">
        <Button
          type="button"
          onClick={onStartExport}
          disabled={isCreating || !adminEmail}
          className="gap-2.5 min-h-[42px] px-5 bg-primary hover:bg-primary/95 text-primary-foreground transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {isCreating ? (
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-y-0.5" aria-hidden />
          )}
          <span className="font-semibold text-sm">
            {isCreating ? t('backup.creating') : t('backup.createButton')}
          </span>
        </Button>
        {lastExportStats ? (
          <div className="rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shrink-0" />
            <span>{lastExportStats}</span>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
