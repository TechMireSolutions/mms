import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

export interface DesignationAssignmentFormState {
  id: string;
  designationId: string;
  startsOn: string;
  endsOn: string;
  notes: string;
}

export type DesignationHistoryMode = 'idle' | 'transition' | 'edit' | 'add';

interface FacultyDesignationFormCardProps {
  mode: 'transition' | 'edit' | 'add';
  form: DesignationAssignmentFormState;
  activeDefinitionOptions: Array<{ value: string; label: string }>;
  minTransitionDate?: string;
  isBusy: boolean;
  onPatchForm: (patch: Partial<DesignationAssignmentFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function FacultyDesignationFormCard({
  mode,
  form,
  activeDefinitionOptions,
  minTransitionDate,
  isBusy,
  onPatchForm,
  onSubmit,
  onCancel,
}: FacultyDesignationFormCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const formTitle =
    mode === 'transition'
      ? t('faculty.designations.transitionTitle')
      : mode === 'edit'
        ? t('faculty.designations.editTitle')
        : t('faculty.designations.addTitle');

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">{formTitle}</p>
      {mode === 'transition' && (
        <p className="text-xs text-muted-foreground">
          {t('faculty.designations.transitionHint')}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="des-form-id" label={t('faculty.designations.name')} required>
          <FormSelect
            id="des-form-id"
            value={form.designationId}
            onChange={(v) => onPatchForm({ designationId: v })}
            options={activeDefinitionOptions}
          />
        </Field>
        <Field
          id="des-form-start"
          label={
            mode === 'transition'
              ? t('faculty.designations.transitionDate')
              : t('faculty.designations.startsOn')
          }
          required
        >
          <Input
            id="des-form-start"
            type="date"
            value={form.startsOn}
            min={mode === 'transition' ? minTransitionDate : undefined}
            onChange={(e) => onPatchForm({ startsOn: e.target.value })}
          />
        </Field>
        {mode !== 'transition' && (
          <Field id="des-form-end" label={t('faculty.designations.endsOn')}>
            <Input
              id="des-form-end"
              type="date"
              value={form.endsOn}
              min={form.startsOn || undefined}
              onChange={(e) => onPatchForm({ endsOn: e.target.value })}
            />
          </Field>
        )}
        <Field id="des-form-notes" label={t('faculty.designations.notes')}>
          <Input
            id="des-form-notes"
            value={form.notes}
            onChange={(e) => onPatchForm({ notes: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!form.designationId || !form.startsOn || isBusy}
        >
          {mode === 'transition' ? (
            <>
              <RefreshCw className="size-4" aria-hidden />
              {t('faculty.designations.transition')}
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden />
              {t('common.save')}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
