import type React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Teacher } from "@mms/shared";

export interface FacultyEmploymentAcademicFieldsProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  departmentLabel: string;
  specializationLabel: string;
  qualificationLabel: string;
  showDepartment: boolean;
  showSpecialization: boolean;
  showQualification: boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
  specializationOptions?: string[];
}

export function FacultyEmploymentAcademicFields({
  teacherDraft,
  errors,
  departmentLabel,
  specializationLabel,
  qualificationLabel,
  showDepartment,
  showSpecialization,
  showQualification,
  isFieldRequired,
  onDraftChange,
  specializationOptions,
}: FacultyEmploymentAcademicFieldsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {showDepartment && (
        <Field
          label={departmentLabel}
          id="department"
          required={isFieldRequired("department")}
          error={errors.department}
        >
          <Input
            id="department"
            name="department"
            value={teacherDraft.department ?? ""}
            onChange={(e) => onDraftChange({ department: e.target.value })}
            placeholder={t("faculty.form.departmentPlaceholder") || t("teachers.form.departmentPlaceholder")}
            className={cn(FORM_INPUT, errors.department && FORM_INPUT_ERROR)}
          />
        </Field>
      )}

      {showSpecialization && (
        <Field
          label={specializationLabel}
          id="specialization"
          required={isFieldRequired("specialization")}
          error={errors.specialization}
        >
          {specializationOptions && specializationOptions.length > 0 ? (
            <FormSelect
              id="specialization"
              name="specialization"
              value={teacherDraft.specialization ?? ""}
              placeholder={specializationLabel}
              onChange={(val) => onDraftChange({ specialization: val })}
              options={specializationOptions.map((opt) => ({ value: opt, label: opt }))}
            />
          ) : (
            <Input
              id="specialization"
              name="specialization"
              value={teacherDraft.specialization ?? ""}
              onChange={(e) => onDraftChange({ specialization: e.target.value })}
              placeholder={specializationLabel}
              className={cn(FORM_INPUT, errors.specialization && FORM_INPUT_ERROR)}
            />
          )}
        </Field>
      )}

      {showQualification && (
        <Field
          label={qualificationLabel}
          id="qualification"
          required={isFieldRequired("qualification")}
          error={errors.qualification}
        >
          <Input
            id="qualification"
            name="qualification"
            value={teacherDraft.qualification ?? ""}
            onChange={(e) => onDraftChange({ qualification: e.target.value })}
            placeholder={t("faculty.form.qualificationPlaceholder") || t("teachers.form.qualificationPlaceholder")}
            className={cn(FORM_INPUT, errors.qualification && FORM_INPUT_ERROR)}
          />
        </Field>
      )}
    </>
  );
}
