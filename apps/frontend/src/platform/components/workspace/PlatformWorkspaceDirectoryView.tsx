import React from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';
import type { usePlatformWorkspaceDescriptor } from '@/platform/hooks/usePlatformWorkspaceDescriptor';
import type { WorkspaceSortDirection, WorkspaceSortField } from '@/platform/components/platformWorkspaceListData';
import { WorkspaceTableView } from '@/platform/components/workspace/WorkspaceTableView';
import { WorkspaceListCards } from '@/platform/components/workspace/WorkspaceListCards';

export interface PlatformWorkspaceDirectoryViewProps {
  viewMode: 'table' | 'cards';
  workspaces: PlatformWorkspaceRowData[];
  descriptor: ReturnType<typeof usePlatformWorkspaceDescriptor>;
  appDomain: string;
  sortField: WorkspaceSortField;
  sortDirection: WorkspaceSortDirection;
  onToggleSort: (field: WorkspaceSortField) => void;
  togglePending: boolean;
  deletePending: boolean;
  targetWorkspaceSubdomain?: string;
  onToggleEnabled: (subdomain: string, enabled: boolean) => void;
  onToggleEmailVerification: (subdomain: string, requireEmailVerification: boolean) => void;
  onOpenModules: (workspace: PlatformWorkspaceRowData) => void;
  onOpenDelete: (workspace: PlatformWorkspaceRowData) => void;
  onOpenResetPassword: (workspace: PlatformWorkspaceRowData) => void;
  onOpenCreateAdmin: (workspace: PlatformWorkspaceRowData) => void;
  selectedSubdomains?: ReadonlySet<string>;
  onToggleSelect?: (subdomain: string) => void;
  onToggleSelectAll?: () => void;
}

export function PlatformWorkspaceDirectoryView({
  viewMode,
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
  selectedSubdomains,
  onToggleSelect,
  onToggleSelectAll,
}: PlatformWorkspaceDirectoryViewProps): React.JSX.Element {
  if (viewMode === 'table') {
    return (
      <WorkspaceTableView
        workspaces={workspaces}
        descriptor={descriptor}
        appDomain={appDomain}
        sortField={sortField}
        sortDirection={sortDirection}
        onToggleSort={onToggleSort}
        togglePending={togglePending}
        deletePending={deletePending}
        targetWorkspaceSubdomain={targetWorkspaceSubdomain}
        onToggleEnabled={onToggleEnabled}
        onToggleEmailVerification={onToggleEmailVerification}
        onOpenModules={onOpenModules}
        onOpenDelete={onOpenDelete}
        onOpenResetPassword={onOpenResetPassword}
        onOpenCreateAdmin={onOpenCreateAdmin}
        selectedSubdomains={selectedSubdomains}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
      />
    );
  }

  return (
    <WorkspaceListCards
      workspaces={workspaces}
      appDomain={appDomain}
      togglePending={togglePending}
      deletePending={deletePending}
      targetWorkspaceSubdomain={targetWorkspaceSubdomain}
      onToggleEnabled={onToggleEnabled}
      onToggleEmailVerification={onToggleEmailVerification}
      onOpenModules={onOpenModules}
      onOpenDelete={onOpenDelete}
      onOpenResetPassword={onOpenResetPassword}
      onOpenCreateAdmin={onOpenCreateAdmin}
      selectedSubdomains={selectedSubdomains}
      onToggleSelect={onToggleSelect}
    />
  );
}
