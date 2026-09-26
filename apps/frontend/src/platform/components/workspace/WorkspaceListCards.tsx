import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate, type PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCard } from '@/components/ui/DirectoryCard';
import { WorkspaceIdentityCell } from '@/platform/components/workspace/WorkspaceIdentityCell';
import { WorkspaceStatusBadge } from '@/platform/components/workspace/WorkspaceStatusBadge';
import { WorkspaceRowActions } from '@/platform/components/workspace/WorkspaceRowActions';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface WorkspaceListCardsProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  targetWorkspaceSubdomain?: string;
  onToggleEnabled: (subdomain: string, enabled: boolean) => void;
  onToggleEmailVerification: (subdomain: string, required: boolean) => void;
  onOpenModules: (workspace: PlatformWorkspaceRowData) => void;
  onOpenDelete: (workspace: PlatformWorkspaceRowData) => void;
  onOpenResetPassword?: (workspace: PlatformWorkspaceRowData) => void;
  onOpenCreateAdmin?: (workspace: PlatformWorkspaceRowData) => void;
  selectedSubdomains?: ReadonlySet<string>;
  onToggleSelect?: (subdomain: string) => void;
}

/** Directory list cards view for platform workspaces, aligning with tenant [Entity]ListCards. */
export function WorkspaceListCards({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  targetWorkspaceSubdomain,
  onToggleEnabled,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
  onOpenResetPassword,
  onOpenCreateAdmin,
  selectedSubdomains,
  onToggleSelect,
}: WorkspaceListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <DirectoryCardsGrid>
      {workspaces.map((workspace) => {
        const isTargetDelete = deletePending && targetWorkspaceSubdomain === workspace.subdomain;
        return (
          <DirectoryCard
            key={workspace.subdomain}
            entity={{ id: workspace.subdomain, ...workspace }}
            reducedMotion={reducedMotion}
            accentClassName={!workspace.enabled ? 'bg-muted-foreground/50' : 'bg-primary/80'}
            className={cn(
              'flex flex-col justify-between transition-all',
              !workspace.enabled && 'opacity-85 hover:opacity-100',
              isTargetDelete && 'opacity-40 pointer-events-none',
            )}
            headerSlot={
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  {onToggleSelect && selectedSubdomains && (
                    <Checkbox
                      checked={selectedSubdomains.has(workspace.subdomain)}
                      onCheckedChange={() => onToggleSelect(workspace.subdomain)}
                      aria-label={t('platform.workspaces.selectItem', { name: workspace.madrasaName })}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />
                </div>
                <WorkspaceStatusBadge enabled={workspace.enabled} />
              </div>
            }
            metadataSlot={
              workspace.createdAt ? (
                <div className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0 opacity-75" aria-hidden />
                  <span>
                    {t('platform.sort.createdAt')}: {formatDate(workspace.createdAt)}
                  </span>
                </div>
              ) : null
            }
            footer={
              <div className="mt-4 w-full">
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
                  onOpenResetPassword={onOpenResetPassword ? () => onOpenResetPassword(workspace) : undefined}
                  onOpenCreateAdmin={onOpenCreateAdmin ? () => onOpenCreateAdmin(workspace) : undefined}
                />
              </div>
            }
          />
        );
      })}
    </DirectoryCardsGrid>
  );
}

/** Backward-compatible alias for existing consumers. */
export type WorkspaceCardsViewProps = WorkspaceListCardsProps;
export const WorkspaceCardsView = WorkspaceListCards;
