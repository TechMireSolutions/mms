import React from 'react';
import { formatDate, type PlatformWorkspaceRow as PlatformWorkspaceRowData, type AppTranslationKey } from '@mms/shared';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import type { EntityDescriptor } from '@/types/entityRegistry';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WorkspaceIdentityCell } from '@/platform/components/workspace/WorkspaceIdentityCell';
import { WorkspaceStatusBadge } from '@/platform/components/workspace/WorkspaceStatusBadge';
import { WorkspaceRowActions } from '@/platform/components/workspace/WorkspaceRowActions';
import type { WorkspaceSortDirection, WorkspaceSortField } from '@/platform/components/platformWorkspaceListData';
import { cn } from '@/lib/utils';

export interface WorkspaceTableViewProps {
  workspaces: PlatformWorkspaceRowData[];
  descriptor: EntityDescriptor<PlatformWorkspaceRowData>;
  appDomain: string;
  sortField: WorkspaceSortField;
  sortDirection: WorkspaceSortDirection;
  onToggleSort: (field: WorkspaceSortField) => void;
  togglePending: boolean;
  deletePending: boolean;
  targetWorkspaceSubdomain?: string;
  onToggleEnabled: (subdomain: string, enabled: boolean) => void;
  onToggleEmailVerification: (subdomain: string, required: boolean) => void;
  onOpenModules: (workspace: PlatformWorkspaceRowData) => void;
  onOpenDelete: (workspace: PlatformWorkspaceRowData) => void;
}

export function WorkspaceTableView({
  workspaces,
  descriptor,
  appDomain,
  sortField,
  sortDirection,
  onToggleSort,
  togglePending,
  deletePending,
  targetWorkspaceSubdomain,
  onToggleEnabled,
  onToggleEmailVerification,
  onOpenModules,
  onOpenDelete,
}: WorkspaceTableViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <ModuleWorkTableHeader
            columns={descriptor.getTableColumns().map((col) => {
              const f = descriptor.getField(col.id);
              const labelKey = f?.labelKey as AppTranslationKey | undefined;
              return {
                id: col.id,
                label: (labelKey ? t(labelKey) : undefined) || col.label,
                sortField: col.id,
                headerClassName:
                  col.id === 'madrasaName'
                    ? 'min-w-56'
                    : col.id === 'status' || col.id === 'enabled'
                    ? 'w-40'
                    : col.id === 'requireEmailVerification'
                    ? 'w-44'
                    : 'w-36',
              };
            })}
            sortField={sortField}
            sortDir={sortDirection}
            onSort={(k) => onToggleSort(k as WorkspaceSortField)}
            getColumnWidth={() => undefined}
            setColumnWidth={() => {}}
            actionsLabel={t('common.actions')}
          />
          <TableBody className="divide-y divide-border/50">
            {workspaces.map((workspace) => {
              const isDeleting = deletePending && targetWorkspaceSubdomain === workspace.subdomain;
              return (
                <TableRow
                  key={workspace.subdomain}
                  className={cn(
                    'group hover:bg-muted/30 transition-colors',
                    !workspace.enabled && 'opacity-85 hover:opacity-100',
                    isDeleting && 'opacity-40 pointer-events-none',
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
                        onCheckedChange={(checked) => onToggleEnabled(workspace.subdomain, checked)}
                        aria-label={t('platform.workspaceActive')}
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
                        aria-label={t('platform.emailVerification')}
                      />
                      <Label
                        htmlFor={`table-verify-${workspace.subdomain}`}
                        className="text-xs font-semibold text-muted-foreground whitespace-nowrap cursor-pointer select-none"
                      >
                        {workspace.requireEmailVerification
                          ? t('platform.emailVerificationRequired')
                          : t('platform.emailVerificationOptional')}
                      </Label>
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
                      tenantLink={tenantUrl(workspace.subdomain, '/')}
                      variant="table"
                      onToggle={(enabled) => onToggleEnabled(workspace.subdomain, enabled)}
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
