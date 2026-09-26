import React from 'react';
import { Shield, Building2, UserPlus, Settings, ShieldCheck, Server, Sparkles, CheckCheck, XCircle } from 'lucide-react';
import type { PlatformAdminPermissions } from '@mms/shared';
import { ActionButton } from '@/components/ui/ActionButton';
import { useTranslation } from '@/hooks/useTranslation';
import { PlatformPermissionCheckboxItem } from '@/platform/components/admin/PlatformPermissionCheckboxItem';

interface PlatformAdminPermissionsFieldsProps {
  value: PlatformAdminPermissions;
  onChange: (next: PlatformAdminPermissions) => void;
  disabled?: boolean;
}

/** Modern grantable-permission checkboxes with capability badges, archetype presets, and accessibility helpers. */
export function PlatformAdminPermissionsFields({
  value,
  onChange,
  disabled = false,
}: PlatformAdminPermissionsFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  const setAll = (enabled: boolean) => {
    onChange({
      workspaces: enabled,
      onboard: enabled,
      settings: enabled,
      admins: enabled,
      system: enabled,
    });
  };

  const setOperations = () => {
    onChange({
      workspaces: true,
      onboard: true,
      settings: false,
      admins: false,
      system: false,
    });
  };

  return (
    <fieldset className="space-y-4 rounded-2xl border border-border/50 bg-card/40 p-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <legend className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" aria-hidden />
          {t('platform.adminPermissionsLabel')}
        </legend>

        <div className="flex flex-wrap items-center gap-1.5">
          <ActionButton
            variant="secondary"
            size="sm"
            icon={CheckCheck}
            disabled={disabled}
            onClick={() => setAll(true)}
          >
            {t('contacts.table.selectAll')}
          </ActionButton>
          <ActionButton
            variant="secondary"
            size="sm"
            icon={Sparkles}
            disabled={disabled}
            onClick={setOperations}
          >
            {t('platform.permWorkspaces')}
          </ActionButton>
          <ActionButton
            variant="ghost"
            size="sm"
            icon={XCircle}
            disabled={disabled}
            onClick={() => setAll(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('common.deselect')}
          </ActionButton>
        </div>
      </div>

      <PlatformPermissionCheckboxItem
        name="permWorkspaces"
        label={t('platform.permWorkspaces')}
        description={t('platform.permWorkspacesDesc')}
        icon={Building2}
        checked={value.workspaces}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, workspaces: checked })}
      />

      <PlatformPermissionCheckboxItem
        name="permOnboard"
        label={t('platform.permOnboard')}
        description={t('platform.permOnboardDesc')}
        icon={UserPlus}
        checked={value.onboard}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, onboard: checked })}
      />

      <PlatformPermissionCheckboxItem
        name="permSettings"
        label={t('platform.permSettings')}
        description={t('platform.permSettingsDesc')}
        icon={Settings}
        checked={value.settings}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, settings: checked })}
      />

      <PlatformPermissionCheckboxItem
        name="permAdmins"
        label={t('platform.permAdmins')}
        description={t('platform.permAdminsDesc')}
        icon={ShieldCheck}
        checked={value.admins}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, admins: checked })}
      />

      <PlatformPermissionCheckboxItem
        name="permSystem"
        label={t('platform.permSystem')}
        description={t('platform.permSystemDesc')}
        icon={Server}
        checked={value.system}
        disabled={disabled}
        onChange={(checked) => onChange({ ...value, system: checked })}
      />
    </fieldset>
  );
}
