import type React from "react";
import { Award, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { FacultyDesignationDefinition, Teacher } from "@mms/shared";

export interface FacultyFormDesignationSectionProps {
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  designationOptions?: FacultyDesignationDefinition[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
}

export function FacultyFormDesignationSection({
  teacher,
  teacherDraft,
  errors,
  designationOptions,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
}: FacultyFormDesignationSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!isFieldEnabled("designation")) return null;

  const currentDefinition = designationOptions?.find(
    (item) => item.id === teacherDraft.designationId,
  );
  const assignableRoles = currentDefinition?.assignableRoles ?? teacherDraft.designationAssignableRoles ?? [];

  return (
    <div className="space-y-4 text-start">
      <SectionCard
        title={t("faculty.form.tab.designation")}
        icon={Award}
        accentColor="primary"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <Field
            label={t("faculty.field.designation")}
            id="designationId"
            required={isFieldRequired("designation")}
            error={errors.designationId}
          >
            <FormSelect
              id="designationId"
              name="designationId"
              value={teacherDraft.designationId || ""}
              disabled={Boolean(teacher?.id)}
              onChange={(value) => {
                const definition = designationOptions?.find((item) => item.id === value);
                onDraftChange({
                  designationId: value,
                  designation: definition?.name ?? "",
                  hierarchyRank: definition?.hierarchyRank,
                  designationAssignableRoles: definition?.assignableRoles ?? [],
                });
              }}
              options={(designationOptions ?? [])
                .filter((item) => item.isActive || item.id === teacherDraft.designationId)
                .map((item) => ({ value: item.id, label: item.name }))}
            />
            {teacher?.id ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("faculty.designations.manageInHistory")}
              </p>
            ) : null}
          </Field>

          {!teacher?.id && (
            <Field
              label={t("faculty.designations.startsOn")}
              id="designationStartsOn"
              required
              error={errors.designationStartsOn}
            >
              <DatePicker
                id="designationStartsOn"
                name="designationStartsOn"
                value={teacherDraft.designationStartsOn || undefined}
                onChange={(dateStr) => onDraftChange({ designationStartsOn: dateStr })}
              />
            </Field>
          )}

          {assignableRoles.length > 0 && (
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
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
