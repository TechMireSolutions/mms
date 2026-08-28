import React from 'react';
import { Blocks, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

interface WorkspaceRowActionsProps {
  subdomain: string;
  enabled: boolean;
  requireEmailVerification?: boolean;
  busy: boolean;
  deletePending: boolean;
  tenantLink: string;
  onToggle: (enabled: boolean) => void;
  onToggleEmailVerification?: (requireEmailVerification: boolean) => void;
  onOpenModules: () => void;
  onOpenDelete: () => void;
}

export function WorkspaceRowActions({
  subdomain,
  enabled,
  requireEmailVerification,
  busy,
  tenantLink,
  onToggle,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: WorkspaceRowActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
      <div className="flex flex-wrap items-center gap-5 min-h-11">
        <div className="flex items-center gap-2.5">
          <Switch
            id={`toggle-${subdomain}`}
            checked={enabled}
            disabled={busy}
            onCheckedChange={onToggle}
            aria-label={t('platform.workspaceActive')}
            className="scale-105"
          />
          <Label
            htmlFor={`toggle-${subdomain}`}
            className="text-xs font-bold text-muted-foreground cursor-pointer select-none"
          >
            {enabled ? t('platform.workspaceActive') : t('platform.workspaceInactive')}
          </Label>
        </div>

        {onToggleEmailVerification && (
          <div className="flex items-center gap-2.5">
            <Switch
              id={`toggle-verify-${subdomain}`}
              checked={Boolean(requireEmailVerification)}
              disabled={busy}
              onCheckedChange={onToggleEmailVerification}
              aria-label={t('platform.emailVerification')}
              className="scale-105"
            />
            <Label
              htmlFor={`toggle-verify-${subdomain}`}
              className="text-xs font-bold text-muted-foreground cursor-pointer select-none"
            >
              {requireEmailVerification
                ? t('platform.emailVerificationRequired')
                : t('platform.emailVerificationOptional')}
            </Label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="min-h-11 px-3.5 text-xs font-bold gap-1.5 rounded-xl flex-1 sm:flex-initial justify-center shadow-xs"
        >
          <a href={tenantLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            {t('platform.openWorkspace')}
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onOpenModules}
          className="min-h-11 min-w-11 h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          title={t('platform.modulesTitle')}
          aria-label={t('platform.modulesTitle')}
        >
          <Blocks className="w-4 h-4" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onOpenDelete}
          className="min-h-11 min-w-11 h-11 w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
          title={t('platform.deleteWorkspace')}
          aria-label={t('platform.deleteWorkspace')}
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
