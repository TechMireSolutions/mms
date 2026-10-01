import React from "react";
import type {
  Contact,
  Faculty,
  FacultyDesignationDefinition,
  FacultyHierarchyPreset,
  FacultyMember,
  FieldDefinition,
} from "@mms/shared";
import {
  FacultyContactSection,
  FacultyEmploymentSection,
  type FacultyStatusOption,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { FacultyFormDesignationSection } from "@/tenant/features/faculty/components/FacultyFormDesignationSection";
import { FacultyNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
  type LinkedUserInfo,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export interface FacultyFormAllSectionsProps {
  faculty?: FacultyMember;
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  linkedFacultyContactIds?: Array<string | number>;
  specializationOptions: string[];
  departmentOptions?: string[];
  designationOptions?: FacultyDesignationDefinition[];
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: FacultyStatusOption[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  linkedContact?: Contact | null;
  linkedUser?: LinkedUserInfo | null;
  userAccountDraft: FacultyUserAccountDraft;
  onUserAccountDraftChange: (draft: FacultyUserAccountDraft) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyFormAllSections(props: FacultyFormAllSectionsProps): React.JSX.Element {
  const {
    faculty,
    facultyDraft = {},
    linkedFacultyContactIds = [],
    errors,
    fields,
    specializationOptions,
    departmentOptions,
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
      <FacultyContactSection
        facultyDraft={facultyDraft}
        linkedContact={linkedContact}
        linkedFacultyContactIds={linkedFacultyContactIds}
        errors={errors}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />

      <FacultyEmploymentSection
        faculty={faculty}
        facultyDraft={facultyDraft}
        errors={errors}
        fields={fields}
        autoGenerateId={autoGenerateId}
        idPrefix={idPrefix}
        nextEmployeeId={nextEmployeeId}
        onRegenerateEmployeeId={onRegenerateEmployeeId}
        isFetchingNextEmployeeId={isFetchingNextEmployeeId}
        statusOptions={statusOptions}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />

      <FacultyFormDesignationSection
        faculty={faculty}
        facultyDraft={facultyDraft}
        errors={errors}
        designationOptions={designationOptions}
        departmentOptions={departmentOptions}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        supervisorCandidates={supervisorCandidates}
        hierarchyRankPresets={hierarchyRankPresets}
      />

      <FacultyNotesSection
        notes={facultyDraft.notes}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        error={errors.notes}
      />

      <FacultyUserAccountSection
        facultyDraft={facultyDraft}
        linkedContact={linkedContact}
        linkedUser={linkedUser}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        errors={errors}
      />
    </div>
  );
}
