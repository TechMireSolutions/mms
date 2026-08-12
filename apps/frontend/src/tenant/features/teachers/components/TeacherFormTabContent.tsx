import type React from "react";
import type { FieldDefinition, TabConfig, Teacher } from "@mms/shared";
import { findDfsTab } from "@mms/shared";
import {
  TeacherBasicSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/teachers/components/TeacherFormSections";
import { TeacherCustomFieldsBlock } from "@/tenant/features/teachers/components/TeacherCustomFieldsBlock";
import { TeacherNotesSection } from "@/tenant/features/teachers/components/TeacherNotesSection";

export interface TeacherFormTabContentProps {
  tab: string;
  formInstanceId: string;
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  dfsTabs?: TabConfig[];
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
}

export function TeacherFormTabContent({
  tab,
  formInstanceId,
  teacher,
  teacherDraft,
  errors,
  fields,
  dfsTabs,
  defaultSpecialization,
  linkedTeacherContactIds,
  specializationOptions,
  autoGenerateId,
  idPrefix,
  nextEmployeeId,
  statusOptions,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  onDraftChange,
}: TeacherFormTabContentProps): React.JSX.Element {
  const dfsTab = findDfsTab(dfsTabs, tab);

  if (dfsTab && tab !== "basic" && tab !== "employment") {
    return (
      <div className="space-y-6 pb-6">
        <TeacherCustomFieldsBlock
          teacherDraft={teacherDraft}
          formInstanceId={formInstanceId}
          fields={fields}
          customFields={dfsTab.fields}
          tabId={tab}
          getFieldError={getFieldError}
          updateDraft={onDraftChange}
          hideWhenEmpty={false}
        />
      </div>
    );
  }

  if (tab === "employment") {
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
          statusOptions={statusOptions}
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
        <TeacherCustomFieldsBlock
          teacherDraft={teacherDraft}
          formInstanceId={formInstanceId}
          fields={fields}
          customFields={findDfsTab(dfsTabs, "employment")?.fields}
          tabId="employment"
          getFieldError={getFieldError}
          updateDraft={onDraftChange}
        />
      </div>
    );
  }

  if (tab === "basic") {
    return (
      <div className="space-y-6 pb-6">
        <TeacherBasicSection
          teacherDraft={teacherDraft}
          errors={errors}
          fields={fields}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          onDraftChange={onDraftChange}
        />
        <TeacherCustomFieldsBlock
          teacherDraft={teacherDraft}
          formInstanceId={formInstanceId}
          fields={fields}
          customFields={findDfsTab(dfsTabs, "basic")?.fields}
          tabId="basic"
          getFieldError={getFieldError}
          updateDraft={onDraftChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <TeacherCustomFieldsBlock
        teacherDraft={teacherDraft}
        formInstanceId={formInstanceId}
        fields={fields}
        customFields={dfsTab?.fields}
        tabId={tab}
        getFieldError={getFieldError}
        updateDraft={onDraftChange}
        hideWhenEmpty={false}
      />
    </div>
  );
}

