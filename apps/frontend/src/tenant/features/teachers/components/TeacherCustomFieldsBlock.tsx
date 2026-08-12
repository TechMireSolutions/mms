import React from "react";
import {
  listEnabledCustomTeacherFormFields,
  type CustomFieldConfig,
  type FieldDefinition,
  type Teacher,
} from "@mms/shared";
import { ModuleCustomFieldsBlock } from "@/components/ui/ModuleCustomFieldsBlock";

interface TeacherCustomFieldsBlockProps {
  teacherDraft: Partial<Teacher>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  customFields?: (FieldDefinition | CustomFieldConfig)[];
  tabId: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Teacher>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
}

/** Teachers custom-fields block — thin adapter over the shared module block. */
export function TeacherCustomFieldsBlock({
  teacherDraft,
  formInstanceId,
  fields,
  customFields,
  tabId,
  getFieldError,
  updateDraft,
  hideWhenEmpty = true,
  className,
}: TeacherCustomFieldsBlockProps): React.JSX.Element | null {
  return (
    <ModuleCustomFieldsBlock<Teacher>
      draft={teacherDraft}
      formInstanceId={formInstanceId}
      fields={fields}
      customFields={customFields}
      tabId={tabId}
      getFieldError={getFieldError}
      updateDraft={updateDraft}
      hideWhenEmpty={hideWhenEmpty}
      className={className}
      listCustomFields={listEnabledCustomTeacherFormFields}
      idPrefix="tf"
      emptyKey="teachers.form.customFieldsEmpty"
    />
  );
}

