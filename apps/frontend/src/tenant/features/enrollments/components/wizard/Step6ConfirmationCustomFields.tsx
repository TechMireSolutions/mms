import React from 'react';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

        if (!['studentId', 'sessionId', 'classId', 'notes'].includes(field.id)) {
          const rawValue = customFieldValues[field.id];
          const stringValue = typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : '';
          const boolValue = Boolean(rawValue);
          return (
            <div key={field.id}>
              <label className={FORM_LABEL}>
                {field.label} {field.required ? '*' : ''}
              </label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={`custom-${field.id}`}
                  name={field.id}
                  value={stringValue}
                  onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <FormSelect
                  id={`custom-${field.id}`}
                  name={field.id}
                  value={stringValue}
                  onChange={(val) => onCustomFieldChange(field.id, val)}
                  options={field.options || []}
                  placeholder={t('enrollments.wizard.step6SelectOption')}
                />
              ) : field.type === 'boolean' ? (
                <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                  <Checkbox
                    id={`custom-${field.id}`}
                    name={field.id}
                    checked={boolValue}
                    onCheckedChange={(checked) => onCustomFieldChange(field.id, checked)}
                  />
                  <span className="text-xs font-medium text-foreground">{field.label}</span>
                </label>
              ) : (
                <Input
                  id={`custom-${field.id}`}
                  name={field.id}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                  value={stringValue}
                  onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                  placeholder={field.placeholder || t('enrollments.wizard.step6EnterField', { label: field.label.toLowerCase() })}
                  required={field.required}
                />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
