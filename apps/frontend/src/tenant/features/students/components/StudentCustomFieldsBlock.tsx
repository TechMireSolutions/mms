import type React from "react";
import { ModuleCustomFieldsBlock } from "@/components/ui/ModuleCustomFieldsBlock";
import {
  listEnabledCustomStudentFormFields,
  type CustomFieldConfig,
  type FieldDefinition,
  type Student,
} from "@mms/shared";

interface StudentCustomFieldsBlockProps {
  studentDraft: Partial<Student>;
  formInstanceId: string;
  fields: Record<string, FieldDefinition[]>;
  customFields?: (FieldDefinition | CustomFieldConfig)[];
  tabId: string;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Student>) => void;
  hideWhenEmpty?: boolean;
  className?: string;
}

export function StudentCustomFieldsBlock(
  props: StudentCustomFieldsBlockProps,
): React.JSX.Element | null {
  return (
    <ModuleCustomFieldsBlock<Student>
      draft={props.studentDraft}
      formInstanceId={props.formInstanceId}
      fields={props.fields}
      customFields={props.customFields}
      tabId={props.tabId}
      getFieldError={props.getFieldError}
      updateDraft={props.updateDraft}
      hideWhenEmpty={props.hideWhenEmpty}
      className={props.className}
      listCustomFields={listEnabledCustomStudentFormFields}
      idPrefix="sf"
      emptyKey="students.form.customFieldsEmpty"
    />
  );
}


