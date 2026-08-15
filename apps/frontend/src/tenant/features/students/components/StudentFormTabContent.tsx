import type { Contact, FieldDefinition, Student } from "@mms/shared";
import {
  StudentContactSection,
  StudentGuardianSection,
  StudentNotesSection,
  StudentRegistrationSection,
  type StudentFieldErrorGetter,
  type StudentStatusSelectOption,
} from "@/tenant/features/students/components/StudentFormSections";
import { normalizeStudentFormModalTab } from "@/tenant/features/students/components/studentFormTabs";
import React from "react";

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
  statuses?: string[];
  onUpdateStatuses?: (statuses: string[]) => void | Promise<void>;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: StudentFieldErrorGetter;
  onContactSelect: (id: string | number | null) => void;
  onStudentAvatarChange: (avatarUrl: string) => void | Promise<void>;
  onGrNumberChange: (value: string) => void;
  onDraftChange: (patch: Partial<Student>) => void;
}

export const StudentFormTabContent = React.memo(function StudentFormTabContent({
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
      statuses,
      onUpdateStatuses,
      fields,
      isFieldEnabled,
      isFieldRequired,
      getFieldError,
      onContactSelect,
      onStudentAvatarChange,
      onGrNumberChange,
      onDraftChange,
    }: StudentFormTabContentProps): React.JSX.Element {
      const normalizedTab = normalizeStudentFormModalTab(tab);
      if (normalizedTab === "registration") {
        return (
          <div className="space-y-6 pb-6">
            <StudentRegistrationSection
              studentDraft={studentDraft}
              isGrAutoAssigned={isGrAutoAssigned}
              grInputDisabled={grInputDisabled}
              statusSelectOptions={statusSelectOptions}
              statuses={statuses}
              onUpdateStatuses={onUpdateStatuses}
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
        </div>
      );
    });
