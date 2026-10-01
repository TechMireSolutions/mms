import type React from "react";
import { useMemo } from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { FACULTY_DEPARTMENT_VALUES, type FacultyMember } from "@mms/shared";

export interface FacultyEmploymentAcademicFieldsProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  departmentLabel: string;
  showDepartment: boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  departmentOptions?: string[];
  specializationLabel?: string;
  qualificationLabel?: string;
  showSpecialization?: boolean;
  showQualification?: boolean;
  specializationOptions?: string[];
}

export function FacultyEmploymentAcademicFields({
  facultyDraft = {},
  errors,
  departmentLabel,
  showDepartment,
  isFieldRequired,
  onDraftChange,
  departmentOptions,
}: FacultyEmploymentAcademicFieldsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const options = useMemo(() => {
    const list = departmentOptions && departmentOptions.length > 0
      ? [...departmentOptions]
      : [...FACULTY_DEPARTMENT_VALUES];
    if (facultyDraft.department && !list.includes(facultyDraft.department)) {
      list.unshift(facultyDraft.department);
    }
    return list.map((opt) => ({ value: opt, label: opt }));
  }, [departmentOptions, facultyDraft.department]);

  if (!showDepartment) return null;

  return (
    <Field
      label={departmentLabel}
      id="department"
      required={isFieldRequired("department")}
      error={errors.department}
    >
      <FormSelect
        id="department"
        name="department"
        value={facultyDraft.department ?? ""}
        placeholder={t("faculty.form.departmentPlaceholder")}
        onChange={(val) => onDraftChange({ department: val })}
        options={options}
      />
    </Field>
  );
}
