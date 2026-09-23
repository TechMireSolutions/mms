import type {
  Contact,
  FieldDefinition,
  Teacher,
  Faculty,
  FacultyHierarchyPreset,
  FacultyDesignationDefinition,
} from "@mms/shared";
import {
  TeacherContactSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { FacultyFormDesignationSection } from "@/tenant/features/faculty/components/FacultyFormDesignationSection";
import { FacultyFormHierarchySection } from "@/tenant/features/faculty/components/FacultyFormHierarchySection";
import { TeacherNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";
import React from "react";

export interface TeacherFormTabContentProps {
  formInstanceId: string;
  activeTab?: string;
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  defaultSpecialization: string;
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
  getFieldError: (fieldId: string) => string | undefined;
  onDraftChange: (patch: Partial<Teacher>) => void;
  linkedContact?: Contact | null;
  userAccountDraft?: FacultyUserAccountDraft;
  onUserAccountDraftChange?: (draft: FacultyUserAccountDraft) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

const DEFAULT_USER_ACCOUNT_DRAFT: FacultyUserAccountDraft = {
  enabled: false,
  role: "teacher",
  setupMethod: "password",
};

export const TeacherFormTabContent = (function TeacherFormTabContent({
  activeTab,
  teacher,
  teacherDraft,
  errors,
  fields,
  defaultSpecialization,
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
  userAccountDraft = DEFAULT_USER_ACCOUNT_DRAFT,
  onUserAccountDraftChange = () => {},
  supervisorCandidates,
  hierarchyRankPresets,
}: TeacherFormTabContentProps): React.JSX.Element {
  if (activeTab === "contact") {
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
      </div>
    );
  }

  if (activeTab === "employment") {
    return (
      <div className="space-y-6 pb-6">
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
          hideDesignation
          hideHierarchy
        />
      </div>
    );
  }

  if (activeTab === "designation") {
    return (
      <div className="space-y-6 pb-6">
        <FacultyFormDesignationSection
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          designationOptions={designationOptions}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
        />
      </div>
    );
  }

  if (activeTab === "hierarchy") {
    return (
      <div className="space-y-6 pb-6">
        <FacultyFormHierarchySection
          teacherDraft={teacherDraft}
          errors={errors}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
          supervisorCandidates={supervisorCandidates}
          hierarchyRankPresets={hierarchyRankPresets}
        />
      </div>
    );
  }

  if (activeTab === "account") {
    return (
      <div className="space-y-6 pb-6">
        <FacultyUserAccountSection
          teacherDraft={teacherDraft}
          linkedContact={linkedContact}
          userAccountDraft={userAccountDraft}
          onUserAccountDraftChange={onUserAccountDraftChange}
          errors={errors}
        />
      </div>
    );
  }

  if (activeTab === "notes") {
    return (
      <div className="space-y-6 pb-6">
        <TeacherNotesSection
          notes={teacherDraft.notes}
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
