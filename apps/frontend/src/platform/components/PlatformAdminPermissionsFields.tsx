import React, { useId } from 'react';
import { Shield, Building2, UserPlus, Settings, ShieldCheck, Server, Sparkles, CheckCheck, XCircle } from 'lucide-react';
import type { PlatformAdminPermissions } from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { cn } from '@/lib/utils';

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
  const workspacesId = useId();
  const onboardId = useId();
  const settingsId = useId();
  const adminsId = useId();
  const systemId = useId();

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setAll(true)}
            className="min-h-8 h-8 px-2 text-3xs font-bold rounded-lg border-border/60 hover:bg-primary/10 hover:text-primary gap-1"
          >
            <CheckCheck className="w-3 h-3 text-primary" aria-hidden />
            {t('contacts.table.selectAll')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={setOperations}
            className="min-h-8 h-8 px-2 text-3xs font-bold rounded-lg border-border/60 hover:bg-primary/10 hover:text-primary gap-1"
          >
            <Sparkles className="w-3 h-3 text-primary" aria-hidden />
            {t('platform.permWorkspaces')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => setAll(false)}
            className="min-h-8 h-8 px-2 text-3xs font-semibold rounded-lg text-muted-foreground hover:text-foreground gap-1"
          >
            <XCircle className="w-3 h-3" aria-hidden />
            {t('common.deselect')}
          </Button>
        </div>
      </div>

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

      {/* 3. Global Settings Capability */}
      <label
        htmlFor={settingsId}
        className={cn(
          'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
          value.settings && 'border-primary/40 bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Checkbox
          id={settingsId}
          name="permSettings"
          checked={value.settings}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, settings: checked === true })
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0 text-start space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="text-xs font-bold text-foreground">{t('platform.permSettings')}</span>
            <span className={cn('ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', value.settings ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground')}>
              {value.settings ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
            </span>
          </div>
          <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
            {t('platform.permSettingsDesc')}
          </p>
        </div>
      </label>

      {/* 4. Manage Admins Capability */}
      <label
        htmlFor={adminsId}
        className={cn(
          'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
          value.admins && 'border-primary/40 bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Checkbox
          id={adminsId}
          name="permAdmins"
          checked={value.admins}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, admins: checked === true })
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0 text-start space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="text-xs font-bold text-foreground">{t('platform.permAdmins')}</span>
            <span className={cn('ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', value.admins ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground')}>
              {value.admins ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
            </span>
          </div>
          <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
            {t('platform.permAdminsDesc')}
          </p>
        </div>
      </label>

      {/* 5. System Maintenance & Logs Capability */}
      <label
        htmlFor={systemId}
        className={cn(
          'flex min-h-12 cursor-pointer items-start gap-3.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-accent/20 transition-all select-none',
          value.system && 'border-primary/40 bg-primary/5',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Checkbox
          id={systemId}
          name="permSystem"
          checked={value.system}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onChange({ ...value, system: checked === true })
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0 text-start space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
            <span className="text-xs font-bold text-foreground">{t('platform.permSystem')}</span>
            <span className={cn('ms-auto text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', value.system ? SEMANTIC_BADGE.success : 'bg-muted text-muted-foreground')}>
              {value.system ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
            </span>
          </div>
          <p className="text-3xs font-medium text-muted-foreground leading-relaxed">
            {t('platform.permSystemDesc')}
          </p>
        </div>
      </label>
    </fieldset>
  );
}
