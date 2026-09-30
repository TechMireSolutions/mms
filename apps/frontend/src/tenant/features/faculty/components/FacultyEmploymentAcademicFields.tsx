import type React from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT, FORM_INPUT_ERROR } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { FacultyMember } from "@mms/shared";

export interface FacultyEmploymentAcademicFieldsProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  departmentLabel: string;
  specializationLabel: string;
  qualificationLabel: string;
  showDepartment: boolean;
  showSpecialization: boolean;
  showQualification: boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  specializationOptions?: string[];
}

export function FacultyEmploymentAcademicFields({
  facultyDraft = {},
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
            value={facultyDraft.department ?? ""}
            onChange={(e) => onDraftChange({ department: e.target.value })}
            placeholder={t("faculty.form.departmentPlaceholder")}
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
              value={facultyDraft.specialization ?? ""}
              placeholder={specializationLabel}
              onChange={(val) => onDraftChange({ specialization: val })}
              options={specializationOptions.map((opt) => ({ value: opt, label: opt }))}
            />
          ) : (
            <Input
              id="specialization"
              name="specialization"
              value={facultyDraft.specialization ?? ""}
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
            value={facultyDraft.qualification ?? ""}
            onChange={(e) => onDraftChange({ qualification: e.target.value })}
            placeholder={t("faculty.form.qualificationPlaceholder")}
            className={cn(FORM_INPUT, errors.qualification && FORM_INPUT_ERROR)}
          />
        </Field>
      )}
    </>
  );
}
