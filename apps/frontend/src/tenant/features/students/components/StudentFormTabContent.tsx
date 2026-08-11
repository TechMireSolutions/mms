import type React from "react";
import type { Contact, FieldDefinition, Student } from "@mms/shared";
import {
  StudentContactSection,
  StudentGuardianSection,
  StudentNotesSection,
  StudentRegistrationSection,
  type StudentFieldErrorGetter,
  type StudentStatusSelectOption,
} from "@/tenant/features/students/components/StudentFormSections";
import { StudentCustomFieldsBlock } from "@/tenant/features/students/components/StudentCustomFieldsBlock";

interface StudentFormTabContentProps {
  tab: string;
  formInstanceId: string;
  studentDraft: Partial<Student>;
  linkedContact?: Contact | null;
  linkedGenderRaw?: string;
  linkedGenderLabel: string;
  linkedDob: string;
  excludeIds: string[];
  isGrAutoAssigned: boolean;
  grInputDisabled: boolean;
  statusSelectOptions: StudentStatusSelectOption[];
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: StudentFieldErrorGetter;
  onContactSelect: (id: string | number | null) => void;
  onStudentAvatarChange: (avatarUrl: string) => void | Promise<void>;
  onGrNumberChange: (value: string) => void;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentFormTabContent({
  tab,
  formInstanceId,
  studentDraft,
  linkedContact,
  linkedGenderRaw,
  linkedGenderLabel,
  linkedDob,
  excludeIds,
  isGrAutoAssigned,
  grInputDisabled,
  statusSelectOptions,
  fields,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  onContactSelect,
  onStudentAvatarChange,
  onGrNumberChange,
  onDraftChange,
}: StudentFormTabContentProps): React.JSX.Element {
  if (tab === "registration") {
    return (
      <div className="space-y-6 pb-6">
        <StudentRegistrationSection
          studentDraft={studentDraft}
          isGrAutoAssigned={isGrAutoAssigned}
          grInputDisabled={grInputDisabled}
          statusSelectOptions={statusSelectOptions}
          fields={fields}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          onGrNumberChange={onGrNumberChange}
          onDraftChange={onDraftChange}
        />
        <StudentNotesSection
          notes={studentDraft.notes}
          fields={fields}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
        />
        <StudentCustomFieldsBlock
          studentDraft={studentDraft}
          formInstanceId={formInstanceId}
          fields={fields}
          tabId="registration"
          getFieldError={getFieldError}
          updateDraft={onDraftChange}
        />
      </div>
    );
  }

  if (tab === "basic") {
    return (
      <div className="space-y-6 pb-6">
        <StudentContactSection
          contactId={studentDraft.contactId}
          excludeIds={excludeIds}
          linkedGenderRaw={linkedGenderRaw}
          linkedGenderLabel={linkedGenderLabel}
          linkedDob={linkedDob}
          genderError={getFieldError("gender")}
          dobError={getFieldError("dob")}
          fields={fields}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          onContactSelect={onContactSelect}
          onStudentAvatarChange={onStudentAvatarChange}
        />
        <StudentGuardianSection
          formInstanceId={formInstanceId}
          studentDraft={studentDraft}
          linkedContact={linkedContact}
          isFieldEnabled={isFieldEnabled}
        />
        <StudentCustomFieldsBlock
          studentDraft={studentDraft}
          formInstanceId={formInstanceId}
          fields={fields}
          tabId="basic"
          getFieldError={getFieldError}
          updateDraft={onDraftChange}
        />
      </div>
    );
  }

  // Setup custom tabs — customs only for that tabId.
  return (
    <div className="space-y-6 pb-6">
      <StudentCustomFieldsBlock
        studentDraft={studentDraft}
        formInstanceId={formInstanceId}
        fields={fields}
        tabId={tab}
        getFieldError={getFieldError}
        updateDraft={onDraftChange}
        hideWhenEmpty={false}
      />
    </div>
  );
}
