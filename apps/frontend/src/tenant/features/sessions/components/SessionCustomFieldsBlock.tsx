import type React from "react";
import { ModuleCustomFieldsBlock } from "@/components/ui/ModuleCustomFieldsBlock";
import {
  listEnabledCustomSessionFormFields,
  type CustomFieldConfig,
  type FieldDefinition,
} from "@mms/shared";
import type { SessionFormDraft } from "@/tenant/features/sessions/components/sessionFormShared";

interface SessionCustomFieldsBlockProps {
  sessionDraft: SessionFormDraft;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  customFields?: (FieldDefinition | CustomFieldConfig)[];
  tabId: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<SessionFormDraft>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
}

export function SessionCustomFieldsBlock(
  props: SessionCustomFieldsBlockProps,
): React.JSX.Element | null {
  return (
    <ModuleCustomFieldsBlock<SessionFormDraft>
      draft={props.sessionDraft}
      formInstanceId={props.formInstanceId}
      fields={props.fields}
      customFields={props.customFields}
      tabId={props.tabId}
      getFieldError={props.getFieldError}
      updateDraft={props.updateDraft}
      hideWhenEmpty={props.hideWhenEmpty}
      className={props.className}
      listCustomFields={listEnabledCustomSessionFormFields}
      idPrefix="ssf"
      emptyKey="sessions.form.customFieldsEmpty"
    />
  );
}