import React from 'react';
import { ListChecks, ShieldAlert } from 'lucide-react';
import SectionCard from '@/components/ui/SectionCard';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import BackupRestoreConfirmModal from '@/components/settings/BackupRestoreConfirmModal';
import BackupCredentialsModal from '@/components/settings/BackupCredentialsModal';
import BackupClearHistoryModal from '@/components/settings/backup/BackupClearHistoryModal';
import BackupExportSection from '@/components/settings/backup/BackupExportSection';
import BackupHistorySection from '@/components/settings/backup/BackupHistorySection';
import BackupImportSection from '@/components/settings/backup/BackupImportSection';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';
import { useBackupRestore } from '@/hooks/useBackupRestore';
import { usePermissions } from '@/hooks/usePermissions';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import useTranslation from '@/hooks/useTranslation';

/**
 * Full-workspace backup export, validated restore, and local backup history.
 */
export default function BackupRestore(): React.JSX.Element {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { subdomain } = useTenant();
  const { user } = useAuth();
  const isAdmin = can('settings.global.write');
  const adminEmail = user?.email ?? '';

  const backup = useBackupRestore({ subdomain, adminEmail });

  if (!isAdmin) {
    return (
      <SettingsPanel width="medium" introKey="settings.introBackup">
        <SectionCard title={t('backup.adminOnlyTitle')} icon={ShieldAlert}>
          <SettingsCallout variant="warning">{t('backup.adminOnlyDesc')}</SettingsCallout>
        </SectionCard>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introBackup"
      footer={
        <SettingsFormActions
          resetLabel={t('backup.clearHistory')}
          saveLabel={t('global.saveSettings')}
          onReset={() => backup.setClearHistoryOpen(true)}
          showSave={false}
        />
      }
    >
      <SettingsCallout>{t('backup.note')}</SettingsCallout>
      <p className="text-xs text-muted-foreground">{backup.workspaceNote}</p>

      <SectionCard title={t('backup.tipsTitle')} icon={ListChecks} padding={false}>
        <ul className="divide-y divide-border/50">
          {backup.tips.map((tip) => (
            <li key={tip} className="px-5 py-3 text-xs leading-relaxed text-muted-foreground">
              {tip}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <BackupExportSection
          adminEmail={adminEmail}
          isCreating={backup.isCreating}
          lastExportStats={backup.lastExportStats}
          onStartExport={() => backup.setExportModalOpen(true)}
        />
        <BackupImportSection
          dragActive={backup.dragActive}
          selectedFileName={backup.selectedFileName}
          uploadLimitLabel={backup.uploadLimitLabel}
          onDragActiveChange={backup.setDragActive}
          onFileSelected={backup.processImportFile}
        />
      </div>

      <BackupHistorySection
        backups={backup.backups}
        restoreId={backup.restoreId}
        onRestore={backup.openHistoryRestore}
        onDownload={backup.handleDownloadBackup}
      />

      <BackupCredentialsModal
        open={backup.exportModalOpen}
        mode="export"
        adminEmail={adminEmail}
        emailReadOnly
        loading={backup.isCreating}
        onClose={() => backup.setExportModalOpen(false)}
        onSubmit={(password, email) => void backup.runEncryptedExport(password, email)}
      />

      <BackupCredentialsModal
        open={backup.pendingDecrypt !== null}
        mode="decrypt"
        adminEmail={
          backup.pendingDecrypt?.kind === 'file'
            ? backup.pendingDecrypt.adminEmail
            : backup.pendingDecrypt?.kind === 'history'
              ? backup.pendingDecrypt.backup.adminEmail ?? adminEmail
              : adminEmail
        }
        emailReadOnly={
          backup.pendingDecrypt?.kind === 'file' ||
          (backup.pendingDecrypt?.kind === 'history' && Boolean(backup.pendingDecrypt.backup.adminEmail))
        }
        loading={backup.decryptLoading}
        onClose={() => backup.setPendingDecrypt(null)}
        onSubmit={(password, email) => void backup.handleDecryptSubmit(password, email)}
      />

      <BackupRestoreConfirmModal
        open={backup.pendingRestore !== null}
        onClose={() => {
          backup.setPendingRestore(null);
          backup.setSelectedFileName(null);
        }}
        summary={backup.pendingRestore?.summary ?? null}
        confirmPhrase={backup.confirmPhrase}
        restoring={backup.restoreId !== null}
        safetyStep={backup.safetyStep}
        onConfirm={() => {
          if (backup.pendingRestore) void backup.beginRestore(backup.pendingRestore);
        }}
      />

      <BackupClearHistoryModal
        open={backup.clearHistoryOpen}
        onClose={() => backup.setClearHistoryOpen(false)}
        onConfirm={backup.handleClearHistory}
      />
    </SettingsPanel>
  );
}
