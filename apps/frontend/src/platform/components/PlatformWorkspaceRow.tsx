import { memo, useEffect, useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { isApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import WorkspaceLogo from '@/platform/components/WorkspaceLogo';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PlatformWorkspaceDeleteDialog } from '@/platform/components/PlatformWorkspaceDeleteDialog';

interface PlatformWorkspaceRowProps {
  workspace: PlatformWorkspaceRowData;
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  onToggle: (enabled: boolean) => void;
  onDelete: (input: { password: string; confirmSubdomain: string }) => Promise<unknown>;
}

export const PlatformWorkspaceRow = memo(function PlatformWorkspaceRow({
  workspace,
  appDomain,
  togglePending,
  deletePending,
  onToggle,
  onDelete,
}: PlatformWorkspaceRowProps): React.JSX.Element {
  const { t } = useTranslation();
  const tenantLink = tenantUrl(workspace.subdomain, '/');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmSubdomain, setConfirmSubdomain] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const busy = togglePending || deletePending;

  useEffect(() => {
    if (!confirmOpen) {
      setPassword('');
      setConfirmSubdomain('');
      setPasswordError(null);
    }
  }, [confirmOpen]);

  const handleDelete = (): void => {
    if (confirmSubdomain.trim().toLowerCase() !== workspace.subdomain.toLowerCase()) {
      setPasswordError(t('platform.deleteWorkspaceConfirmSubdomainMismatch'));
      return;
    }
    if (!password.trim()) {
      setPasswordError(t('platform.deleteWorkspacePasswordHint'));
      return;
    }
    setPasswordError(null);
    void onDelete({ password, confirmSubdomain: confirmSubdomain.trim() })
      .then(() => setConfirmOpen(false))
      .catch((error: unknown) => {
        if (isApiError(error) && error.type === 'invalid_current_password') {
          setPasswordError(t('platform.profileWrongPassword'));
        }
      });
  };

  return (
    <>
      <motion.li
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="h-full"
      >
        <Card
          accentColor={!workspace.enabled ? 'destructive' : undefined}
          className="p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 h-full text-start"
        >
          <div className="flex items-start gap-4">
            <div className="relative group-hover:scale-105 transition-transform duration-300">
              <WorkspaceLogo
                logoUrl={workspace.logoUrl}
                madrasaName={workspace.madrasaName}
                className="h-12 w-12 rounded-xl border border-border/30"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground truncate">{workspace.madrasaName}</p>
              <p className="text-xs text-muted-foreground font-mono break-all opacity-85">
                {workspace.subdomain}.{appDomain}
              </p>
              {!workspace.enabled ? (
                <div className="mt-1">
                  <StatusBadge
                    status="disabled"
                    config={{
                      disabled: {
                        label: t('platform.workspaceDisabledBadge'),
                        cls: 'bg-destructive/15 text-destructive border-destructive/20',
                      },
                    }}
                    size="sm"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <Label htmlFor={`ws-enabled-${workspace.subdomain}`} className="text-xs text-muted-foreground sr-only">
                  {t('platform.toggleWorkspace', { name: workspace.madrasaName })}
                </Label>
                <Switch
                  id={`ws-enabled-${workspace.subdomain}`}
                  checked={workspace.enabled}
                  disabled={busy}
                  onCheckedChange={onToggle}
                />
              </div>
              <StatusBadge
                status={workspace.enabled ? 'active' : 'inactive'}
                config={{
                  active: {
                    label: t('platform.workspaceActive'),
                    cls: 'bg-success/10 text-success border-success/20',
                  },
                  inactive: {
                    label: t('platform.workspaceInactive'),
                    cls: 'bg-destructive/10 text-destructive border-destructive/20',
                  },
                }}
                size="sm"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
            {workspace.enabled ? (
              <a
                href={tenantLink}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:text-primary/95 transition-colors group/link"
              >
                <ExternalLink
                  className="h-3.5 w-3.5 transition-transform duration-250 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover/link:-translate-x-0.5"
                  aria-hidden
                />
                {t('platform.openWorkspace')}
              </a>
            ) : (
              <div className="w-4 h-4" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className="min-h-11 px-2.5 rounded-lg text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 me-1.5" aria-hidden />
              {t('platform.deleteWorkspace')}
            </Button>
          </div>
        </Card>
      </motion.li>

      <PlatformWorkspaceDeleteDialog
        workspace={workspace}
        appDomain={appDomain}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        password={password}
        onPasswordChange={(value) => {
          setPassword(value);
          if (passwordError) setPasswordError(null);
        }}
        confirmSubdomain={confirmSubdomain}
        onConfirmSubdomainChange={(value) => {
          setConfirmSubdomain(value);
          if (passwordError) setPasswordError(null);
        }}
        passwordError={passwordError}
        deletePending={deletePending}
        onConfirm={handleDelete}
      />
    </>
  );
});
