/**
 * @file FacultyAssignmentListItem.tsx
 * @description One appointment row with hierarchy strips and overflow actions.
 */

import type React from 'react';
import type { FacultyAssignmentEntity } from '@mms/shared';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ModuleRowActionsMenu } from '@/components/ui/ModuleRowActionsMenu';
import { useTranslation } from '@/hooks/useTranslation';
import { FacultyAssignmentReportingChain } from './FacultyAssignmentReportingChain';
import { FacultyAssignmentSubordinates } from './FacultyAssignmentSubordinates';

export function FacultyAssignmentListItem({
  assignment,
  positionLabel,
  canEdit,
  busy,
  onEdit,
  onClose,
  onDelete,
}: {
  assignment: FacultyAssignmentEntity;
  positionLabel: string;
  canEdit: boolean;
  busy: boolean;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const active = assignment.status === 'active' && !assignment.endDate;

  return (
    <div className="group flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground truncate">
          {assignment.designationName ?? assignment.designationId}
          {assignment.isPrimary ? ` · ${t('faculty.assignments.primaryBadge')}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {assignment.departmentName ?? assignment.departmentId}
          {' · '}
          {positionLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {assignment.startDate}
          {' – '}
          {assignment.endDate ?? t('faculty.designations.present')}
        </p>
        {assignment.isPrimary ? (
          <>
            <FacultyAssignmentReportingChain assignmentId={assignment.id} />
            <FacultyAssignmentSubordinates assignmentId={assignment.id} />
          </>
        ) : null}
      </div>
      {canEdit ? (
        <ModuleRowActionsMenu
          triggerLabel={t('faculty.assignments.rowActions')}
          editLabel={t('common.edit')}
          deleteLabel={t('common.delete')}
          archived={false}
          canWrite={!busy}
          canDelete={!busy}
          hideViewItem
          onEdit={onEdit}
          onDelete={onDelete}
          triggerClassName="min-w-11 min-h-11 p-0 flex items-center justify-center rounded-lg border border-border/50 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-none"
          extras={
            active ? (
              <DropdownMenuItem onClick={onClose} disabled={busy}>
                {t('faculty.assignments.close')}
              </DropdownMenuItem>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}
