import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate, type PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { WorkspaceIdentityCell } from '@/platform/components/workspace/WorkspaceIdentityCell';
import { WorkspaceStatusBadge } from '@/platform/components/workspace/WorkspaceStatusBadge';
import { WorkspaceRowActions } from '@/platform/components/workspace/WorkspaceRowActions';
import { cn } from '@/lib/utils';

export interface WorkspaceCardsViewProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  targetWorkspaceSubdomain?: string;
  onToggleEnabled: (subdomain: string, enabled: boolean) => void;
  onToggleEmailVerification: (subdomain: string, required: boolean) => void;
  onOpenModules: (workspace: PlatformWorkspaceRowData) => void;
  onOpenDelete: (workspace: PlatformWorkspaceRowData) => void;
}

export function WorkspaceCardsView({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  targetWorkspaceSubdomain,
  onToggleEnabled,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: WorkspaceCardsViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardsGrid>
      {workspaces.map((workspace) => {
        const isTargetDelete = deletePending && targetWorkspaceSubdomain === workspace.subdomain;
        return (
          <DirectoryEntityCard
            key={workspace.subdomain}
            accentClassName={!workspace.enabled ? 'bg-muted-foreground/50' : 'bg-primary/80'}
            className={cn(
              'flex flex-col justify-between transition-all',
              !workspace.enabled && 'opacity-85 hover:opacity-100',
              isTargetDelete && 'opacity-40 pointer-events-none',
            )}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />
                <WorkspaceStatusBadge enabled={workspace.enabled} />
              </div>

              {workspace.createdAt ? (
                <div className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground/70">
                  <Calendar className="w-3.5 h-3.5 shrink-0 opacity-75" aria-hidden />
                  <span>
                    {t('platform.sort.createdAt')}: {formatDate(workspace.createdAt)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <WorkspaceRowActions
                subdomain={workspace.subdomain}
                enabled={workspace.enabled}
                requireEmailVerification={workspace.requireEmailVerification}
                busy={togglePending || deletePending}
                deletePending={isTargetDelete}
                tenantLink={tenantUrl(workspace.subdomain, '/')}
                onToggle={(enabled) => onToggleEnabled(workspace.subdomain, enabled)}
                onToggleEmailVerification={(req) => onToggleEmailVerification(workspace.subdomain, req)}
                onOpenModules={() => onOpenModules(workspace)}
                onOpenDelete={() => onOpenDelete(workspace)}
              />
            </div>
          </DirectoryEntityCard>
        );
      })}
    </DirectoryCardsGrid>
  );
}
