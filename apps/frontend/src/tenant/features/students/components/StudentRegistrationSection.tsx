import type React from "react";
import type { ReactNode } from "react";
import { Clock, GraduationCap, Hash } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatDateTime,
  type Student,
  type StudentStatus,
} from "@mms/shared";
import {
  type StudentFieldErrorGetter,
  type StudentStatusSelectOption,
} from "@/tenant/features/students/components/StudentFormSectionShared";

interface StudentRegistrationSectionProps {
  studentDraft: Partial<Student>;
  isGrAutoAssigned: boolean;
  statusSelectOptions: StudentStatusSelectOption[];
  getFieldError: StudentFieldErrorGetter;
  onGrNumberChange: (value: string) => void;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentRegistrationSection({
  studentDraft,
  isGrAutoAssigned,
  statusSelectOptions,
  getFieldError,
  onGrNumberChange,
  onDraftChange,
}: StudentRegistrationSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const grNumberLabel: ReactNode = (
    <div className="flex items-center justify-between w-full">
      <span>{t("students.form.grNumber")}</span>
      {isGrAutoAssigned && (
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md me-1">
          {t("students.form.grAutoAssigned")}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.registrationSection")}
        subtitle={t("students.form.registrationSectionDesc")}
        icon={GraduationCap}
        accentColor="primary"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={grNumberLabel} required error={getFieldError("grNumber")}>
            <div className="relative flex items-center group/input">
              <Hash className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                required
                value={studentDraft.grNumber || ""}
                onChange={(event) => onGrNumberChange(event.target.value)}
                placeholder={t("students.form.grNumberPlaceholder")}
                className={`${FORM_INPUT} ps-10`}
              />
            </div>
          </Field>

          <Field label={t("students.form.status")} required error={getFieldError("status")}>
            <FormSelect
              value={studentDraft.status || "active"}
              onChange={(value) => onDraftChange({ status: value as StudentStatus })}
              options={statusSelectOptions}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={t("students.form.registeredDate")}>
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 min-h-11 text-sm text-muted-foreground select-none font-medium">
                <Clock className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <span>
                  {studentDraft.registeredDate
                    ? formatDateTime(studentDraft.registeredDate, true)
                    : t("contacts.table.emptyDash")}
                </span>
              </div>
            </Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
