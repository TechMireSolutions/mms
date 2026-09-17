import type { Contact, FieldDefinition, Teacher } from "@mms/shared";
import {
  TeacherContactSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { TeacherNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";
import React from "react";

export interface TeacherFormTabContentProps {
  formInstanceId: string;
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  defaultSpecialization: string;
  linkedTeacherContactIds: Array<string | number>;
  specializationOptions: string[];
  designationOptions?: string[];
  onUpdateDesignations?: (options: string[]) => void;
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: TeacherStatusOption[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  onDraftChange: (patch: Partial<Teacher>) => void;
  linkedContact?: Contact | null;
  userAccountDraft?: FacultyUserAccountDraft;
  onUserAccountDraftChange?: (draft: FacultyUserAccountDraft) => void;
}

const DEFAULT_USER_ACCOUNT_DRAFT: FacultyUserAccountDraft = {
  enabled: false,
  role: "teacher",
  setupMethod: "password",
};

export const TeacherFormTabContent = (function TeacherFormTabContent({
  teacher,
  teacherDraft,
  errors,
  fields,
  defaultSpecialization,
  linkedTeacherContactIds,
  specializationOptions,
  designationOptions,
  onUpdateDesignations,
  autoGenerateId,
  idPrefix,
  nextEmployeeId,
  onRegenerateEmployeeId,
  isFetchingNextEmployeeId,
  statusOptions,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  linkedContact,
  userAccountDraft = DEFAULT_USER_ACCOUNT_DRAFT,
  onUserAccountDraftChange = () => {},
}: TeacherFormTabContentProps): React.JSX.Element {
  return (
    <div className="space-y-6 pb-6">
      {/* Top Section: Contact Association */}
      <TeacherContactSection
        teacherDraft={teacherDraft}
        linkedContact={linkedContact}
        linkedTeacherContactIds={linkedTeacherContactIds}
        errors={errors}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />

      {/* Entity Details */}
      <TeacherEmploymentSection
        teacher={teacher}
        teacherDraft={teacherDraft}
        errors={errors}
        fields={fields}
        autoGenerateId={autoGenerateId}
        idPrefix={idPrefix}
        nextEmployeeId={nextEmployeeId}
        onRegenerateEmployeeId={onRegenerateEmployeeId}
        isFetchingNextEmployeeId={isFetchingNextEmployeeId}
        statusOptions={statusOptions}
        designationOptions={designationOptions}
        onUpdateDesignations={onUpdateDesignations}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />
      <TeacherNotesSection
        notes={teacherDraft.notes}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />

      {/* System Login Account & Dynamic RBAC Role */}
      <FacultyUserAccountSection
        teacherDraft={teacherDraft}
        linkedContact={linkedContact}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        errors={errors}
      />
    </div>
  );
});

export type FacultyFormTabContentProps = TeacherFormTabContentProps;
export const FacultyFormTabContent = TeacherFormTabContent;

