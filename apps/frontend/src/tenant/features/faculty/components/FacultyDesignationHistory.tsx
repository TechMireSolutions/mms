import { Award, Plus, RefreshCw } from 'lucide-react';
import type { FacultyMember } from '@mms/shared';
import { Card } from '@/components/ui/card';
import { DetailSectionTitle } from '@/components/ui/DetailSectionTitle';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { FacultyDesignationFormCard } from './FacultyDesignationFormCard';
import { FacultyDesignationHistoryItem } from './FacultyDesignationHistoryItem';
import {
  EMPTY_DESIGNATION_FORM,
  useFacultyDesignationHistoryController,
} from '../hooks/useFacultyDesignationHistoryController';

/** Fully dynamic designation history with transition, edit, add, and delete flows. */
export function FacultyDesignationHistory({
  faculty,
  canEdit = false,
}: {
  faculty: FacultyMember;
  canEdit?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const {
    history,
    mode,
    setMode,
    form,
    setForm,
    today,
    allAssignments,
    currentAssignment,
    activeDefinitionOptions,
    reset,
    openEdit,
    patchForm,
    handleDelete,
    handleSubmit,
    isBusy,
    canDeleteAny,
    minTransitionDate,
    deleteMutation,
  } = useFacultyDesignationHistoryController(faculty);

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
                onClick={() => { setMode('transition'); setForm({ ...EMPTY_DESIGNATION_FORM, startsOn: today }); }}
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
              onClick={() => { setMode('add'); setForm({ ...EMPTY_DESIGNATION_FORM, startsOn: today }); }}
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
                onClick={() => { setMode('add'); setForm({ ...EMPTY_DESIGNATION_FORM, startsOn: today }); }}
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
