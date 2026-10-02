import React from 'react';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  return (
    <div className="rounded-md border border-border/80 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold">{t('faculty.setup.departmentName')}</TableHead>
            <TableHead className="font-semibold w-32">{t('faculty.setup.departmentCode')}</TableHead>
            <TableHead className="font-semibold">{t('faculty.setup.parentDepartment')}</TableHead>
            <TableHead className="font-semibold w-24 text-end">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderedDepartments.map((dept) => {
            const isEditing = editingDepartmentId === dept.id;
            const parentName = dept.parentId ? parentMap.get(dept.parentId) : undefined;

            return (
              <TableRow
                key={dept.id}
                className={`transition-colors ${
                  isEditing
                    ? 'bg-primary/10 border-primary/40 ring-1 ring-inset ring-primary/40'
                    : 'hover:bg-muted/50'
                }`}
              >
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {dept.parentId && (
                      <ChevronRight className="size-3 text-muted-foreground shrink-0 ms-2" aria-hidden />
                    )}
                    <span>{dept.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {dept.code}
                  </code>
                </TableCell>
                <TableCell className="py-2.5 text-xs text-muted-foreground">
                  {parentName ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="py-2.5 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(dept)}
                      disabled={isPending}
                      className="size-8 p-0 hover:text-primary"
                      aria-label={`${t('common.edit')} ${dept.name}`}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(dept)}
                      disabled={isPending}
                      className="size-8 p-0 hover:text-destructive hover:bg-destructive/10"
                      aria-label={`${t('common.delete')} ${dept.name}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {orderedDepartments.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                {t('faculty.setup.noDepartments')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
