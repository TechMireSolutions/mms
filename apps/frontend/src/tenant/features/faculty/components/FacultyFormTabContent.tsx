import type React from "react";
import {
  TeacherContactSection,
  TeacherEmploymentSection,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { FacultyFormDesignationSection } from "@/tenant/features/faculty/components/FacultyFormDesignationSection";
import { FacultyFormHierarchySection } from "@/tenant/features/faculty/components/FacultyFormHierarchySection";
import { TeacherNotesSection } from "@/tenant/features/faculty/components/FacultyNotesSection";
import {
  FacultyUserAccountSection,
  type FacultyUserAccountDraft,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";
import { FacultyCustomFieldsSection } from "./FacultyCustomFieldsSection";
import { FacultyFormAllSections } from "./FacultyFormAllSections";
import {
  type TeacherFormTabContentProps,
  type FacultyFormTabContentProps,
} from "./facultyFormTabs";

export type { TeacherFormTabContentProps, FacultyFormTabContentProps };

const DEFAULT_USER_ACCOUNT_DRAFT: FacultyUserAccountDraft = {
  enabled: false,
  role: "teacher",
  setupMethod: "password",
};

export const TeacherFormTabContent = (function TeacherFormTabContent(props: TeacherFormTabContentProps): React.JSX.Element {
  const {
    activeTab,
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
    userAccountDraft = DEFAULT_USER_ACCOUNT_DRAFT,
    onUserAccountDraftChange = () => {},
    supervisorCandidates,
    hierarchyRankPresets,
  } = props;

  let tabBody: React.JSX.Element | null = null;

  if (activeTab === "contact") {
    tabBody = (
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
    );
  } else if (activeTab === "employment") {
    tabBody = (
      <>
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
        <FacultyCustomFieldsSection fields={fields} draft={teacherDraft} errors={errors} onDraftChange={onDraftChange} />
      </>
    );
  } else if (activeTab === "designation") {
    tabBody = (
      <FacultyFormDesignationSection
        teacher={teacher}
        teacherDraft={teacherDraft}
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
        teacherDraft={teacherDraft}
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
        teacherDraft={teacherDraft}
        linkedContact={linkedContact}
        linkedUser={linkedUser}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        errors={errors}
      />
    );
  } else if (activeTab === "notes") {
    tabBody = (
      <TeacherNotesSection
        notes={teacherDraft.notes}
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
      teacher={teacher}
      teacherDraft={teacherDraft}
      errors={errors}
      fields={fields}
      linkedTeacherContactIds={linkedTeacherContactIds}
      specializationOptions={specializationOptions}
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

export const FacultyFormTabContent = TeacherFormTabContent;
