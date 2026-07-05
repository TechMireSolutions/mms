import React, { useMemo } from 'react';
import { Bell, Lock, Languages } from 'lucide-react';
import {
  APP_LANGUAGES,
  DEFAULT_GLOBAL_SETTINGS,
  formatLanguageSelectLabel,
  getPasswordPolicyHintKey,
  isRtlLanguage,
  normalizeDateFormat,
  normalizePasswordPolicy,
  normalizeSessionTimeout,
  normalizeTimezone,
  parseSessionTimeoutMinutes,
  resolveNotificationChannel,
  SESSION_TIMEOUT_PRESETS,
  type AppLanguageCode,
  type AppTranslationKey,
  type DateFormatId,
  type PasswordPolicyLevel,
} from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsGlobalDraft } from '@/lib/contexts/SettingsGlobalDraftContext';
import { FormSelect } from '@/components/ui/FormSelect';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/SectionCard';
import { SettingsFormActions } from '@/components/ui/SettingsFormActions';
import DateFormatSelect from '@/tenant/features/settings/components/DateFormatSelect';
import EmailIntegrationPanel from '@/tenant/features/settings/components/EmailIntegrationPanel';
import TimezoneSelect from '@/tenant/features/settings/components/TimezoneSelect';
import {
  SettingsCallout,
  SettingsFieldGroup,
  SettingsMetaBadge,
  SettingsPanel,
  SettingsToggleRow,
} from '@/components/ui/SettingsShell';

/**
 * Regional preferences, notifications, and security.
 * Visual theming lives in ThemeSettings (`/settings/theme`).
 */
export default function GlobalSettings(): React.JSX.Element {
  const { t } = useTranslation();

  const {
    data,
    isGlobalDirty,
    saved,
    saving,
    upd,
    handleSaveGlobal,
  } = useSettingsGlobalDraft();

  const notificationChannel = useMemo(
    () => resolveNotificationChannel(data),
    [data],
  );

  const passwordPolicy = normalizePasswordPolicy(data.passwordPolicy);
  const sessionMinutes = parseSessionTimeoutMinutes(data.sessionTimeout);

  const policyLabelKey: Record<PasswordPolicyLevel, AppTranslationKey> = {
    basic: 'global.passwordPolicyBasic',
    medium: 'global.passwordPolicyMedium',
    strong: 'global.passwordPolicyStrong',
  };

  return (
    <SettingsPanel
      width="narrow"
      introKey="settings.introGlobal"
      isDirty={isGlobalDirty}
      saved={saved}
      footer={
        <SettingsFormActions
          saveLabel={t('global.saveSettings')}
          savingLabel={t('global.saving')}
          onSave={() => void handleSaveGlobal()}
          dirty={isGlobalDirty}
          saving={saving}
          saved={saved}
        />
      }
    >
      <SectionCard
        title={t('global.regionalTitle')}
        subtitle={t('global.regionalDesc')}
        icon={Languages}
      >
        <SettingsFieldGroup>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="language">{t('global.language')}</Label>
            <FormSelect
              id="language"
              value={data.language}
              onChange={(next) => {
                upd('language', next as AppLanguageCode);
              }}
              options={APP_LANGUAGES.map((lang) => ({
                value: lang.code,
                label: formatLanguageSelectLabel(lang),
              }))}
            />
            <p className="text-xs text-muted-foreground">
              {isRtlLanguage(data.language) ? t('global.rtlLayout') : t('global.ltrLayout')}
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="timezone">{t('global.timezone')}</Label>
            <TimezoneSelect
              id="timezone"
              value={data.timezone}
              onChange={(v) =>
                upd('timezone', normalizeTimezone(v, DEFAULT_GLOBAL_SETTINGS.timezone))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dateFormat">{t('global.dateFormat')}</Label>
            <DateFormatSelect
              id="dateFormat"
              value={data.dateFormat}
              language={data.language}
              onChange={(v) =>
                upd(
                  'dateFormat',
                  normalizeDateFormat(v, DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId),
                )
              }
            />
            <p className="text-xs text-muted-foreground">{t('global.dateFormatNote')}</p>
          </div>
        </SettingsFieldGroup>
        <div className="mt-4">
          <SettingsCallout>{t('global.timezoneNote')}</SettingsCallout>
        </div>
      </SectionCard>

      <SectionCard title={t('global.notifications')} subtitle={t('global.notificationsDesc')} icon={Bell}>
        <div className="space-y-3">
          <SettingsCallout>{t('global.notificationsNote')}</SettingsCallout>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium" aria-live="polite">
            <span className="text-muted-foreground">{t('global.notificationsActiveChannel')}:</span>
            {notificationChannel === 'email' && (
              <SettingsMetaBadge variant="primary">{t('global.notificationsChannelEmail')}</SettingsMetaBadge>
            )}
            {notificationChannel === 'sms' && (
              <SettingsMetaBadge variant="primary">{t('global.notificationsChannelSms')}</SettingsMetaBadge>
            )}
            {notificationChannel === 'none' && (
              <SettingsMetaBadge variant="warning">{t('global.notificationsChannelNone')}</SettingsMetaBadge>
            )}
          </div>
          <SettingsToggleRow
            id="emailNotifications"
            label={t('global.emailNotifications')}
            description={t('global.emailNotificationsDesc')}
            checked={Boolean(data.emailNotifications)}
            onCheckedChange={(v) => upd('emailNotifications', v)}
          />
          <SettingsToggleRow
            id="smsNotifications"
            label={t('global.smsNotifications')}
            description={t('global.smsNotificationsDesc')}
            checked={Boolean(data.smsNotifications)}
            onCheckedChange={(v) => upd('smsNotifications', v)}
          />
          <EmailIntegrationPanel emailNotificationsEnabled={Boolean(data.emailNotifications)} />
        </div>
      </SectionCard>

      <SectionCard title={t('global.security')} subtitle={t('global.securityDesc')} icon={Lock}>
        <div className="space-y-4">
          <SettingsCallout>{t('global.securityNote')}</SettingsCallout>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium" aria-live="polite">
            <span className="text-muted-foreground">{t('global.securityActiveConfig')}:</span>
            <SettingsMetaBadge variant={data.twoFactor ? 'primary' : 'muted'}>
              {data.twoFactor ? t('global.security2faOn') : t('global.security2faOff')}
            </SettingsMetaBadge>
            <SettingsMetaBadge variant="muted">
              {t('global.securitySessionBadge', { minutes: sessionMinutes })}
            </SettingsMetaBadge>
            <SettingsMetaBadge variant="muted">{t(policyLabelKey[passwordPolicy])}</SettingsMetaBadge>
          </div>
          <SettingsToggleRow
            id="twoFactor"
            label={t('global.twoFactor')}
            description={t('global.twoFactorDesc')}
            checked={Boolean(data.twoFactor)}
            onCheckedChange={(v) => upd('twoFactor', v)}
          />
          <SettingsFieldGroup>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">{t('global.sessionTimeout')}</Label>
              <FormSelect
                id="sessionTimeout"
                value={normalizeSessionTimeout(data.sessionTimeout)}
                onChange={(v) => upd('sessionTimeout', normalizeSessionTimeout(v))}
                options={SESSION_TIMEOUT_PRESETS.map((preset) => ({
                  value: preset.value,
                  label: t(preset.labelKey),
                }))}
              />
              <p className="text-xs text-muted-foreground">{t('global.sessionTimeoutNote')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">{t('global.passwordPolicy')}</Label>
              <FormSelect
                id="passwordPolicy"
                value={passwordPolicy}
                onChange={(v) => upd('passwordPolicy', normalizePasswordPolicy(v))}
                options={[
                  { value: 'basic', label: t('global.passwordPolicyBasic') },
                  { value: 'medium', label: t('global.passwordPolicyMedium') },
                  { value: 'strong', label: t('global.passwordPolicyStrong') },
                ]}
              />
              <p className="text-xs text-muted-foreground">
                {t(getPasswordPolicyHintKey(passwordPolicy))}
              </p>
              <p className="text-xs text-muted-foreground">{t('global.passwordPolicyNote')}</p>
            </div>
          </SettingsFieldGroup>
        </div>
      </SectionCard>
    </SettingsPanel>
  );
}