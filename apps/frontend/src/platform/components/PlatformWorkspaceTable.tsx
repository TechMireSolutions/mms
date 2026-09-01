import React from "react";
import { formatDate, type PlatformWorkspaceRow as PlatformWorkspaceRowData } from "@mms/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { WorkspaceIdentityCell } from "@/platform/components/workspace/WorkspaceIdentityCell";
import { WorkspaceStatusBadge } from "@/platform/components/workspace/WorkspaceStatusBadge";
import { WorkspaceRowActions } from "@/platform/components/workspace/WorkspaceRowActions";
import { tenantUrl } from "@/lib/config/tenantConfig";
import type { WorkspaceSortDirection, WorkspaceSortField } from "@/platform/components/platformWorkspaceListData";
import { cn } from "@/lib/utils";

export interface PlatformWorkspaceTableProps {
  workspaces: PlatformWorkspaceRowData[];
  appDomain: string;
  togglePending: boolean;
  deletePending: boolean;
  targetDeleteSubdomain?: string | null;
  sortField?: WorkspaceSortField;
  sortDirection?: WorkspaceSortDirection;
  onToggleSort?: (field: WorkspaceSortField) => void;
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
  sortField,
  sortDirection,
  onToggleSort,
  onToggle,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: PlatformWorkspaceTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
              <ModuleTableHeaderCell
                columnKey="madrasa"
                sortKey="name"
                activeSortField={sortField}
                sortDir={sortDirection}
                onSort={onToggleSort ? (k) => onToggleSort(k as WorkspaceSortField) : undefined}
                className="px-4 py-3 min-w-56"
              >
                {t("platform.manageMadrasas")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell
                columnKey="status"
                sortKey="status"
                activeSortField={sortField}
                sortDir={sortDirection}
                onSort={onToggleSort ? (k) => onToggleSort(k as WorkspaceSortField) : undefined}
                className="px-4 py-3 w-40"
              >
                {t("common.status")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="emailVerification" className="px-4 py-3 w-44">
                {t("platform.emailVerification")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell
                columnKey="createdAt"
                sortKey="createdAt"
                activeSortField={sortField}
                sortDir={sortDirection}
                onSort={onToggleSort ? (k) => onToggleSort(k as WorkspaceSortField) : undefined}
                className="px-4 py-3 w-36"
              >
                {t("platform.sort.createdAt")}
              </ModuleTableHeaderCell>
              <ModuleTableHeaderCell columnKey="actions" className="px-4 py-3 w-36 text-end">
                {t("common.actions")}
              </ModuleTableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {workspaces.map((workspace) => {
              const isDeleting = deletePending && targetDeleteSubdomain === workspace.subdomain;
              return (
                <TableRow
                  key={workspace.subdomain}
                  className={cn(
                    "group hover:bg-muted/30 transition-colors",
                    !workspace.enabled && "opacity-85 hover:opacity-100",
                    isDeleting && "opacity-40 pointer-events-none",
                  )}
                >
                  <TableCell className="px-4 py-3 align-middle">
                    <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        id={`table-toggle-${workspace.subdomain}`}
                        checked={workspace.enabled}
                        disabled={togglePending || deletePending}
                        onCheckedChange={(checked) => onToggle(workspace.subdomain, checked)}
                        aria-label={t("platform.workspaceActive")}
                      />
                      <WorkspaceStatusBadge enabled={workspace.enabled} />
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        id={`table-verify-${workspace.subdomain}`}
                        checked={Boolean(workspace.requireEmailVerification)}
                        disabled={togglePending || deletePending}
                        onCheckedChange={(checked) =>
                          onToggleEmailVerification(workspace.subdomain, checked)
                        }
                        aria-label={t("platform.emailVerification")}
                      />
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                        {workspace.requireEmailVerification
                          ? t("platform.emailVerificationRequired")
                          : t("platform.emailVerificationOptional")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {formatDate(workspace.createdAt)}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-end">
                    <WorkspaceRowActions
                      subdomain={workspace.subdomain}
                      enabled={workspace.enabled}
                      requireEmailVerification={workspace.requireEmailVerification}
                      busy={togglePending || deletePending}
                      deletePending={isDeleting}
                      tenantLink={tenantUrl(workspace.subdomain, "/")}
                      variant="table"
                      onToggle={(enabled) => onToggle(workspace.subdomain, enabled)}
                      onToggleEmailVerification={(req) => onToggleEmailVerification(workspace.subdomain, req)}
                      onOpenModules={() => onOpenModules(workspace)}
                      onOpenDelete={() => onOpenDelete(workspace)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
