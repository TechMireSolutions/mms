import React from "react";
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { WorkspaceIdentityCell } from "@/platform/components/workspace/WorkspaceIdentityCell";
import { WorkspaceStatusBadge } from "@/platform/components/workspace/WorkspaceStatusBadge";
import { WorkspaceRowActions } from "@/platform/components/workspace/WorkspaceRowActions";
import { tenantUrl } from "@/lib/config/tenantConfig";
import { PlatformWorkspaceDeleteDialog } from "@/platform/components/PlatformWorkspaceDeleteDialog";
import { PlatformWorkspaceModulesDialog } from "@/platform/components/PlatformWorkspaceModulesDialog";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";

interface PlatformWorkspaceCardsProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  onToggle: (subdomain: string, enabled: boolean) => void;
  onDelete: (subdomain: string, input: { password: string; confirmSubdomain: string }) => Promise<unknown>;
}

export function PlatformWorkspaceCards({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  onToggle,
  onDelete,
}: PlatformWorkspaceCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetWorkspace, setTargetWorkspace] = React.useState<PlatformWorkspaceRowData | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirmSubdomain, setConfirmSubdomain] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const [modulesOpen, setModulesOpen] = React.useState(false);
  const [targetModulesWorkspace, setTargetModulesWorkspace] = React.useState<PlatformWorkspaceRowData | null>(null);

  React.useEffect(() => {
    if (!confirmOpen) {
      setTargetWorkspace(null);
      setPassword("");
      setConfirmSubdomain("");
      setPasswordError(null);
    }
  }, [confirmOpen]);

  const handleDelete = (): void => {
    if (!targetWorkspace) return;
    if (confirmSubdomain.trim().toLowerCase() !== targetWorkspace.subdomain.toLowerCase()) {
      setPasswordError(t("platform.deleteWorkspaceConfirmSubdomainMismatch"));
      return;
    }
    if (!password.trim()) {
      setPasswordError(t("platform.deleteWorkspacePasswordHint"));
      return;
    }
    setPasswordError(null);
    void onDelete(targetWorkspace.subdomain, { password, confirmSubdomain: confirmSubdomain.trim() })
      .then(() => setConfirmOpen(false))
      .catch((error: unknown) => {
        setPasswordError(getPlatformErrorMessage(error, t));
      });
  };

  return (
    <>
      <DirectoryCardsGrid>
        {workspaces.map((workspace) => {
          const isTargetDelete = deletePending && targetWorkspace?.subdomain === workspace.subdomain;
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
                  busy={togglePending || deletePending}
                  deletePending={isTargetDelete}
                  tenantLink={tenantUrl(workspace.subdomain, "/")}
                  onToggle={(enabled) => onToggle(workspace.subdomain, enabled)}
                  onOpenModules={() => {
                    setTargetModulesWorkspace(workspace);
                    setModulesOpen(true);
                  }}
                  onOpenDelete={() => {
                    setTargetWorkspace(workspace);
                    setConfirmOpen(true);
                  }}
                />
              </div>
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>

      {targetWorkspace ? (
        <PlatformWorkspaceDeleteDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          workspace={targetWorkspace}
          appDomain={appDomain}
          password={password}
          onPasswordChange={setPassword}
          confirmSubdomain={confirmSubdomain}
          onConfirmSubdomainChange={setConfirmSubdomain}
          passwordError={passwordError}
          deletePending={deletePending}
          onConfirm={handleDelete}
        />
      ) : null}

      {targetModulesWorkspace ? (
        <PlatformWorkspaceModulesDialog
          workspace={targetModulesWorkspace}
          open={modulesOpen}
          onOpenChange={setModulesOpen}
        />
      ) : null}
    </>
  );
}
