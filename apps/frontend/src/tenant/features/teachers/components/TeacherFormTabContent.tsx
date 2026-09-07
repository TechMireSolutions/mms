import type { Contact, FieldDefinition, Teacher } from "@mms/shared";
import {
  TeacherBasicSection,
  TeacherContactSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/teachers/components/TeacherFormSections";
import { TeacherNotesSection } from "@/tenant/features/teachers/components/TeacherNotesSection";
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
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  statusOptions: TeacherStatusOption[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  onDraftChange: (patch: Partial<Teacher>) => void;
  linkedContact?: Contact | null;
}

export const TeacherFormTabContent = (function TeacherFormTabContent({
  teacher,
  teacherDraft,
  errors,
  fields,
  defaultSpecialization,
  linkedTeacherContactIds,
  specializationOptions,
  autoGenerateId,
  idPrefix,
  nextEmployeeId,
  statusOptions,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  linkedContact,
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

      {/* Bottom Section: Entity Details */}
      <TeacherEmploymentSection
        teacher={teacher}
        teacherDraft={teacherDraft}
        errors={errors}
        fields={fields}
        autoGenerateId={autoGenerateId}
        idPrefix={idPrefix}
        nextEmployeeId={nextEmployeeId}
        statusOptions={statusOptions}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />
      <TeacherBasicSection
        teacherDraft={teacherDraft}
        errors={errors}
        fields={fields}
        defaultSpecialization={defaultSpecialization}
        specializationOptions={specializationOptions}
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
    </div>
  );
});
