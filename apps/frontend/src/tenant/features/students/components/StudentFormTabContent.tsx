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

export interface StudentFormTabContentProps {
  tab: string;
  formInstanceId: string;
  studentDraft: Partial<Student>;
  linkedContact?: Contact | null;
  linkedGenderRaw?: string;
  linkedGenderLabel: string;
  linkedDob: string;
  excludeIds: string[];
  isGrAutoAssigned: boolean;
  statusSelectOptions: StudentStatusSelectOption[];
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
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
  statusSelectOptions,
  fields,
  isFieldEnabled,
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
          statusSelectOptions={statusSelectOptions}
          getFieldError={getFieldError}
          onGrNumberChange={onGrNumberChange}
          onDraftChange={onDraftChange}
        />
        <StudentNotesSection
          notes={studentDraft.notes}
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
