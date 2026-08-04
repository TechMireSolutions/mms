import React from 'react';
import { Loader2, Mail, PlugZap } from 'lucide-react';
import { type AppTranslationKey, type EmailProviderId } from '@mms/shared';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { SettingsCallout, SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useEmailIntegrationPanel } from '@/tenant/features/settings/components/useEmailIntegrationPanel';

interface EmailIntegrationPanelProps {
  emailNotificationsEnabled: boolean;
}

/**
 * Multi-provider SMTP setup (Gmail, Microsoft 365, Outlook, Yahoo, iCloud, Zoho, custom).
 */
export default function EmailIntegrationPanel({
  emailNotificationsEnabled,
}: EmailIntegrationPanelProps): React.JSX.Element {
  const {
    t,
    providers,
    loading,
    saving,
    testing,
    form,
    smtpPassword,
    setSmtpPassword,
    selectedPreset,
    isCustom,
    setField,
    handleSave,
    handleTest,
  } = useEmailIntegrationPanel();

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t('email.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-4 w-4 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t('email.integrationTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('email.integrationDesc')}</p>
        </div>
        {form.connected && form.lastTestOk ? (
          <SettingsMetaBadge variant="success">{t('email.statusConnected')}</SettingsMetaBadge>
        ) : (
          <SettingsMetaBadge variant="muted">{t('email.statusNotConnected')}</SettingsMetaBadge>
        )}
      </div>

      <SettingsCallout variant={emailNotificationsEnabled ? 'info' : 'warning'}>
        {emailNotificationsEnabled ? t('email.separateSaveNote') : t('email.disabledNote')}
      </SettingsCallout>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email-provider">{t('email.provider')}</Label>
          <FormSelect
            id="email-provider"
            value={form.providerId}
            onChange={(v) => setField('providerId', v as EmailProviderId)}
            options={providers.map((preset) => ({
              value: preset.id,
              label: t(preset.labelKey as AppTranslationKey),
            }))}
          />
          <p className="text-xs text-muted-foreground">
            {t(selectedPreset.hintKey as AppTranslationKey)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-from-name">{t('email.fromName')}</Label>
          <Input
            id="email-from-name"
            value={form.fromName}
            onChange={(event) => setField('fromName', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-from-address">{t('email.fromAddress')}</Label>
          <Input
            id="email-from-address"
            type="email"
            value={form.fromAddress}
            onChange={(event) => setField('fromAddress', event.target.value)}
            placeholder={`admin@${selectedPreset.exampleDomain}`}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email-smtp-username">{t('email.smtpUsername')}</Label>
          <Input
            id="email-smtp-username"
            value={form.smtpUsername}
            onChange={(event) => setField('smtpUsername', event.target.value)}
            placeholder={`you@${selectedPreset.exampleDomain}`}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email-smtp-password">{t('email.smtpPassword')}</Label>
          <Input
            id="email-smtp-password"
            type="password"
            value={smtpPassword}
            onChange={(event) => setSmtpPassword(event.target.value)}
            placeholder={
              form.hasCredentials ? t('email.smtpPasswordPlaceholderSaved') : t('email.smtpPasswordPlaceholder')
            }
            autoComplete="new-password"
          />
        </div>

        {isCustom && (
          <>
            <div className="space-y-2">
              <Label htmlFor="email-smtp-host">{t('email.smtpHost')}</Label>
              <Input
                id="email-smtp-host"
                value={form.smtpHost ?? ''}
                onChange={(event) => setField('smtpHost', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-smtp-port">{t('email.smtpPort')}</Label>
              <Input
                id="email-smtp-port"
                type="number"
                value={form.smtpPort ?? 587}
                onChange={(event) => setField('smtpPort', Number(event.target.value))}
              />
            </div>
          </>
        )}
      </div>

      {form.lastError && !form.lastTestOk ? (
        <FieldErrorMessage message={form.lastError} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handleSave()} disabled={saving || testing}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlugZap className="h-4 w-4" aria-hidden />}
          {t('email.saveConnection')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleTest()}
          disabled={saving || testing || !emailNotificationsEnabled}
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {t('email.sendTest')}
        </Button>
      </div>
    </div>
  );
}
