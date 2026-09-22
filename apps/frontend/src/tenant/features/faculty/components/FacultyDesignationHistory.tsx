import { Award } from 'lucide-react';
import type { FacultyMember } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { useTranslation } from '@/hooks/useTranslation';
import { useFacultyDesignationHistory } from '../hooks/useFacultyDesignations';

/** Read-only temporal designation history; writes are managed from Faculty Setup. */
export function FacultyDesignationHistory({ faculty }: { faculty: FacultyMember }): React.JSX.Element | null {
  const { t } = useTranslation();
  const history = useFacultyDesignationHistory(String(faculty.id));
  if (history.isPending || history.isError || !history.data?.length) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t('faculty.designations.history')}</DetailSectionTitle>
      <Card className="divide-y divide-border/50 p-0">
        {history.data.map((assignment) => {
          const current = assignment.startsOn <= today && (!assignment.endsOn || assignment.endsOn >= today);
          return (
            <div key={assignment.id} className="flex min-h-11 items-start gap-3 px-4 py-3">
              <Award className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{assignment.designationName}</span>
                  {current && <Badge variant="secondary">{t('faculty.designations.current')}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {assignment.startsOn} – {assignment.endsOn ?? t('faculty.designations.present')}
                </p>
                {assignment.assignableRoles?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {t('faculty.designations.roles')}: {assignment.assignableRoles.join(', ')}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
