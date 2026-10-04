import React, { useMemo } from 'react';
import { Award, Pencil, Trash2 } from 'lucide-react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { resolveRoleDisplayName, type WorkspaceRole } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DataTable,
  DataTableRowActions,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/common/data-table';
import { useTranslation } from '@/hooks/useTranslation';

export interface FacultyDesignationsTableProps {
  designations: FacultyDesignationDefinition[];
  roles?: readonly WorkspaceRole[];
  editingDesignationId?: string;
  isPending: boolean;
  isLoading?: boolean;
  onEdit: (designation: FacultyDesignationDefinition) => void;
  onDelete: (designation: FacultyDesignationDefinition) => void;
  primaryAction?: React.ReactNode;
}

export function FacultyDesignationsTable({
  designations,
  roles = [],
  editingDesignationId,
  isPending,
  isLoading = false,
  onEdit,
  onDelete,
  primaryAction,
}: FacultyDesignationsTableProps): React.JSX.Element {
  const { t } = useTranslation();

  const roleName = (roleId: string) => resolveRoleDisplayName(roleId, roles, t);
  const statusLabel = (d: FacultyDesignationDefinition) =>
    d.isActive ? t('faculty.status.active') : t('faculty.status.inactive');

  const columns: DataTableColumn<FacultyDesignationDefinition>[] = [
    { id: 'name', label: t('faculty.designations.name'), fixed: true, render: (d) => <span className="font-medium">{d.name}</span> },
    {
      id: 'code',
      label: t('faculty.designations.code'),
      width: 140,
      render: (d) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{d.code}</code>
      ),
    },
    {
      id: 'status',
      label: t('common.status'),
      width: 120,
      searchValue: statusLabel,
      render: (d) => (
        <Badge variant={d.isActive ? 'default' : 'secondary'} className="text-xs">{statusLabel(d)}</Badge>
      ),
    },
    {
      id: 'roles',
      label: t('faculty.designations.roles'),
      searchValue: (d) => d.assignableRoles.map(roleName),
      render: (d) =>
        d.assignableRoles.length ? (
          <div className="flex flex-wrap gap-1">
            {d.assignableRoles.map((roleId) => (
              <Badge key={roleId} variant="secondary" className="text-2xs font-normal">{roleName(roleId)}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const roleOptions = useMemo(
    () =>
      [...new Set(designations.flatMap((d) => d.assignableRoles))].map((roleId) => ({
        value: roleId,
        label: resolveRoleDisplayName(roleId, roles, t),
      })),
    [designations, roles, t],
  );

  const filters: DataTableFilter<FacultyDesignationDefinition>[] = [
    {
      id: 'status',
      label: t('common.status'),
      options: [
        { value: 'active', label: t('faculty.status.active') },
        { value: 'inactive', label: t('faculty.status.inactive') },
      ],
      getValue: (d) => (d.isActive ? 'active' : 'inactive'),
    },
    { id: 'roles', label: t('faculty.designations.roles'), options: roleOptions, getValue: (d) => d.assignableRoles },
  ];

  return (
    <DataTable
      tableId="faculty.designations"
      label={t('faculty.tabs.designations')}
      data={designations}
      columns={columns}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder={t('faculty.designations.searchPlaceholder')}
      primaryAction={primaryAction}
      card={{ title: (d) => d.name }}
      rowClassName={(d) =>
        d.id === editingDesignationId
          ? 'bg-primary/10 ring-1 ring-inset ring-primary/40'
          : d.isActive
            ? undefined
            : 'opacity-70'
      }
      renderRowActions={(d) => (
        <DataTableRowActions
          actions={[
            { id: 'edit', label: `${t('common.edit')} ${d.name}`, icon: Pencil, onClick: () => onEdit(d), disabled: isPending },
            {
              id: 'delete',
              label: `${t('common.delete')} ${d.name}`,
              icon: Trash2,
              tone: 'destructive',
              onClick: () => onDelete(d),
              disabled: isPending,
            },
          ]}
        />
      )}
      emptyState={
        <EmptyState
          icon={Award}
          title={t('faculty.designations.emptyCatalog')}
          description={t('faculty.designations.setupHint')}
          compact
          variant="dashed"
        />
      }
    />
  );
}
