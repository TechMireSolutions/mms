import { useState } from 'react';
import { Award, Plus } from 'lucide-react';
import type { FacultyMember } from '@mms/shared';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/FormPrimitives';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  useFacultyDesignationHistory,
  useFacultyDesignations,
  useSaveFacultyDesignationAssignment,
} from '../hooks/useFacultyDesignations';

/** Read-only temporal designation history; writes are managed from Faculty Setup. */
export function FacultyDesignationHistory({ faculty, canEdit = false }: { faculty: FacultyMember; canEdit?: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  const history = useFacultyDesignationHistory(String(faculty.id));
  const definitions = useFacultyDesignations();
  const save = useSaveFacultyDesignationAssignment();
  const today = new Date().toISOString().slice(0, 10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [designationId, setDesignationId] = useState('');
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setEditingId(null);
    setDesignationId('');
    setStartsOn(today);
    setEndsOn('');
    setNotes('');
  };

  const submit = async () => {
    if (!designationId || !startsOn) return;
    try {
      await save.mutateAsync({
        id: editingId ?? crypto.randomUUID(),
        facultyId: String(faculty.id),
        designationId,
        startsOn,
        endsOn: endsOn || null,
        notes: notes.trim() || null,
      });
      notify.success(t('faculty.designations.assignmentSaved'));
      reset();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'));
    }
  };

  const edit = (assignment: NonNullable<typeof history.data>[number]) => {
    setEditingId(assignment.id);
    setDesignationId(assignment.designationId);
    setStartsOn(assignment.startsOn);
    setEndsOn(assignment.endsOn ?? '');
    setNotes(assignment.notes ?? '');
  };

  const options = (definitions.data ?? [])
    .filter((definition) => definition.isActive || definition.id === designationId)
    .map((definition) => ({ value: definition.id, label: definition.name }));

  return (
    <div className="space-y-2">
      <DetailSectionTitle>{t('faculty.designations.history')}</DetailSectionTitle>
      {canEdit ? (
        <Card className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="faculty-designation-id" label={t('faculty.designations.name')} required>
              <FormSelect id="faculty-designation-id" value={designationId} onChange={setDesignationId} options={options} />
            </Field>
            <Field id="faculty-designation-start" label={t('faculty.designations.startsOn')} required>
              <Input id="faculty-designation-start" type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
            </Field>
            <Field id="faculty-designation-end" label={t('faculty.designations.endsOn')}>
              <Input id="faculty-designation-end" type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} />
            </Field>
            <Field id="faculty-designation-notes" label={t('faculty.designations.notes')}>
              <Input id="faculty-designation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            {editingId ? <Button type="button" variant="outline" onClick={reset}>{t('common.cancel')}</Button> : null}
            <Button type="button" onClick={() => void submit()} disabled={!designationId || !startsOn || save.isPending}>
              <Plus className="size-4" aria-hidden />
              {t('common.save')}
            </Button>
          </div>
        </Card>
      ) : null}
      <Card className="divide-y divide-border/50 p-0">
        {(history.data ?? []).map((assignment) => {
          const current = assignment.startsOn <= today && (!assignment.endsOn || assignment.endsOn >= today);
          return (
            <button key={assignment.id} type="button" disabled={!canEdit} onClick={() => canEdit && edit(assignment)} className="flex min-h-11 w-full items-start gap-3 px-4 py-3 text-start disabled:cursor-default">
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
            </button>
          );
        })}
        {!history.isPending && !history.data?.length ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">{t('faculty.designations.noHistory')}</p>
        ) : null}
      </Card>
    </div>
  );
}
