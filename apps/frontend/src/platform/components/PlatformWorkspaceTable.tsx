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

export interface PlatformWorkspaceTableProps {
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

export function PlatformWorkspaceTable({
  workspaces,
  appDomain,
  togglePending,
  deletePending,
  targetDeleteSubdomain,
  onToggle,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: PlatformWorkspaceTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
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
                  requireEmailVerification={workspace.requireEmailVerification}
                  busy={togglePending || deletePending}
                  deletePending={deletePending && targetDeleteSubdomain === workspace.subdomain}
                  tenantLink={tenantUrl(workspace.subdomain, "/")}
                  variant="table"
                  onToggle={(enabled) => onToggle(workspace.subdomain, enabled)}
                  onToggleEmailVerification={(req) => onToggleEmailVerification(workspace.subdomain, req)}
                  onOpenModules={() => onOpenModules(workspace)}
                  onOpenDelete={() => onOpenDelete(workspace)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
