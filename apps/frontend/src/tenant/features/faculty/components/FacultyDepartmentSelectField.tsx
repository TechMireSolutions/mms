import React, { useMemo } from "react";
import type { FacultyDepartmentEntity } from "@mms/shared";
import { FACULTY_DEPARTMENT_VALUES } from "@mms/shared";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyDepartmentSelectFieldProps {
  value: string;
  departmentId?: string;
  error?: string;
  required?: boolean;
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  onChange: (patch: { department: string; departmentId?: string }) => void;
}

export function FacultyDepartmentSelectField({
  value,
  error,
  required,
  departmentOptions,
  departmentEntities,
  onChange,
}: FacultyDepartmentSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  const deptOptions = useMemo(() => {
    if (departmentEntities?.length) {
      const list = departmentEntities.map((d) => ({ value: d.name, label: `${d.name} (${d.code})` }));
      if (value && !departmentEntities.some((d) => d.name === value)) {
        list.unshift({ value, label: value });
      }
      return list;
    }
    const raw: readonly string[] = departmentOptions?.length ? departmentOptions : FACULTY_DEPARTMENT_VALUES;
    const exists = value ? raw.some((val) => val === value) : true;
    const list = value && !exists ? [value, ...raw] : raw;
    return list.map((opt) => ({ value: opt, label: opt }));
  }, [departmentEntities, departmentOptions, value]);

  return (
    <Field
      label={t("faculty.field.department")}
      id="department"
      required={required}
      error={error}
    >
      <FormSelect
        id="department"
        name="department"
        value={value}
        placeholder={t("faculty.form.departmentPlaceholder")}
        onChange={(val) => {
          const matched = departmentEntities?.find((d) => d.name === val);
          onChange({
            department: val,
            ...(matched ? { departmentId: matched.id } : { departmentId: undefined }),
          });
        }}
        options={deptOptions}
      />
    </Field>
  );
}
