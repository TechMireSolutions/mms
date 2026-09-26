import React from "react";
import type {
  Contact,
  Faculty,
  FacultyDesignationDefinition,
  FacultyHierarchyPreset,
  FieldDefinition,
  Teacher,
} from "@mms/shared";
import {
  TeacherContactSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { TeacherNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
  type LinkedUserInfo,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface FacultyFormAllSectionsProps {
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  linkedTeacherContactIds: Array<string | number>;
  specializationOptions: string[];
  designationOptions?: FacultyDesignationDefinition[];
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: TeacherStatusOption[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
  linkedContact?: Contact | null;
  linkedUser?: LinkedUserInfo | null;
  userAccountDraft: FacultyUserAccountDraft;
  onUserAccountDraftChange: (draft: FacultyUserAccountDraft) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyFormAllSections(props: FacultyFormAllSectionsProps): React.JSX.Element {
  const {
    teacher,
    teacherDraft,
    errors,
    fields,
    linkedTeacherContactIds,
    specializationOptions,
    designationOptions,
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
    linkedUser,
    userAccountDraft,
    onUserAccountDraftChange,
    supervisorCandidates,
    hierarchyRankPresets,
  } = props;

  return (
    <div className="space-y-6 pb-6">
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
        specializationOptions={specializationOptions}
        designationOptions={designationOptions}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        supervisorCandidates={supervisorCandidates}
        hierarchyRankPresets={hierarchyRankPresets}
      />

      <TeacherNotesSection
        notes={teacherDraft.notes}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        error={errors.notes}
      />

      <FacultyUserAccountSection
        teacherDraft={teacherDraft}
        linkedContact={linkedContact}
        linkedUser={linkedUser}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        errors={errors}
      />
    </div>
  );
}
