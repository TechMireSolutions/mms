import React from 'react';
import { Shield, Building2, UserPlus } from 'lucide-react';
import type { PlatformAdminPermissions } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';

interface PlatformAdminPermissionsFieldsProps {
  value: PlatformAdminPermissions;
  onChange: (next: PlatformAdminPermissions) => void;
  disabled?: boolean;
}

/** Modern grantable-permission checkboxes with capability badges and accessibility helpers. */
export function PlatformAdminPermissionsFields({
  value,
  onChange,
  disabled = false,
}: PlatformAdminPermissionsFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspacesId = React.useId();
  const onboardId = React.useId();

  return (
    <fieldset className="space-y-3 rounded-2xl border border-border/50 bg-card/40 p-4 transition-all">
      <legend className="px-1 text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-primary" aria-hidden />
        {t('platform.adminPermissionsLabel')}
      </legend>

      {/* 1. Workspaces Capability */}
      <label
        htmlFor={workspacesId}
        className={cn(
          'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
          value.workspaces && 'border-primary/40 bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
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
        <div className="flex-1 min-w-0 text-start space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="text-xs font-bold text-foreground">{t('platform.permWorkspaces')}</span>
            <span className={cn('ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', value.workspaces ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground')}>
              {value.workspaces ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
            </span>
          </div>
          <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
            {t('platform.permWorkspacesDesc')}
          </p>
        </div>
      </label>

      {/* 2. Onboarding Capability */}
      <label
        htmlFor={onboardId}
        className={cn(
          'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
          value.onboard && 'border-primary/40 bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
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
        <div className="flex-1 min-w-0 text-start space-y-1">
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="text-xs font-bold text-foreground">{t('platform.permOnboard')}</span>
            <span className={cn('ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', value.onboard ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground')}>
              {value.onboard ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
            </span>
          </div>
          <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
            {t('platform.permOnboardDesc')}
          </p>
        </div>
      </label>
    </fieldset>
  );
}
