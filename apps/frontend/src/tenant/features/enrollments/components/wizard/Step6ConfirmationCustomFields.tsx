import React from 'react';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Textarea } from '@/components/ui/textarea';
import { CustomFieldInput } from '@/components/ui/FormCustomFieldInput';
import { Field } from '@/components/ui/FormPrimitives';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnrollmentConfig } from '@/hooks/useStandardModuleConfig';

interface Step6ConfirmationCustomFieldsProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  customFieldValues: Record<string, unknown>;
  onCustomFieldChange: (id: string, value: unknown) => void;
}

export function Step6ConfirmationCustomFields({
  notes,
  onNotesChange,
  customFieldValues,
  onCustomFieldChange,
}: Step6ConfirmationCustomFieldsProps): React.ReactElement {
  const { t } = useTranslation();
  const { orderedFields: allOrderedFields, isFieldEnabled } = useEnrollmentConfig();

  const orderedFields = React.useMemo(
    () => allOrderedFields.filter((field) => !['studentId', 'sessionId', 'classId'].includes(field.id)),
    [allOrderedFields],
  );

  return (
    <div className="space-y-4">
      {orderedFields.map((field) => {
        const isEnabled = isFieldEnabled(field.id);
        if (!isEnabled) return null;

        if (field.id === 'notes') {
          return (
            <div key="notes">
              <label htmlFor="enrollment-notes" className={FORM_LABEL}>
                {t('attendance.columns.notes')} {field.required ? '*' : ''}
              </label>
              <Textarea
                id="enrollment-notes"
                name="notes"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder={t('enrollments.wizard.step6NotesPlaceholder')}
                className="min-h-[5rem]"
                required={field.required}
              />
            </div>
          );
        }

        if (['studentId', 'sessionId', 'classId', 'notes'].includes(field.id)) return null;

        // Use the shared CustomFieldInput component — eliminates the hand-rolled type-switch
        // that duplicated FormCustomFieldInput's rendering logic.
        const rawValue = customFieldValues[field.id];
        const adaptedField = {
          key: field.id,
          label: field.label,
          type: (field.type || "text") as "text" | "textarea" | "select" | "boolean" | "date" | "number" | "email" | "url" | "phone" | "currency" | "datetime" | "tags" | "file" | "rating",
          required: field.required,
          options: field.options,
          placeholder: field.placeholder,
          defaultValue: field.defaultValue,
        };
        return (
          <Field
            key={field.id}
            label={`${field.label}${field.required ? ' *' : ''}`}
            required={field.required}
            id={`custom-${field.id}`}
          >
            <CustomFieldInput
              field={adaptedField as any}
              value={rawValue}
              onChange={(value) => onCustomFieldChange(field.id, value)}
            />
          </Field>
        );
      })}
    </div>
  );
}