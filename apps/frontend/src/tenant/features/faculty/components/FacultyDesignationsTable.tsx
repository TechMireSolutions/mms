import React from 'react';
import { Award, Pencil } from 'lucide-react';
import type { FacultyDesignationDefinition } from '@mms/shared';
import { resolveRoleDisplayName, type WorkspaceRole } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
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

export interface FacultyDesignationsTableProps {
  designations: FacultyDesignationDefinition[];
  roles?: readonly WorkspaceRole[];
  editingDesignationId?: string;
  isPending: boolean;
  isLoading?: boolean;
  onEdit: (designation: FacultyDesignationDefinition) => void;
}

export function FacultyDesignationsTable({
  designations,
  roles = [],
  editingDesignationId,
  isPending,
  isLoading = false,
  onEdit,
}: FacultyDesignationsTableProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-border/80 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold">{t('faculty.designations.name')}</TableHead>
            <TableHead className="font-semibold w-28">{t('faculty.designations.code')}</TableHead>
            <TableHead className="font-semibold w-24 text-center">{t('faculty.form.hierarchyRank')}</TableHead>
            <TableHead className="font-semibold w-24 text-center">{t('common.status')}</TableHead>
            <TableHead className="font-semibold">{t('faculty.designations.roles')}</TableHead>
            <TableHead className="font-semibold w-20 text-end">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {designations.map((designation) => {
            const isEditing = editingDesignationId === designation.id;

            return (
              <TableRow
                key={designation.id}
                className={`transition-colors ${
                  isEditing
                    ? 'bg-primary/10 border-primary/40 ring-1 ring-inset ring-primary/40'
                    : designation.isActive
                      ? 'hover:bg-muted/50'
                      : 'opacity-70 hover:bg-muted/50'
                }`}
              >
                <TableCell className="py-2.5 font-medium">
                  <span>{designation.name}</span>
                </TableCell>
                <TableCell className="py-2.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {designation.code}
                  </code>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <Badge variant="outline" className="font-mono text-xs font-normal">
                    {designation.hierarchyRank}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 text-center">
                  <Badge
                    variant={designation.isActive ? 'default' : 'secondary'}
                    className={`text-xs ${!designation.isActive ? 'line-through opacity-80' : ''}`}
                  >
                    {designation.isActive ? t('faculty.status.active') : t('faculty.status.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {designation.assignableRoles.map((roleId) => (
                      <Badge key={roleId} variant="secondary" className="text-[10px] font-normal">
                        {resolveRoleDisplayName(roleId, roles, t)}
                      </Badge>
                    ))}
                    {designation.assignableRoles.length === 0 && (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(designation)}
                    disabled={isPending}
                    className="size-8 p-0 hover:text-primary"
                    aria-label={`${t('common.edit')} ${designation.name}`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {designations.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                  <Award className="size-6 text-muted-foreground/40" aria-hidden />
                  <span>{t('faculty.designations.setupHint')}</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
