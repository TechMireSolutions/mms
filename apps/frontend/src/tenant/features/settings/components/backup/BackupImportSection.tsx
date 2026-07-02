import React from 'react';
import { AlertTriangle, Upload, FileJson } from 'lucide-react';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsCallout } from '@/components/ui/SettingsShell';
import { useTranslation } from '@/hooks/useTranslation';

interface BackupImportSectionProps {
  dragActive: boolean;
  selectedFileName: string | null;
  uploadLimitLabel: string;
  onDragActiveChange: (active: boolean) => void;
  onFileSelected: (file: File | undefined) => void;
}

export default function BackupImportSection({
  dragActive,
  selectedFileName,
  uploadLimitLabel,
  onDragActiveChange,
  onFileSelected,
}: BackupImportSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t('backup.restoreFileTitle')}
      subtitle={t('backup.restoreFileDesc')}
      icon={Upload}
      className="border border-border bg-gradient-to-br from-card to-muted/20 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300"
    >
      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-300" />

      <label
        onDragEnter={(event) => {
          event.preventDefault();
          onDragActiveChange(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          onDragActiveChange(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onDragActiveChange(false);
          onFileSelected(event.dataTransfer?.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-all duration-300 ${
          dragActive
            ? 'border-primary bg-primary/5 shadow-inner scale-[0.99]'
            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 hover:scale-[1.01] shadow-sm'
        }`}
      >
        <div className={`mb-3 p-3 rounded-full transition-colors duration-300 ${dragActive ? 'bg-primary/10' : 'bg-muted group-hover:bg-primary/5'}`}>
          <Upload
            className={`h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 ${dragActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
            aria-hidden
          />
        </div>
        
        <span className="text-sm font-semibold text-foreground text-center px-4">
          {dragActive ? t('backup.dropzoneActive') : t('backup.dropzone')}
        </span>
        <span className="mt-1 text-xs text-muted-foreground text-center px-4">{t('backup.dropzoneHint')}</span>
        <span className="mt-1 text-[10px] font-medium text-muted-foreground/80 bg-muted/50 border border-border/40 px-2 py-0.5 rounded">
          {t('backup.uploadLimitHint', { limit: uploadLimitLabel })}
        </span>
        
        {selectedFileName ? (
          <div className="mt-3 mx-4 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 animate-in fade-in zoom-in duration-200">
            <FileJson className="h-4 w-4 text-primary shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-primary truncate max-w-[200px]">
              {t('backup.fileSelected', { name: selectedFileName })}
            </span>
          </div>
        ) : null}
        
        <input
          type="file"
          accept=".json,.mmsbak,application/json"
          className="hidden"
          onChange={(event) => {
            onFileSelected(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>
      
      <div className="mt-4">
        <SettingsCallout variant="warning">
          <span className="flex items-start gap-2.5 text-xs font-medium leading-relaxed">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 animate-bounce" aria-hidden />
            <span>{t('backup.restoreWarning')}</span>
          </span>
        </SettingsCallout>
      </div>
    </SectionCard>
  );
}
