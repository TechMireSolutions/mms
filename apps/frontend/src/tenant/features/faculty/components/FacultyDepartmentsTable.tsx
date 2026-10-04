import React from 'react';
import { Building2, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DataTable,
  DataTableRowActions,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/common/data-table';
import { useTranslation } from '@/hooks/useTranslation';

export interface FacultyDepartmentsTableProps {
  departments: FacultyDepartmentEntity[];
  orderedDepartments: FacultyDepartmentEntity[];
  editingDepartmentId?: string;
  isPending: boolean;
  isLoading: boolean;
  onEdit: (dept: FacultyDepartmentEntity) => void;
  onDelete: (dept: FacultyDepartmentEntity) => void;
}

const Dash = () => <span className="text-muted-foreground/50">—</span>;

export function FacultyDepartmentsTable({
  departments,
  orderedDepartments,
  editingDepartmentId,
  isPending,
  isLoading,
  onEdit,
  onDelete,
}: FacultyDepartmentsTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const parentMap = new Map(departments.map((d) => [d.id, d.name]));
  const parentName = (d: FacultyDepartmentEntity) => (d.parentId ? parentMap.get(d.parentId) : undefined);
  const statusLabel = (d: FacultyDepartmentEntity) =>
    d.isActive !== false ? t('faculty.status.active') : t('faculty.status.inactive');

  const columns: DataTableColumn<FacultyDepartmentEntity>[] = [
    {
      id: 'name',
      label: t('faculty.setup.departmentName'),
      fixed: true,
      render: (d) => (
        <div className="flex items-center gap-1.5 font-medium min-w-0">
          {d.parentId && <ChevronRight className="size-3 text-muted-foreground shrink-0 ms-2" aria-hidden />}
          <span className="truncate">{d.name}</span>
        </div>
      ),
    },
    {
      id: 'code',
      label: t('faculty.setup.departmentCode'),
      width: 150,
      render: (d) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{d.code}</code>
      ),
    },
    {
      id: 'parent',
      label: t('faculty.setup.parentDepartment'),
      searchValue: parentName,
      render: (d) => <span className="text-xs text-muted-foreground">{parentName(d) ?? <Dash />}</span>,
    },
    {
      id: 'status',
      label: t('common.status'),
      width: 120,
      searchValue: statusLabel,
      render: (d) => (
        <Badge variant={d.isActive !== false ? 'default' : 'secondary'} className="text-xs">
          {statusLabel(d)}
        </Badge>
      ),
    },
  ];

  const parentOptions = departments
    .filter((d) => orderedDepartments.some((child) => child.parentId === d.id))
    .map((d) => ({ value: d.id, label: d.name }));

  const filters: DataTableFilter<FacultyDepartmentEntity>[] = [
    { id: 'parent', label: t('faculty.setup.parentDepartment'), options: parentOptions, getValue: (d) => d.parentId },
    {
      id: 'status',
      label: t('common.status'),
      options: [
        { value: 'active', label: t('faculty.status.active') },
        { value: 'inactive', label: t('faculty.status.inactive') },
      ],
      getValue: (d) => (d.isActive !== false ? 'active' : 'inactive'),
    },
  ];

  return (
    <DataTable
      tableId="faculty.departments"
      label={t('faculty.setup.departmentName')}
      data={orderedDepartments}
      columns={columns}
      filters={filters}
      isLoading={isLoading}
      card={{ title: (d) => d.name }}
      rowClassName={(d) =>
        d.id === editingDepartmentId
          ? 'bg-primary/10 ring-1 ring-inset ring-primary/40'
          : d.isActive !== false
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
      emptyState={<EmptyState icon={Building2} title={t('faculty.setup.noDepartments')} compact variant="dashed" />}
    />
  );
}
