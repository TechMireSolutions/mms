import React from "react";
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from "@mms/shared";
import { WorkspaceIdentityCell } from "@/platform/components/workspace/WorkspaceIdentityCell";
import { WorkspaceStatusBadge } from "@/platform/components/workspace/WorkspaceStatusBadge";
import { WorkspaceRowActions } from "@/platform/components/workspace/WorkspaceRowActions";
import { tenantUrl } from "@/lib/config/tenantConfig";
import { ModuleDirectoryCards } from "@/components/ui/ModuleDirectoryCards";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";

export interface PlatformWorkspaceCardsProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  targetDeleteSubdomain?: string | null;
  onToggle: (subdomain: string, enabled: boolean) => void;
  onToggleEmailVerification: (subdomain: string, requireEmailVerification: boolean) => void;
  onOpenModules: (workspace: PlatformWorkspaceRowData) => void;
  onOpenDelete: (workspace: PlatformWorkspaceRowData) => void;
}

export function PlatformWorkspaceCards({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  targetDeleteSubdomain,
  onToggle,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: PlatformWorkspaceCardsProps): React.JSX.Element {
  return (
    <ModuleDirectoryCards
      items={workspaces}
      selectedIds={[]}
      renderItem={(workspace) => {
        const isTargetDelete = deletePending && targetDeleteSubdomain === workspace.subdomain;
        return (
          <DirectoryEntityCard
            key={workspace.subdomain}
            accentClassName={!workspace.enabled ? "bg-destructive/80" : "bg-primary/80"}
            className="flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />
              <WorkspaceStatusBadge enabled={workspace.enabled} />
            </div>

            <div className="flex items-center justify-end border-t border-border/30 pt-3 mt-auto">
              <WorkspaceRowActions
                subdomain={workspace.subdomain}
                enabled={workspace.enabled}
                requireEmailVerification={workspace.requireEmailVerification}
                busy={togglePending || deletePending}
                deletePending={isTargetDelete}
                tenantLink={tenantUrl(workspace.subdomain, "/")}
                onToggle={(enabled) => onToggle(workspace.subdomain, enabled)}
                onToggleEmailVerification={(req) => onToggleEmailVerification(workspace.subdomain, req)}
                onOpenModules={() => onOpenModules(workspace)}
                onOpenDelete={() => onOpenDelete(workspace)}
              />
            </div>
          </DirectoryEntityCard>
        );
      }}
    />
  );
}
