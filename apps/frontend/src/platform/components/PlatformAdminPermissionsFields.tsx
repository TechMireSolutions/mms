import React from 'react';
import type { PlatformAdminPermissions } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';

interface PlatformAdminPermissionsFieldsProps {
  value: PlatformAdminPermissions;
  onChange: (next: PlatformAdminPermissions) => void;
  disabled?: boolean;
}

/** Shared grantable-permission checkboxes for create/edit admin flows. */
export function PlatformAdminPermissionsFields({
  value,
  onChange,
  disabled = false,
}: PlatformAdminPermissionsFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspacesId = React.useId();
  const onboardId = React.useId();

  return (
    <fieldset className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
      <legend className={`${FORM_LABEL} px-1`}>{t('platform.adminPermissionsLabel')}</legend>

      <label htmlFor={workspacesId} className="flex min-h-11 cursor-pointer items-start gap-3">
        <Checkbox
          id={workspacesId}
          name="permWorkspaces"
          checked={value.workspaces}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, workspaces: checked === true })
          }
          className="mt-1"
        />
        <span className="space-y-0.5 text-start">
          <span className="block text-sm font-semibold text-foreground">{t('platform.permWorkspaces')}</span>
          <span className="block text-xs text-muted-foreground">{t('platform.permWorkspacesDesc')}</span>
        </span>
      </label>

      <label htmlFor={onboardId} className="flex min-h-11 cursor-pointer items-start gap-3">
        <Checkbox
          id={onboardId}
          name="permOnboard"
          checked={value.onboard}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, onboard: checked === true })
          }
          className="mt-1"
        />
        <span className="space-y-0.5 text-start">
          <span className="block text-sm font-semibold text-foreground">{t('platform.permOnboard')}</span>
          <span className="block text-xs text-muted-foreground">{t('platform.permOnboardDesc')}</span>
        </span>
      </label>
    </fieldset>
  );
}
