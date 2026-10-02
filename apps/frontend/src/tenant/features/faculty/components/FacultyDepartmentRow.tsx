import React from 'react';
import { ChevronRight, Pencil, X } from 'lucide-react';
import type { FacultyDepartmentEntity } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

export interface FacultyDepartmentRowProps {
  dept: FacultyDepartmentEntity;
  isEditing: boolean;
  isPending: boolean;
  parentName?: string;
  onEdit: (dept: FacultyDepartmentEntity) => void;
  onDelete: (dept: FacultyDepartmentEntity) => void;
}

export function FacultyDepartmentRow({
  dept,
  isEditing,
  isPending,
  parentName,
  onEdit,
  onDelete,
}: FacultyDepartmentRowProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Badge
      variant="secondary"
      className={`py-1.5 px-2.5 text-xs font-medium gap-1.5 transition-colors ${
        isEditing
          ? 'bg-primary/15 text-primary border-primary/40 ring-1 ring-primary'
          : 'bg-muted/60 hover:bg-muted text-foreground'
      }`}
    >
      {dept.parentId && (
        <span className="flex items-center text-muted-foreground" title={parentName ? `Parent: ${parentName}` : undefined}>
          <ChevronRight className="size-3" aria-hidden />
        </span>
      )}
      <span className="font-semibold">{dept.name}</span>
      <span className="text-muted-foreground font-mono text-[10px]">
        ({dept.code})
      </span>
      <button
        type="button"
        onClick={() => onEdit(dept)}
        disabled={isPending}
        className="p-0.5 rounded hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={`${t('common.edit')} ${dept.name}`}
      >
        <Pencil className="size-3" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onDelete(dept)}
        disabled={isPending}
        className="p-0.5 rounded hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={`${t('common.delete')} ${dept.name}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </Badge>
  );
}
