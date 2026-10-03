import React from 'react';
import { Building2, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
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
  facultyMap?: Map<string, string>;
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
  facultyMap,
  editingDepartmentId,
  isPending,
  isLoading,
  onEdit,
  onDelete,
}: FacultyDepartmentsTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const parentMap = new Map(departments.map((d) => [d.id, d.name]));
  const parentName = (d: FacultyDepartmentEntity) => (d.parentId ? parentMap.get(d.parentId) : undefined);
  const headName = (d: FacultyDepartmentEntity) =>
    d.headFacultyId ? (facultyMap?.get(d.headFacultyId) ?? d.headFacultyId) : undefined;

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
      id: 'head',
      label: t('faculty.setup.departmentHead'),
      searchValue: headName,
      render: (d) => <span className="text-xs text-muted-foreground">{headName(d) ?? <Dash />}</span>,
    },
  ];

  const parentOptions = departments
    .filter((d) => orderedDepartments.some((child) => child.parentId === d.id))
    .map((d) => ({ value: d.id, label: d.name }));

  const filters: DataTableFilter<FacultyDepartmentEntity>[] = [
    { id: 'parent', label: t('faculty.setup.parentDepartment'), options: parentOptions, getValue: (d) => d.parentId },
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
      rowClassName={(d) => (d.id === editingDepartmentId ? 'bg-primary/10 ring-1 ring-inset ring-primary/40' : undefined)}
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
