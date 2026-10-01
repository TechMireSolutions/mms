import type React from "react";
import { useMemo } from "react";
import { Award, Shield, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FACULTY_DEPARTMENT_VALUES,
  type FacultyDepartmentEntity,
  type FacultyDesignationDefinition,
  type FacultyMember,
} from "@mms/shared";

export interface FacultyFormDesignationSectionProps {
  faculty?: FacultyMember;
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
}

export function FacultyFormDesignationSection(props: FacultyFormDesignationSectionProps): React.JSX.Element | null {
  const {
    faculty,
    facultyDraft = {},
    errors,
    designationOptions,
    departmentOptions,
    departmentEntities,
    isFieldEnabled,
    isFieldRequired,
    onDraftChange,
  } = props;
  const { t } = useTranslation();

  const showDesignation = isFieldEnabled("designation");
  const showDepartment = isFieldEnabled("department");

  const deptOptions = useMemo(() => {
    if (departmentEntities && departmentEntities.length > 0) {
      const list = departmentEntities.map((d) => ({
        value: d.name,
        label: `${d.name} (${d.code})`,
      }));
      if (facultyDraft.department && !departmentEntities.some((d) => d.name === facultyDraft.department)) {
        list.unshift({ value: facultyDraft.department, label: facultyDraft.department });
      }
      return list;
    }
    const list = departmentOptions && departmentOptions.length > 0
      ? [...departmentOptions]
      : [...FACULTY_DEPARTMENT_VALUES];
    if (facultyDraft.department && !list.includes(facultyDraft.department)) {
      list.unshift(facultyDraft.department);
    }
    return list.map((opt) => ({ value: opt, label: opt }));
  }, [departmentEntities, departmentOptions, facultyDraft.department]);

  if (!showDesignation && !showDepartment) return null;

  const currentDefinition = designationOptions?.find(
    (item) => item.id === facultyDraft.designationId,
  );
  const assignableRoles = currentDefinition?.assignableRoles ?? facultyDraft.designationAssignableRoles ?? [];
  const activeOptions = (designationOptions ?? []).filter((item) => item.isActive || item.id === facultyDraft.designationId);

  return (
    <div className="space-y-4 text-start">
      {(showDesignation || showDepartment) && (
        <SectionCard
          title={t("faculty.form.tab.designation")}
          icon={Award}
          accentColor="primary"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {showDesignation && (
              <Field
                label={t("faculty.field.designation")}
                id="designationId"
                required={isFieldRequired("designation")}
                error={errors.designationId || errors.designation}
              >
                <FormSelect
                  id="designationId"
                  name="designationId"
                  value={facultyDraft.designationId || ""}
                  placeholder={t("faculty.designations.selectPlaceholder")}
                  disabled={Boolean(faculty?.id)}
                  onChange={(value) => {
                    const definition = designationOptions?.find((item) => item.id === value);
                    onDraftChange({
                      designationId: value,
                      designation: definition?.name ?? "",
                      hierarchyRank: definition?.hierarchyRank,
                      designationAssignableRoles: definition?.assignableRoles ?? [],
                      ...(definition?.hierarchyRank === 1 ? { reportingFacultyId: null } : {}),
                    });
                  }}
                  options={activeOptions.map((item) => ({ value: item.id, label: item.name }))}
                />
                {activeOptions.length === 0 ? (
                  <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3.5 shrink-0" aria-hidden />
                    {t("faculty.designations.empty")}
                  </p>
                ) : null}
                {faculty?.id ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("faculty.designations.manageInHistory")}
                  </p>
                ) : !facultyDraft.designationId && facultyDraft.designation ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("faculty.designations.current")}: {facultyDraft.designation}
                  </p>
                ) : null}
              </Field>
            )}

            {showDepartment && (
              <Field
                label={t("faculty.field.department")}
                id="department"
                required={isFieldRequired("department")}
                error={errors.department}
              >
                <FormSelect
                  id="department"
                  name="department"
                  value={facultyDraft.department ?? ""}
                  placeholder={t("faculty.form.departmentPlaceholder")}
                  onChange={(val) => {
                    const matched = departmentEntities?.find((d) => d.name === val);
                    onDraftChange({
                      department: val,
                      ...(matched ? { departmentId: matched.id } : {}),
                    });
                  }}
                  options={deptOptions}
                />
              </Field>
            )}

            {showDesignation && !faculty?.id && (
              <Field
                label={t("faculty.designations.startsOn")}
                id="designationStartsOn"
                required
                error={errors.designationStartsOn}
              >
                <DatePicker
                  id="designationStartsOn"
                  name="designationStartsOn"
                  value={facultyDraft.designationStartsOn || undefined}
                  onChange={(dateStr) => onDraftChange({ designationStartsOn: dateStr })}
                />
              </Field>
            )}

            {showDesignation && currentDefinition ? (
              <div className="md:col-span-2 space-y-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Shield className="size-3.5 text-primary" aria-hidden />
                  <span>{t("faculty.designations.roles")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {assignableRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs font-normal">
                      {role}
                    </Badge>
                  ))}
                  {assignableRoles.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t("faculty.designations.noAssignableRoles")}</span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
