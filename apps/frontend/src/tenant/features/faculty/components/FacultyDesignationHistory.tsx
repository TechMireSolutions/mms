import { useState } from 'react';
import { Award, Plus, RefreshCw } from 'lucide-react';
import type { FacultyDesignationAssignment, FacultyMember } from '@mms/shared';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  useFacultyDesignationHistory,
  useFacultyDesignations,
  useSaveFacultyDesignationAssignment,
  useDeleteFacultyDesignationAssignment,
  useTransitionFacultyDesignation,
} from '../hooks/useFacultyDesignations';
import {
  FacultyDesignationFormCard,
  type DesignationAssignmentFormState,
  type DesignationHistoryMode,
} from './FacultyDesignationFormCard';
import { FacultyDesignationHistoryItem } from './FacultyDesignationHistoryItem';

const EMPTY_FORM: DesignationAssignmentFormState = {
  id: '',
  designationId: '',
  startsOn: new Date().toISOString().slice(0, 10),
  endsOn: '',
  notes: '',
};

/** Fully dynamic designation history with transition, edit, add, and delete flows. */
export function FacultyDesignationHistory({
  faculty,
  canEdit = false,
}: {
  faculty: FacultyMember;
  canEdit?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const history = useFacultyDesignationHistory(String(faculty.id));
  const definitions = useFacultyDesignations();
  const save = useSaveFacultyDesignationAssignment();
  const deleteMutation = useDeleteFacultyDesignationAssignment();
  const transition = useTransitionFacultyDesignation();

  const [mode, setMode] = useState<DesignationHistoryMode>('idle');
  const [form, setForm] = useState<DesignationAssignmentFormState>(EMPTY_FORM);

  const today = new Date().toISOString().slice(0, 10);
  const allAssignments = history.data ?? [];
  const currentAssignment: FacultyDesignationAssignment | null =
    allAssignments.find(
      (a) => a.startsOn <= today && (!a.endsOn || a.endsOn >= today),
    ) ?? null;

  const activeDefinitionOptions = (definitions.data ?? [])
    .filter((d) => d.isActive || d.id === form.designationId)
    .map((d) => ({ value: d.id, label: d.name }));

  const reset = () => {
    setMode('idle');
    setForm(EMPTY_FORM);
  };

  const openEdit = (assignment: FacultyDesignationAssignment) => {
    setMode('edit');
    setForm({
      id: assignment.id,
      designationId: assignment.designationId,
      startsOn: assignment.startsOn,
      endsOn: assignment.endsOn ?? '',
      notes: assignment.notes ?? '',
    });
  };

  const patchForm = (patch: Partial<DesignationAssignmentFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleTransitionSubmit = async () => {
    if (!form.designationId || !form.startsOn) return;
    try {
      await transition.mutateAsync({
        facultyId: String(faculty.id),
        currentAssignment,
        newDesignationId: form.designationId,
        transitionDate: form.startsOn,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.transitionSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleEditSubmit = async () => {
    if (!form.designationId || !form.startsOn || !form.id) return;
    try {
      await save.mutateAsync({
        id: form.id,
        facultyId: String(faculty.id),
        designationId: form.designationId,
        startsOn: form.startsOn,
        endsOn: form.endsOn || null,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.assignmentSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleAddSubmit = async () => {
    if (!form.designationId || !form.startsOn) return;
    try {
      await save.mutateAsync({
        id: crypto.randomUUID(),
        facultyId: String(faculty.id),
        designationId: form.designationId,
        startsOn: form.startsOn,
        endsOn: form.endsOn || null,
        notes: form.notes.trim() || null,
      });
      notify.success(t('faculty.designations.assignmentSaved'));
      reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const handleDelete = async (assignment: FacultyDesignationAssignment) => {
    try {
      await deleteMutation.mutateAsync({
        facultyId: String(faculty.id),
        assignmentId: assignment.id,
      });
      notify.success(t('faculty.designations.assignmentDeleted'));
      if (mode === 'edit' && form.id === assignment.id) reset();
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : t('faculty.designations.assignmentFailed'),
      );
    }
  };

  const isBusy = save.isPending || deleteMutation.isPending || transition.isPending;
  const canDeleteAny = allAssignments.length > 1;

  const handleSubmit =
    mode === 'transition'
      ? () => void handleTransitionSubmit()
      : mode === 'edit'
        ? () => void handleEditSubmit()
        : () => void handleAddSubmit();

  const minTransitionDate = (() => {
    if (!currentAssignment) return undefined;
    const d = new Date(`${currentAssignment.startsOn}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DetailSectionTitle>{t('faculty.designations.history')}</DetailSectionTitle>
        {canEdit && mode === 'idle' && (
          <div className="flex gap-1.5">
            {currentAssignment && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => { setMode('transition'); setForm({ ...EMPTY_FORM, startsOn: today }); }}
              >
                <RefreshCw className="size-3" aria-hidden />
                {t('faculty.designations.transition')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => { setMode('add'); setForm({ ...EMPTY_FORM, startsOn: today }); }}
            >
              <Plus className="size-3" aria-hidden />
              {t('common.add')}
            </Button>
          </div>
        )}
      </div>

      {canEdit && mode !== 'idle' && (
        <FacultyDesignationFormCard
          mode={mode}
          form={form}
          activeDefinitionOptions={activeDefinitionOptions}
          minTransitionDate={minTransitionDate}
          isBusy={isBusy}
          onPatchForm={patchForm}
          onSubmit={handleSubmit}
          onCancel={reset}
        />
      )}

      <Card className="divide-y divide-border/50 p-0">
        {allAssignments.map((assignment) => {
          const isCurrent =
            assignment.startsOn <= today && (!assignment.endsOn || assignment.endsOn >= today);
          const isEditing = mode === 'edit' && form.id === assignment.id;

          return (
            <FacultyDesignationHistoryItem
              key={assignment.id}
              assignment={assignment}
              isCurrent={isCurrent}
              isEditing={isEditing}
              canEdit={canEdit}
              canDeleteAny={canDeleteAny}
              isDeletePending={deleteMutation.isPending}
              onToggleEdit={() => (isEditing ? reset() : openEdit(assignment))}
              onDelete={() => void handleDelete(assignment)}
            />
          );
        })}

        {!history.isPending && allAssignments.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Award className="size-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">{t('faculty.designations.noHistory')}</p>
            {canEdit && mode === 'idle' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setMode('add'); setForm({ ...EMPTY_FORM, startsOn: today }); }}
              >
                <Plus className="size-3.5" aria-hidden />
                {t('faculty.designations.addFirst')}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
