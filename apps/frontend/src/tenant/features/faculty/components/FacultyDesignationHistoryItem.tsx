import { Award, ChevronRight, Trash2 } from 'lucide-react';
import type { FacultyDesignationAssignment } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface FacultyDesignationHistoryItemProps {
  assignment: FacultyDesignationAssignment;
  isCurrent: boolean;
  isEditing: boolean;
  canEdit: boolean;
  canDeleteAny: boolean;
  isDeletePending: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
}

export function FacultyDesignationHistoryItem({
  assignment,
  isCurrent,
  isEditing,
  canEdit,
  canDeleteAny,
  isDeletePending,
  onToggleEdit,
  onDelete,
}: FacultyDesignationHistoryItemProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-11 items-start gap-3 px-4 py-3">
      <Award
        className={`mt-0.5 size-4 shrink-0 ${
          isCurrent ? 'text-primary' : 'text-muted-foreground'
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-medium ${
              isCurrent ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {assignment.designationName}
          </span>
          {isCurrent && (
            <Badge variant="secondary">{t('faculty.designations.current')}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {assignment.startsOn}
          {' \u2013 '}
          {assignment.endsOn ?? t('faculty.designations.present')}
        </p>
        {assignment.assignableRoles && assignment.assignableRoles.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {assignment.assignableRoles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs font-normal">
                {role}
              </Badge>
            ))}
          </div>
        )}
        {assignment.notes && (
          <p className="mt-0.5 text-xs text-muted-foreground">{assignment.notes}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleEdit}
            title={isEditing ? t('common.cancel') : t('common.edit')}
            aria-label={isEditing ? t('common.cancel') : t('common.edit')}
          >
            <ChevronRight
              className={`size-3.5 transition-transform ${isEditing ? 'rotate-90' : ''}`}
              aria-hidden
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={!canDeleteAny || isDeletePending}
            title={
              canDeleteAny
                ? t('faculty.designations.deleteAssignment')
                : t('faculty.designations.cannotDeleteSole')
            }
            aria-label={t('faculty.designations.deleteAssignment')}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
