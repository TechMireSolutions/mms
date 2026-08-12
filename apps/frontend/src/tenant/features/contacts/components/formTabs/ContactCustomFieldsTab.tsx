import React from "react";
import { ModuleCustomFieldsBlock } from "@/components/ui/ModuleCustomFieldsBlock";
import {
  listEnabledCustomContactFormFields,
  type Contact,
  type FieldDefinition,
  type CustomFieldConfig,
} from "@mms/shared";

export function ContactCustomFieldsTab({
  contactDraft,
  formInstanceId,
  customFields = [],
  getFieldError,
  updateDraft,
  hideWhenEmpty = false,
  className,
  fields = {},
  tabId = "custom",
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  customFields?: (FieldDefinition | CustomFieldConfig)[];
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
  fields?: Record<string, FieldDefinition[]>;
  tabId?: string;
}): React.JSX.Element | null {
  return (
    <ModuleCustomFieldsBlock<Contact>
      draft={contactDraft}
      formInstanceId={formInstanceId}
      fields={fields}
      customFields={customFields}
      tabId={tabId}
      getFieldError={getFieldError}
      updateDraft={updateDraft}
      hideWhenEmpty={hideWhenEmpty}
      className={className}
      listCustomFields={listEnabledCustomContactFormFields}
      idPrefix="cf"
      emptyKey="contacts.form.customFieldsEmpty"
    />
  );
}


