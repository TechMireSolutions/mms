import React from 'react';
import { formatDate, type PlatformWorkspaceRow as PlatformWorkspaceRowData, type AppTranslationKey } from '@mms/shared';
import { tenantUrl } from '@/lib/config/tenantConfig';
import { useTranslation } from '@/hooks/useTranslation';
import type { EntityDescriptor } from '@/types/entityRegistry';
import { WorkBatchTable, type WorkBatchTableColumn } from '@/components/common/work/WorkBatchTable';
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
  onOpenResetPassword?: (workspace: PlatformWorkspaceRowData) => void;
  onOpenCreateAdmin?: (workspace: PlatformWorkspaceRowData) => void;
  onInspect?: (workspace: PlatformWorkspaceRowData) => void;
  selectedSubdomains?: ReadonlySet<string>;
  onToggleSelect?: (subdomain: string) => void;
  onToggleSelectAll?: () => void;
}

type WorkspaceTableRow = PlatformWorkspaceRowData & { id: string };

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
  onOpenResetPassword,
  onOpenCreateAdmin,
  onInspect,
  selectedSubdomains,
  onToggleSelect,
  onToggleSelectAll,
}: WorkspaceTableViewProps): React.JSX.Element {
  const { t } = useTranslation();

  const rows: WorkspaceTableRow[] = React.useMemo(
    () => workspaces.map((w) => ({ ...w, id: w.subdomain })),
    [workspaces],
  );

  const columns: WorkBatchTableColumn<WorkspaceTableRow>[] = React.useMemo(() => {
    return descriptor.getTableColumns().map((col) => {
      const f = descriptor.getField(col.id);
      const labelKey = f?.labelKey as AppTranslationKey | undefined;
      const translated = labelKey ? t(labelKey) : undefined;
      const label = translated && translated !== labelKey ? translated : col.label || f?.label || col.id;

      const headerClassName = col.id === 'madrasaName' ? 'min-w-72 flex-1'
        : col.id === 'enabled' ? 'w-44 min-w-44'
        : col.id === 'requireEmailVerification' ? 'w-60 min-w-60'
        : col.id === 'createdAt' ? 'w-40 min-w-40' : 'w-36';

      const cellClassName = col.id === 'madrasaName' ? 'px-4 py-3 align-middle min-w-72'
        : col.id === 'enabled' ? 'px-4 py-3 align-middle w-44 min-w-44'
        : col.id === 'requireEmailVerification' ? 'px-4 py-3 align-middle w-60 min-w-60'
        : col.id === 'createdAt' ? 'px-4 py-3 align-middle text-xs font-medium text-muted-foreground whitespace-nowrap w-40 min-w-40'
        : 'px-4 py-3 align-middle';

      const render = (workspace: WorkspaceTableRow) => {
        if (col.id === 'madrasaName') {
          return <WorkspaceIdentityCell workspace={workspace} appDomain={appDomain} />;
        }
        if (col.id === 'enabled') {
          return (
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
          );
        }
        if (col.id === 'requireEmailVerification') {
          return (
            <div className="flex items-center gap-2.5">
              <Switch
                id={`table-verify-${workspace.subdomain}`}
                checked={Boolean(workspace.requireEmailVerification)}
                disabled={togglePending || deletePending}
                onCheckedChange={(checked) => onToggleEmailVerification(workspace.subdomain, checked)}
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
          );
        }
        if (col.id === 'createdAt') return formatDate(workspace.createdAt);
        return String((workspace as unknown as Record<string, unknown>)[col.id] ?? '—');
      };

      return { id: col.id, label, sortField: col.id, headerClassName, cellClassName, render };
    });
  }, [descriptor, t, appDomain, togglePending, deletePending, onToggleEnabled, onToggleEmailVerification]);

  return (
    <WorkBatchTable
      data={rows}
      columns={columns}
      sort={{
        field: sortField,
        dir: sortDirection,
        onSort: (f) => onToggleSort(f as WorkspaceSortField),
      }}
      selection={
        onToggleSelect && selectedSubdomains && onToggleSelectAll ? {
          selectedIds: selectedSubdomains,
          onSelectOne: (id) => onToggleSelect(id),
          onSelectAll: onToggleSelectAll,
          allSelected: workspaces.length > 0 && workspaces.every((w) => selectedSubdomains.has(w.subdomain)),
          someSelected: workspaces.some((w) => selectedSubdomains.has(w.subdomain)) && !workspaces.every((w) => selectedSubdomains.has(w.subdomain)),
          selectAllAriaLabel: t('platform.workspaces.selectAll'),
          selectRowAriaLabel: (w) => t('platform.workspaces.selectItem', { name: w.madrasaName }),
        } : undefined
      }
      onRowClick={onInspect ? (w) => onInspect(w) : undefined}
      stickyColumnId="madrasaName"
      actionsLabel={t('common.actions')}
      actionsHeaderClassName="w-56 min-w-56 text-end px-4 py-3"
      actionsCellClassName="w-56 min-w-56 text-end px-4 py-3 align-middle"
      renderRowActions={(workspace) => {
        const isDeleting = deletePending && targetWorkspaceSubdomain === workspace.subdomain;
        return (
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
            onOpenResetPassword={onOpenResetPassword ? () => onOpenResetPassword(workspace) : undefined}
            onOpenCreateAdmin={onOpenCreateAdmin ? () => onOpenCreateAdmin(workspace) : undefined}
          />
        );
      }}
      rowClassName={(workspace) =>
        cn(
          'group hover:bg-muted/30 transition-colors',
          onInspect && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset',
          !workspace.enabled && 'opacity-85 hover:opacity-100',
          deletePending && targetWorkspaceSubdomain === workspace.subdomain && 'opacity-40 pointer-events-none',
        )
      }
      containerClassName="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm"
      bordered={false}
      virtualize={false}
    />
  );
}
