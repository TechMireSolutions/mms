import type React from "react";
import {
  FacultyContactSection,
  FacultyEmploymentSection,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { FacultyFormDesignationSection } from "@/tenant/features/faculty/components/FacultyFormDesignationSection";
import { FacultyFormHierarchySection } from "@/tenant/features/faculty/components/FacultyFormHierarchySection";
import { FacultyNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";
import { FacultyCustomFieldsSection } from "./FacultyCustomFieldsSection";
import { FacultyFormAllSections } from "./FacultyFormAllSections";
import {
  type FacultyFormTabContentProps,
} from "./facultyFormTabs";
import { DEFAULT_FACULTY_USER_ROLE } from "@mms/shared";

export type { FacultyFormTabContentProps };

const DEFAULT_USER_ACCOUNT_DRAFT: FacultyUserAccountDraft = {
  enabled: false,
  role: DEFAULT_FACULTY_USER_ROLE,
  setupMethod: "password",
};

export const FacultyFormTabContent = (function FacultyFormTabContent(props: FacultyFormTabContentProps): React.JSX.Element {
  const {
    activeTab,
    faculty,
    facultyDraft: facultyDraftProp,
    errors,
    fields,
    linkedFacultyContactIds,
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
    userAccountDraft = DEFAULT_USER_ACCOUNT_DRAFT,
    onUserAccountDraftChange = () => {},
    supervisorCandidates,
    hierarchyRankPresets,
  } = props;

  const effectiveFaculty = faculty;
  const effectiveDraft = facultyDraftProp ?? {};
  const effectiveContactIds = linkedFacultyContactIds ?? [];

  let tabBody: React.JSX.Element | null = null;

  if (activeTab === "contact") {
    tabBody = (
      <FacultyContactSection
        facultyDraft={effectiveDraft}
        linkedContact={linkedContact}
        linkedFacultyContactIds={effectiveContactIds}
        errors={errors}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />
    );
  } else if (activeTab === "employment") {
    tabBody = (
      <>
        <FacultyEmploymentSection
          faculty={effectiveFaculty}
          facultyDraft={effectiveDraft}
          errors={errors}
          fields={fields}
          autoGenerateId={autoGenerateId}
          idPrefix={idPrefix}
          nextEmployeeId={nextEmployeeId}
          onRegenerateEmployeeId={onRegenerateEmployeeId}
          isFetchingNextEmployeeId={isFetchingNextEmployeeId}
          statusOptions={statusOptions}
          specializationOptions={specializationOptions}
          departmentOptions={departmentOptions}
          designationOptions={designationOptions}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
          supervisorCandidates={supervisorCandidates}
          hierarchyRankPresets={hierarchyRankPresets}
          hideDesignation
          hideHierarchy
        />
        <FacultyCustomFieldsSection fields={fields} draft={effectiveDraft} errors={errors} onDraftChange={onDraftChange} />
      </>
    );
  } else if (activeTab === "designation") {
    tabBody = (
      <FacultyFormDesignationSection
        faculty={effectiveFaculty}
        facultyDraft={effectiveDraft}
        errors={errors}
        designationOptions={designationOptions}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
      />
    );
  } else if (activeTab === "hierarchy") {
    tabBody = (
      <FacultyFormHierarchySection
        facultyDraft={effectiveDraft}
        errors={errors}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        supervisorCandidates={supervisorCandidates}
        hierarchyRankPresets={hierarchyRankPresets}
      />
    );
  } else if (activeTab === "account") {
    tabBody = (
      <FacultyUserAccountSection
        facultyDraft={effectiveDraft}
        linkedContact={linkedContact}
        linkedUser={linkedUser}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        errors={errors}
      />
    );
  } else if (activeTab === "notes") {
    tabBody = (
      <FacultyNotesSection
        notes={effectiveDraft.notes}
        fields={fields}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
        error={errors.notes}
      />
    );
  }

  if (tabBody) {
    return <div className="space-y-6 pb-6">{tabBody}</div>;
  }

  return (
    <FacultyFormAllSections
      faculty={effectiveFaculty}
      facultyDraft={effectiveDraft}
      errors={errors}
      fields={fields}
      linkedFacultyContactIds={effectiveContactIds}
      specializationOptions={specializationOptions}
      departmentOptions={departmentOptions}
      designationOptions={designationOptions}
      autoGenerateId={autoGenerateId}
      idPrefix={idPrefix}
      nextEmployeeId={nextEmployeeId}
      onRegenerateEmployeeId={onRegenerateEmployeeId}
      isFetchingNextEmployeeId={isFetchingNextEmployeeId}
      statusOptions={statusOptions}
      isFieldEnabled={isFieldEnabled}
      isFieldRequired={isFieldRequired}
      onDraftChange={onDraftChange}
      linkedContact={linkedContact}
      linkedUser={linkedUser}
      userAccountDraft={userAccountDraft}
      onUserAccountDraftChange={onUserAccountDraftChange}
      supervisorCandidates={supervisorCandidates}
      hierarchyRankPresets={hierarchyRankPresets}
    />
  );
});

export default FacultyFormTabContent;
