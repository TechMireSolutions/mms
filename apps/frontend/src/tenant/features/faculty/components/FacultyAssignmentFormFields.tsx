/**
 * @file FacultyAssignmentFormFields.tsx
 * @description Field set for faculty appointment create/edit (FormModal body).
 */

import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { Field, FormSelectWithQuickCreate } from '@/components/ui/FormPrimitives';
import { Input } from '@/components/ui/input';
import { WarningCallout } from '@/components/ui/WarningCallout';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssignmentFormState } from '../hooks/useFacultyAssignmentsController';

export interface FacultyAssignmentFormFieldsProps {
  form: AssignmentFormState;
  departmentOptions: Array<{ value: string; label: string }>;
  designationOptions: Array<{ value: string; label: string }>;
  positionOptions: Array<{ value: string; label: string }>;
  requiresPosition: boolean;
  allowEmptyPosition: boolean;
  showLegacyPositionWarning: boolean;
  canAddCatalog?: boolean;
  onOpenAddDepartment?: () => void;
  onOpenAddDesignation?: () => void;
  onOpenAddPosition?: () => void;
  onPatchForm: (patch: Partial<AssignmentFormState>) => void;
}

export function FacultyAssignmentFormFields({
  form,
  departmentOptions,
  designationOptions,
  positionOptions,
  requiresPosition,
  allowEmptyPosition,
  showLegacyPositionWarning,
  canAddCatalog = false,
  onOpenAddDepartment,
  onOpenAddDesignation,
  onOpenAddPosition,
  onPatchForm,
}: FacultyAssignmentFormFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 py-1 text-start">
      <p className="text-xs text-muted-foreground">{t('faculty.assignments.positionHint')}</p>
      {showLegacyPositionWarning ? (
        <WarningCallout
          tone="warning"
          density="compact"
          description={t('faculty.assignments.legacyNullPositionWarning')}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="asgn-dept" label={t('faculty.form.department')} required>
          <FormSelectWithQuickCreate
            id="asgn-dept"
            value={form.departmentId}
            onChange={(v) => onPatchForm({ departmentId: v, positionId: '' })}
            options={departmentOptions}
            canAdd={canAddCatalog}
            onOpenAdd={onOpenAddDepartment}
            addAriaLabel={t('faculty.setup.addDepartment')}
          />
        </Field>
        <Field id="asgn-desig" label={t('faculty.designations.name')} required>
          <FormSelectWithQuickCreate
            id="asgn-desig"
            value={form.designationId}
            onChange={(v) => onPatchForm({ designationId: v, positionId: '' })}
            options={designationOptions}
            canAdd={canAddCatalog}
            onOpenAdd={onOpenAddDesignation}
            addAriaLabel={t('faculty.designations.addDesignation')}
          />
        </Field>
        <Field id="asgn-position" label={t('faculty.assignments.position')} required={requiresPosition}>
          <FormSelectWithQuickCreate
            id="asgn-position"
            value={form.positionId}
            onChange={(v) => onPatchForm({ positionId: v })}
            options={
              allowEmptyPosition
                ? [{ value: '', label: t('faculty.assignments.noPosition') }, ...positionOptions]
                : positionOptions
            }
            canAdd={canAddCatalog}
            onOpenAdd={onOpenAddPosition}
            addAriaLabel={t('organization.position.addTitle')}
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
    </div>
  );
}
