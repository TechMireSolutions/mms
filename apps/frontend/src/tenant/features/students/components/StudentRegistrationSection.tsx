import type React from "react";
import { Clock, GraduationCap, Hash } from "lucide-react";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  formatDateTime,
  type FieldDefinition,
  type Student,
  type StudentStatus,
} from "@mms/shared";
import {
  resolveStudentFieldLabel,
  type StudentFieldErrorGetter,
  type StudentStatusSelectOption,
} from "@/tenant/features/students/components/StudentFormSectionShared";

interface StudentRegistrationSectionProps {
  studentDraft: Partial<Student>;
  isGrAutoAssigned: boolean;
  grInputDisabled: boolean;
  statusSelectOptions: StudentStatusSelectOption[];
  statuses?: string[];
  onUpdateStatuses?: (statuses: string[]) => void | Promise<void>;
  fields: Record<string, FieldDefinition[]>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: StudentFieldErrorGetter;
  onGrNumberChange: (value: string) => void;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentRegistrationSection({
  studentDraft,
  isGrAutoAssigned,
  grInputDisabled,
  statusSelectOptions,
  statuses,
  onUpdateStatuses,
  fields,
  isFieldEnabled,
  isFieldRequired,
  getFieldError,
  onGrNumberChange,
  onDraftChange,
}: StudentRegistrationSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const showGr = isFieldEnabled("grNumber");
  const showStatus = isFieldEnabled("status");
  const showRegisteredDate = isFieldEnabled("registeredDate");

  if (!showGr && !showStatus && !showRegisteredDate) {
    return null;
  }

  const registeredDateText = studentDraft.registeredDate
    ? formatDateTime(studentDraft.registeredDate, true)
    : t("students.table.emptyDash");

  const grLabel = resolveStudentFieldLabel(fields, "registration", "grNumber", "students.form.grNumber", t);
  const statusLabel = resolveStudentFieldLabel(fields, "registration", "status", "students.form.status", t);
  const registeredLabel = resolveStudentFieldLabel(
    fields,
    "registration",
    "registeredDate",
    "students.form.registeredDate",
    t,
  );

  const rawStatuses = statuses ?? statusSelectOptions.map((opt) => opt.value);

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.registrationSection")}
        subtitle={t("students.form.registrationSectionDesc")}
        icon={GraduationCap}
        accentColor="primary"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          {showGr ? (
            <Field
              label={grLabel}
              required={isFieldRequired("grNumber")}
              error={getFieldError("grNumber")}
              id="grNumber"
            >
              <div className="relative">
                <LeadingIconInput
                  icon={Hash}
                  required={isFieldRequired("grNumber")}
                  value={studentDraft.grNumber || ""}
                  onChange={(event) => onGrNumberChange(event.target.value)}
                  placeholder={t("students.form.grNumberPlaceholder")}
                  disabled={grInputDisabled}
                  iconPaddingClass={FORM_INPUT}
                  className={`ps-10 ${isGrAutoAssigned ? "pe-24" : ""}`}
                />
                {isGrAutoAssigned ? (
                  <FormFooterBadge
                    tone="primary"
                    className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider"
                  >
                    {t("students.form.grAutoAssigned")}
                  </FormFooterBadge>
                ) : null}
              </div>
            </Field>
          ) : null}

          {showStatus ? (
            <Field
              label={statusLabel}
              required={isFieldRequired("status")}
              error={getFieldError("status")}
              id="status"
            >
              {onUpdateStatuses ? (
                <EditableSelect
                  id="status"
                  options={rawStatuses}
                  value={studentDraft.status || "active"}
                  onChange={(value) => onDraftChange({ status: value as StudentStatus })}
                  onUpdateOptions={onUpdateStatuses}
                  placeholder={t("contacts.form.selectOption")}
                  className="w-full"
                />
              ) : (
                <FormSelect
                  id="status"
                  name="status"
                  value={studentDraft.status || "active"}
                  onChange={(value) => onDraftChange({ status: value as StudentStatus })}
                  options={statusSelectOptions}
                />
              )}
            </Field>
          ) : null}

          {showRegisteredDate ? (
            <div className="sm:col-span-2">
              <Field label={registeredLabel} hint={t("students.form.registeredDateHint")}>
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 min-h-11 text-sm text-muted-foreground select-none font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground/60 shrink-0" aria-hidden />
                  <span>{registeredDateText}</span>
                </div>
              </Field>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
