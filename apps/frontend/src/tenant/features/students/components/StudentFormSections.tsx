import type React from "react";
import type { ComponentType, ReactNode } from "react";
import { Calendar, Clock, FileText, GraduationCap, Hash, User, Users } from "lucide-react";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Contact,
  formatDateTime,
  GENDERS,
  type Student,
  type StudentStatus,
} from "@mms/shared";

export type StudentFieldErrorGetter = (fieldId: string) => string | undefined;

export interface StudentStatusSelectOption {
  value: string;
  label: string;
}

function FieldError({ message }: { message?: string }): React.JSX.Element | null {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1 font-medium">{message}</p>;
}

function ContactProfileValue({
  label,
  value,
  icon,
  error,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const Icon = icon;
  const hasValue = value.trim().length > 0;

  return (
    <Field label={label} hint={t("students.form.contactFieldHint")} error={error}>
      <div
        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
          error ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-muted/25"
        }`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${error ? "text-destructive" : "text-muted-foreground"}`} />
        <span className={`text-sm font-semibold ${hasValue ? "text-foreground" : "text-muted-foreground"}`}>
          {hasValue ? value : t("students.form.notSetOnContact")}
        </span>
      </div>
    </Field>
  );
}

interface StudentContactSectionProps {
  contactId?: string | number | null;
  excludeIds: string[];
  linkedGenderLabel: string;
  linkedDob: string;
  genderError?: string;
  dobError?: string;
  getFieldError: StudentFieldErrorGetter;
  onContactSelect: (id: string | number | null) => void;
  onStudentAvatarChange: (avatarUrl: string) => void;
}

export function StudentContactSection({
  contactId,
  excludeIds,
  linkedGenderLabel,
  linkedDob,
  genderError,
  dobError,
  getFieldError,
  onContactSelect,
  onStudentAvatarChange,
}: StudentContactSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.contactLabel")}
        subtitle={t("students.form.contactHint")}
        icon={User}
        accentColor="primary"
      >
        <div className="space-y-4">
          <ContactPicker
            label={t("students.form.contactLabel")}
            value={contactId ? String(contactId) : null}
            onChange={onContactSelect}
            excludeIds={excludeIds}
            onAvatarChange={onStudentAvatarChange}
            searchPlaceholder={t("contacts.picker.searchPlaceholder")}
            emptyTitle={t("contacts.picker.emptyTitle")}
            emptyHint={t("contacts.picker.emptyHint")}
            error={!!getFieldError("contactId")}
          />
          <FieldError message={getFieldError("contactId")} />

          {contactId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
              <ContactProfileValue label={t("students.gender")} value={linkedGenderLabel} icon={User} error={genderError} />
              <ContactProfileValue label={t("students.form.fieldDob")} value={linkedDob} icon={Calendar} error={dobError} />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

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

interface StudentGuardianSectionProps {
  enabled: boolean;
  studentDraft: Partial<Student>;
  fatherExcludeIds: string[];
  motherExcludeIds: string[];
  guardianExcludeIds: string[];
  getFieldError: StudentFieldErrorGetter;
  isFieldEnabled: (fieldId: string) => boolean;
  onParentSelect: (
    role: "father" | "mother" | "guardian",
    id: string | number | null,
    contactObj?: Contact | null,
  ) => void;
}

export function StudentGuardianSection({
  enabled,
  studentDraft,
  fatherExcludeIds,
  motherExcludeIds,
  guardianExcludeIds,
  getFieldError,
  isFieldEnabled,
  onParentSelect,
}: StudentGuardianSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!enabled) return null;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.guardiansSection")}
        subtitle={t("students.form.guardiansSectionDesc")}
        icon={Users}
        accentColor="info"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isFieldEnabled("fatherLink") && (
            <div className="space-y-1">
              <ContactPicker
                label={t("students.form.fatherLink")}
                value={studentDraft.fatherContactId ? String(studentDraft.fatherContactId) : null}
                onChange={(id, contactObj) => onParentSelect("father", id, contactObj)}
                filterGender={GENDERS[0]}
                createDefaults={{ gender: GENDERS[0] }}
                excludeIds={fatherExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("fatherLink")}
              />
              <FieldError message={getFieldError("fatherLink")} />
            </div>
          )}

          {isFieldEnabled("motherLink") && (
            <div className="space-y-1">
              <ContactPicker
                label={t("students.form.motherLink")}
                value={studentDraft.motherContactId ? String(studentDraft.motherContactId) : null}
                onChange={(id, contactObj) => onParentSelect("mother", id, contactObj)}
                filterGender={GENDERS[1]}
                createDefaults={{ gender: GENDERS[1] }}
                excludeIds={motherExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("motherLink")}
              />
              <FieldError message={getFieldError("motherLink")} />
            </div>
          )}

          {isFieldEnabled("guardianLink") && (
            <div className="sm:col-span-2 space-y-1">
              <ContactPicker
                label={t("students.form.guardianLink")}
                value={studentDraft.guardianContactId ? String(studentDraft.guardianContactId) : null}
                onChange={(id, contactObj) => onParentSelect("guardian", id, contactObj)}
                excludeIds={guardianExcludeIds}
                searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                emptyTitle={t("contacts.picker.emptyTitle")}
                error={!!getFieldError("guardianLink")}
              />
              <FieldError message={getFieldError("guardianLink")} />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

interface StudentNotesSectionProps {
  enabled: boolean;
  notes?: string;
  onDraftChange: (patch: Partial<Student>) => void;
}

export function StudentNotesSection({
  enabled,
  notes,
  onDraftChange,
}: StudentNotesSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!enabled) return null;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("students.form.notesSection")}
        icon={FileText}
        accentColor="emerald"
      >
        <Field label={t("students.form.notesSection")}>
          <Textarea
            value={notes || ""}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
            placeholder={t("students.form.notesPlaceholder")}
            className="min-h-[7.5rem] bg-background"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
