import React from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import { SettingsCallout } from '@/components/ui/SettingsShell';
import useTranslation from '@/hooks/useTranslation';

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
    <SectionCard title={t('backup.restoreFileTitle')} subtitle={t('backup.restoreFileDesc')} icon={Upload}>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          onDragActiveChange(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          onDragActiveChange(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDragActiveChange(false);
          onFileSelected(e.dataTransfer?.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20'
        }`}
      >
        <Upload
          className={`mb-2 h-7 w-7 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
          aria-hidden
        />
        <span className="text-sm font-semibold text-foreground">
          {dragActive ? t('backup.dropzoneActive') : t('backup.dropzone')}
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">{t('backup.dropzoneHint')}</span>
        <span className="mt-1 text-[11px] text-muted-foreground">
          {t('backup.uploadLimitHint', { limit: uploadLimitLabel })}
        </span>
        {selectedFileName ? (
          <span className="mt-2 text-xs font-medium text-primary">
            {t('backup.fileSelected', { name: selectedFileName })}
          </span>
        ) : null}
        <input
          type="file"
          accept=".json,.mmsbak,application/json"
          className="hidden"
          onChange={(e) => {
            onFileSelected(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      <div className="mt-4">
        <SettingsCallout variant="warning">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('backup.restoreWarning')}
          </span>
        </SettingsCallout>
      </div>
    </SectionCard>
  );
}
