import { Field } from "@/components/ui/FormPrimitives";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import { cn } from "@/lib/utils";
import type { FieldDefinition } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface ContactCustomFieldControlItem {
  field: FieldDefinition;
  fieldId: string;
  value: unknown;
  error?: string;
  onChange: (nextValue: unknown) => void;
}

/** Shared Field + CustomFieldInput grid for custom scalar / collection form tabs. */
export function ContactCustomFieldControls({
  items,
  t,
  className,
}: {
  items: ContactCustomFieldControlItem[];
  t: TranslationFunction;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("grid grid-cols-1 gap-4 @md:grid-cols-2", className)}>
      {items.map(({ field, fieldId, value, error, onChange }) => {
        const inputField: FieldDefinition = { ...field, key: fieldId };
        return (
          <div
            key={field.key}
            className={field.type === "textarea" || field.type === "tags" || field.type === "datetime" ? "@md:col-span-2" : undefined}
          >
            <Field
              label={resolveRegistryLabel(field, t)}
              required={field.required}
              error={error}
              id={fieldId}
            >
              <CustomFieldInput
                field={inputField}
                value={value}
                onChange={onChange}
                error={Boolean(error)}
              />
            </Field>
          </div>
        );
      })}
    </div>
  );
}
