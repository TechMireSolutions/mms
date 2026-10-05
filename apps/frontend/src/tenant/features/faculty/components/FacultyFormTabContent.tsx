import type React from "react";
import {
  FacultyContactSection,
  FacultyEmploymentSection,
} from "@/tenant/features/faculty/components/FacultyFormSections";
import { FacultyFormDesignationSection } from "@/tenant/features/faculty/components/FacultyFormDesignationSection";
import { EntityNotesFormSection } from "@/components/ui/EntityNotesFormSection";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveFacultyFieldLabel } from "@/tenant/features/faculty/components/FacultyFormSectionShared";
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
    departmentOptions,
    departmentEntities,
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
  } = props;

  const { t } = useTranslation();
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
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
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
        departmentOptions={departmentOptions}
        departmentEntities={departmentEntities}
        isFieldEnabled={isFieldEnabled}
        isFieldRequired={isFieldRequired}
        onDraftChange={onDraftChange}
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
  } else if (activeTab === "notes" && isFieldEnabled("notes")) {
    tabBody = (
      <EntityNotesFormSection
        title={t("faculty.form.notesSection")}
        subtitle={t("faculty.form.notesSectionDesc")}
        label={resolveFacultyFieldLabel(fields, "employment", "notes", t)}
        placeholder={t("faculty.form.notesPlaceholder")}
        value={effectiveDraft.notes}
        required={isFieldRequired("notes")}
        error={errors.notes}
        onChange={(next) => onDraftChange({ notes: next })}
      />
    );
  }

  if (tabBody) {
    return <div className="space-y-3 pb-6">{tabBody}</div>;
  }

  return (
    <FacultyFormAllSections
      faculty={effectiveFaculty}
      facultyDraft={effectiveDraft}
      errors={errors}
      fields={fields}
      linkedFacultyContactIds={effectiveContactIds}
      departmentOptions={departmentOptions}
      departmentEntities={departmentEntities}
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
    />
  );
});

export default FacultyFormTabContent;
