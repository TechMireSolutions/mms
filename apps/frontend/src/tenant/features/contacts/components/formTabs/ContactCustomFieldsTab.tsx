import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import {
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
} from "@mms/shared";
import { ContactCustomFieldControls } from "./ContactCustomFieldControls";

export function ContactCustomFieldsTab({
  contactDraft,
  formInstanceId,
  fields,
  tabId = "custom",
  getFieldError,
  updateDraft,
  hideWhenEmpty = false,
  className,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  /** Config tab whose non-seed fields to render (default: system Custom tab). */
  tabId?: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  /** When true, render nothing if this tab has no custom fields (e.g. embed under Basic). */
  hideWhenEmpty?: boolean;
  className?: string;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  const customFields = listEnabledCustomContactFormFields(fields, tabId);

  if (customFields.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <EmptyState title={t("contacts.form.customFieldsEmpty")} compact icon={null} />
    );
  }

  return (
    <ContactCustomFieldControls
      className={className}
      t={t}
      items={customFields.map((field) => {
        const fieldId = `cf-${formInstanceId}-${field.key}`;
        return {
          field,
          fieldId,
          value: (contactDraft as Record<string, unknown>)[field.key],
          error: getFieldError(field.key),
          onChange: (nextValue: unknown) =>
            updateDraft({ [field.key]: nextValue } as Partial<Contact>),
        };
      })}
    />
  );
}
