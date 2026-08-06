import type { JSX } from "react";
import { listEnabledCustomContactFormFields, type FieldDefinition } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ContactCustomFieldControls } from "./ContactCustomFieldControls";

/** Setup custom fields rendered inside a system list-tab row (phones, emails, …). */
export function ContactSubListCustomFields({
  tabId,
  fields,
  formInstanceId,
  rowIndex,
  row,
  getListItemError,
  onPatch,
}: {
  tabId: string;
  fields: Record<string, FieldDefinition[]>;
  formInstanceId: string;
  rowIndex: number;
  row: object;
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  onPatch: (patch: Record<string, unknown>) => void;
}): JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listEnabledCustomContactFormFields(fields, tabId);
  if (customFields.length === 0) return null;
  const values = row as Record<string, unknown>;

  return (
    <ContactCustomFieldControls
      t={t}
      className="mt-3"
      items={customFields.map((field) => ({
        field,
        fieldId: `cf-${formInstanceId}-${tabId}-${rowIndex}-${field.key}`,
        value: values[field.key],
        error: getListItemError(tabId, field.key, rowIndex),
        onChange: (nextValue: unknown) => {
          onPatch({ [field.key]: nextValue });
        },
      }))}
    />
  );
}

/** Seeds Setup default values for custom fields onto a new list row. */
export function withSubListCustomFieldDefaults<T extends Record<string, unknown>>(
  base: T,
  fields: Record<string, FieldDefinition[]>,
  tabId: string,
): T {
  const customFields = listEnabledCustomContactFormFields(fields, tabId);
  if (customFields.length === 0) return base;
  const next: Record<string, unknown> = { ...base };
  for (const field of customFields) {
    if (field.key in next) continue;
    next[field.key] = field.defaultValue ?? (field.type === "boolean" ? false : "");
  }
  return next as T;
}
