import type { FieldDefinition, Teacher } from "@mms/shared";
import {
  TeacherBasicSection,
  TeacherEmploymentSection,
  type TeacherStatusOption,
} from "@/tenant/features/teachers/components/TeacherFormSections";
import { TeacherNotesSection } from "@/tenant/features/teachers/components/TeacherNotesSection";
import React from "react";

export interface TeacherFormTabContentProps {
  tab: string;
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
}

export const TeacherFormTabContent = React.memo(function TeacherFormTabContent({
  tab,
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
}: TeacherFormTabContentProps): React.JSX.Element {
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
          </div>
        );
      }

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
        </div>
      );
    });
