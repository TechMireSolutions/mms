import React from "react";
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from "@mms/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { useTranslation } from "@/hooks/useTranslation";
import { WorkspaceIdentityCell } from "@/platform/components/workspace/WorkspaceIdentityCell";
import { WorkspaceStatusBadge } from "@/platform/components/workspace/WorkspaceStatusBadge";
import { WorkspaceRowActions } from "@/platform/components/workspace/WorkspaceRowActions";
import { tenantUrl } from "@/lib/config/tenantConfig";
import { PlatformWorkspaceDeleteDialog } from "@/platform/components/PlatformWorkspaceDeleteDialog";
import { PlatformWorkspaceModulesDialog } from "@/platform/components/PlatformWorkspaceModulesDialog";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";

interface PlatformWorkspaceTableProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  onToggle: (subdomain: string, enabled: boolean) => void;
  onDelete: (subdomain: string, input: { password: string; confirmSubdomain: string }) => Promise<unknown>;
}

export function PlatformWorkspaceTable({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  onToggle,
  onDelete,
}: PlatformWorkspaceTableProps): React.JSX.Element {
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
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell columnKey="madrasa" className="px-4 py-3">
                {t("platform.manageMadrasas")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="status" className="px-4 py-3 w-32">
                {t("common.status")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="actions" className="px-4 py-3 w-32 text-end">
                {t("common.actions")}
              </ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {workspaces.map((workspace) => (
              <TableRow
                key={workspace.subdomain}
                className="group hover:bg-muted/30 transition-colors"
              >
                <TableCell className="px-4 py-3 align-top">
                  <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <WorkspaceStatusBadge enabled={workspace.enabled} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top text-end">
                  <WorkspaceRowActions
                    subdomain={workspace.subdomain}
                    enabled={workspace.enabled}
                    busy={togglePending || deletePending}
                    deletePending={deletePending && targetWorkspace?.subdomain === workspace.subdomain}
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
