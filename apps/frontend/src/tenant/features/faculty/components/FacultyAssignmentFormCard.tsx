/**
 * @file FacultyAssignmentFormCard.tsx
 * @description Create/edit form for faculty_assignments including organization position occupancy.
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssignmentFormState } from '../hooks/useFacultyAssignmentsController';

interface FacultyAssignmentFormCardProps {
  mode: 'add' | 'edit';
  form: AssignmentFormState;
  departmentOptions: Array<{ value: string; label: string }>;
  designationOptions: Array<{ value: string; label: string }>;
  positionOptions: Array<{ value: string; label: string }>;
  isBusy: boolean;
  onPatchForm: (patch: Partial<AssignmentFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function FacultyAssignmentFormCard({
  mode,
  form,
  departmentOptions,
  designationOptions,
  positionOptions,
  isBusy,
  onPatchForm,
  onSubmit,
  onCancel,
}: FacultyAssignmentFormCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">
        {mode === 'edit' ? t('faculty.assignments.editTitle') : t('faculty.assignments.addTitle')}
      </p>
      <p className="text-xs text-muted-foreground">{t('faculty.assignments.positionHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="asgn-dept" label={t('faculty.form.department')} required>
          <FormSelect
            id="asgn-dept"
            value={form.departmentId}
            onChange={(v) => onPatchForm({ departmentId: v, positionId: '' })}
            options={departmentOptions}
          />
        </Field>
        <Field id="asgn-desig" label={t('faculty.designations.name')} required>
          <FormSelect
            id="asgn-desig"
            value={form.designationId}
            onChange={(v) => onPatchForm({ designationId: v, positionId: '' })}
            options={designationOptions}
          />
        </Field>
        <Field id="asgn-position" label={t('faculty.assignments.position')}>
          <FormSelect
            id="asgn-position"
            value={form.positionId}
            onChange={(v) => onPatchForm({ positionId: v })}
            options={[
              { value: '', label: t('faculty.assignments.noPosition') },
              ...positionOptions,
            ]}
          />
        </Field>
        <Field id="asgn-start" label={t('faculty.designations.startsOn')} required>
          <DatePicker
            id="asgn-start"
            name="startDate"
            value={form.startDate}
            onChange={(dateStr) => onPatchForm({ startDate: dateStr })}
          />
        </Field>
        <Field id="asgn-end" label={t('faculty.designations.endsOn')}>
          <DatePicker
            id="asgn-end"
            name="endDate"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(dateStr) => onPatchForm({ endDate: dateStr })}
          />
        </Field>
        <Field id="asgn-notes" label={t('faculty.designations.notes')}>
          <Input
            id="asgn-notes"
            value={form.notes}
            onChange={(e) => onPatchForm({ notes: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm min-h-11">
        <Checkbox
          checked={form.isPrimary}
          onCheckedChange={(checked) => onPatchForm({ isPrimary: checked === true })}
        />
        {t('faculty.assignments.isPrimary')}
      </label>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button type="button" variant="outline" disabled={isBusy} onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="button" disabled={isBusy} onClick={onSubmit}>
          {t('common.save')}
        </Button>
      </div>
    </Card>
  );
}
