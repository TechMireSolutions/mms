import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Calendar, Clock, FileText, GraduationCap, Hash, User, Users } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import ContactPicker from "@/tenant/features/contacts/components/contactLink/ContactPicker";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Field } from "@/components/ui/FormPrimitives";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactMutations, useContactById } from "@/tenant/features/contacts/hooks/useContacts";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { studentStatusBadgeConfig, studentStatusLabel } from "@/lib/students/studentStatusUi";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/tenant/features/students/hooks/useStudents";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import {
  Student,
  Contact,
  StudentStatus,
  resolveStudentStatuses,
  normalizeStoredStudent,
  toTitleCase,
  getPrimaryEmail,
  type StudentDuplicateReason,
  type AppTranslationKey,
  buildDynamicStudentSchema,
  formatStudentZodIssues,
  type ValidationError,
  formatDate,
  formatDateTime,
  todayISO,
  type FieldDefinition,
  GENDERS,
  DEFAULT_STUDENT_ENABLED_TABS,
} from "@mms/shared";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";

function getInitialStudentDraft(student?: Partial<Student> | null): Partial<Student> {
  return {
    contactId: student?.contactId ?? "",
    fatherContactId: student?.fatherContactId ?? null,
    motherContactId: student?.motherContactId ?? null,
    guardianContactId: student?.guardianContactId ?? null,
    fatherName: student?.fatherName ?? "",
    motherName: student?.motherName ?? "",
    guardianName: student?.guardianName ?? "",
    status: student?.status ?? "active",
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? todayISO(),
    discountType: student?.discountType ?? "",
    discountPct: student?.discountPct ?? 0,
    registrationType: student?.registrationType ?? "",
    notes: student?.notes ?? "",
  };
}

export interface StudentFormProps {
  student?: Partial<Student> | null;
  onClose: () => void;
  onSave: (student: Student) => void | Promise<void>;
}

const DUPLICATE_ERROR_KEYS: Record<StudentDuplicateReason, AppTranslationKey> = {
  contact: "students.form.contactAlreadyStudent",
  email: "students.form.duplicateEmail",
  nameDob: "students.form.duplicateNameDob",
};

export default function StudentForm({
  student,
  onClose,
  onSave,
}: StudentFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { updateContact } = useContactMutations();
  const { settings, statuses: configStatuses, isFieldEnabled } = useStudentConfig();

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [studentDraft, setStudentDraft] = useState<Partial<Student>>(() => getInitialStudentDraft(student));
  const statusBadgeConfig = useMemo(() => studentStatusBadgeConfig(t), [t]);
  const statusSelectOptions = useMemo(() => {
    const resolved = [...resolveStudentStatuses(configStatuses)];
    const current = studentDraft.status || "active";
    if (current && !resolved.includes(current)) resolved.unshift(current);
    return resolved.map((status) => ({
      value: status,
      label: studentStatusLabel(t, status),
    }));
  }, [configStatuses, studentDraft.status, t]);

  /** Tracks whether the user has manually typed in the GR field — prevents the
   *  auto-fill effect from overwriting a value the user deliberately cleared. */
  const grManuallyEdited = useRef(false);

  // Re-sync draft when editing another student record
  useEffect(() => {
    setStudentDraft(getInitialStudentDraft(student));
    setValidationErrors([]);
    grManuallyEdited.current = false;
  }, [student]);

  const updateDraft = (patch: Partial<Student>) => {
    setStudentDraft((prev) => ({ ...prev, ...patch }));
  };

  const enabledTabs = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);


  const getFieldError = (fieldId: string) => {
    const fieldError = validationErrors.find((validationError) => validationError.fieldId === fieldId);
    return fieldError ? fieldError.message : undefined;
  };

  const { data: linkedContact } = useContactById(
    studentDraft.contactId ? String(studentDraft.contactId) : undefined,
    !!studentDraft.contactId,
  );

  const linkedGenderRaw = linkedContact?.gender?.trim() || "";
  const linkedGenderLabel = linkedGenderRaw ? formatContactGenderLabel(linkedGenderRaw, t) : "";
  const linkedDob = linkedContact?.dob?.trim() ? formatDate(linkedContact.dob.trim()) : "";

  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);

  const clearDuplicatePrompt = useCallback(() => {
    setDuplicateConfirmOpen(false);
    setTypedDuplicateReason(null);
    setPendingSaveData(null);
  }, []);

  const { data: linkedStudentContactIds = [] } = useStudentLinkedContactIds(
    student?.id ? String(student.id) : undefined,
  );

  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate: (studentDraft.registeredDate || todayISO()).split("T")[0],
    template: settings.grNumberTemplate,
    digits: settings.grNumberDigits,
    restartAnnually: settings.grNumberRestartAnnually,
    enabled: !student?.id,
  });

  useEffect(() => {
    if (student?.id || !nextGrNumber) return;
    if (!studentDraft.grNumber && !grManuallyEdited.current) {
      updateDraft({ grNumber: nextGrNumber });
    }
  }, [nextGrNumber, student?.id, studentDraft.grNumber]);

  const handleGrNumberChange = (value: string) => {
    grManuallyEdited.current = true;
    updateDraft({ grNumber: value });
  };

  const commitSave = async (data: Partial<Student>) => {
    const saved = {
      ...data,
      registeredDate: data.registeredDate || undefined,
      fatherName: data.fatherName ? toTitleCase(data.fatherName) : "",
      motherName: data.motherName ? toTitleCase(data.motherName) : "",
      guardianName: data.guardianName ? toTitleCase(data.guardianName) : "",
    };

    await onSave(
      normalizeStoredStudent({
        ...saved,
        ...(student?.id != null ? { id: student.id } : {}),
        enrolledSessions: student?.enrolledSessions || [],
        ...(settings.version != null ? { _blueprintId: String(settings.version) } : {}),
      }) as Student,
    );
  };

  const handleSave = async () => {
    setValidationErrors([]);

    const requiredTabs = new Set(settings.requiredTabs || []);
    const fields = (settings.fields || {}) as unknown as Record<string, FieldDefinition[]>;
    const schema = buildDynamicStudentSchema(
      settings,
      enabledTabs,
      requiredTabs,
      fields,
      language
    );

    const validationDraft = {
      ...studentDraft,
      gender: linkedGenderRaw,
      dob: linkedContact?.dob || "",
    };
    const parseResult = schema.safeParse(validationDraft);
    if (!parseResult.success) {
      const zodErrors = formatStudentZodIssues(parseResult.error, validationDraft, fields);
      setValidationErrors(zodErrors);

      notify.error(t("contacts.form.pleaseFixErrors"));
      return;
    }

    setSaving(true);
    try {
      const email = (linkedContact ? getPrimaryEmail(linkedContact) : null) || "";
      const duplicateReason = await checkStudentRegistrationDuplicate({
        excludeId: student?.id ? String(student.id) : undefined,
        contactId: String(studentDraft.contactId),
        email,
        name: linkedContact?.name,
        dob: linkedContact?.dob || undefined,
      });

      if (duplicateReason) {
        setPendingSaveData(studentDraft);
        setTypedDuplicateReason(duplicateReason);
        setDuplicateConfirmOpen(true);
        setSaving(false);
        return;
      }

      await commitSave(studentDraft);
      onClose();
    } catch (err: unknown) {
      notify.error(t("settings.serverSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const confirmDuplicateSave = () => {
    void (async () => {
      if (!pendingSaveData) return;
      setSaving(true);
      try {
        await commitSave(pendingSaveData);
        setPendingSaveData(null);
        setDuplicateConfirmOpen(false);
        onClose();
      } catch (err: unknown) {
        notify.error(t("settings.serverSaveFailed"), { description: err instanceof Error ? err.message : String(err) });
      } finally {
        setSaving(false);
      }
    })();
  };

  const genderError = getFieldError("gender");
  const dobError = getFieldError("dob");
  const validationErrorSummary = useMemo(() => {
    if (validationErrors.length === 0) return undefined;
    return validationErrors.map((validationError) => validationError.message);
  }, [validationErrors]);

  const renderFieldError = (message?: string) => {
    if (!message) return null;
    return <p className="text-[10px] text-destructive mt-1 font-medium">{message}</p>;
  };

  const renderContactProfileValue = (
    label: string,
    value: string,
    icon: React.ComponentType<{ className?: string }>,
    error?: string,
  ) => {
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
  };

  const handleContactSelect = (id: string | number | null): void => {
    if (!id) {
      // Keep a manually entered / existing GR; only clear the contact link.
      updateDraft({ contactId: "" });
      return;
    }
    const patch: Partial<Student> = { contactId: String(id) };
    if (!student && !studentDraft.grNumber && nextGrNumber) {
      patch.grNumber = nextGrNumber;
    }
    updateDraft(patch);
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!studentDraft.contactId || !linkedContact) return;
    void updateContact.mutateAsync({
      id: String(studentDraft.contactId),
      contact: { ...linkedContact, avatar: avatarUrl },
    });
  };

  const handleParentSelect = (
    role: "father" | "mother" | "guardian",
    id: string | number | null,
    contactObj?: Contact | null,
  ): void => {
    updateDraft({
      [`${role}ContactId`]: id ? String(id) : null,
      [`${role}Name`]: contactObj?.name ?? "",
    });
  };

  const getParentExcludeIds = useCallback(
    (selfRole: "father" | "mother" | "guardian") => {
      return [
        studentDraft.contactId,
        selfRole !== "father" ? studentDraft.fatherContactId : null,
        selfRole !== "mother" ? studentDraft.motherContactId : null,
        selfRole !== "guardian" ? studentDraft.guardianContactId : null,
      ]
        .filter(Boolean)
        .map(String);
    },
    [studentDraft.contactId, studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId],
  );

  const fatherExcludeIds = useMemo(() => getParentExcludeIds("father"), [getParentExcludeIds]);
  const motherExcludeIds = useMemo(() => getParentExcludeIds("mother"), [getParentExcludeIds]);
  const guardianExcludeIds = useMemo(() => getParentExcludeIds("guardian"), [getParentExcludeIds]);

  const excludeIds = useMemo(() => {
    const list = [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId]
      .filter(Boolean)
      .map(String);
    return [...list, ...linkedStudentContactIds.map(String)];
  }, [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId, linkedStudentContactIds]);

  const errorSummary = useMemo(() => {
    if (typedDuplicateReason) return t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]);
    return "";
  }, [typedDuplicateReason, t]);

  const footerStart = linkedContact?.name ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {linkedContact.name}
      </span>
      <div className="flex items-center gap-1.5">
        <GrBadge grNumber={studentDraft.grNumber} />
        <StatusBadge status={studentDraft.status || "active"} size="sm" config={statusBadgeConfig} />
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      {t("students.form.contactRequired")}
    </span>
  );

  const isGrAutoAssigned = !student?.id && !!studentDraft.grNumber && studentDraft.grNumber === nextGrNumber && !grManuallyEdited.current;

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={GraduationCap}
        lang={language}
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? t("students.form.saving") : student ? t("students.form.saveUpdate") : t("students.form.saveRegister")}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!studentDraft.contactId}
        error={validationErrorSummary ?? (errorSummary || undefined)}
        footerStart={footerStart}
      >
        <div className="space-y-6 pb-6">
          {/* Contact Selection */}
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
                  value={studentDraft.contactId ? String(studentDraft.contactId) : null}
                  onChange={handleContactSelect}
                  excludeIds={excludeIds}
                  onAvatarChange={handleStudentAvatarChange}
                  searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                  emptyTitle={t("contacts.picker.emptyTitle")}
                  emptyHint={t("contacts.picker.emptyHint")}
                  error={!!getFieldError("contactId")}
                />
                {renderFieldError(getFieldError("contactId"))}

                {studentDraft.contactId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                    {renderContactProfileValue(t("students.gender"), linkedGenderLabel, User, genderError)}
                    {renderContactProfileValue(t("students.form.fieldDob"), linkedDob, Calendar, dobError)}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Registration Details */}
          <div className="space-y-6">
            <SectionCard
              title={t("students.form.registrationSection")}
              subtitle={t("students.form.registrationSectionDesc")}
              icon={GraduationCap}
              accentColor="primary"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>{t("students.form.grNumber")}</span>
                      {isGrAutoAssigned && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md me-1">
                          {t("students.form.grAutoAssigned")}
                        </span>
                      )}
                    </div>
                  }
                  required
                  error={getFieldError("grNumber")}
                >
                  <div className="relative flex items-center group/input">
                    <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      required
                      value={studentDraft.grNumber || ""}
                      onChange={(event) => handleGrNumberChange(event.target.value)}
                      placeholder={t("students.form.grNumberPlaceholder")}
                      className={`${FORM_INPUT} ps-10`}
                    />
                  </div>
                </Field>

                <Field label={t("students.form.status")} required error={getFieldError("status")}>
                  <FormSelect
                    value={studentDraft.status || "active"}
                    onChange={(val) => updateDraft({ status: val as StudentStatus })}
                    options={statusSelectOptions}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label={t("students.form.registeredDate")}>
                    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 min-h-[44px] text-sm text-muted-foreground select-none font-medium">
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

          {/* Guardian Links */}
          {enabledTabs.has("guardian") && (
            <div className="space-y-6">
              <SectionCard
                title={t("students.form.guardiansSection")}
                subtitle={t("students.form.guardiansSectionDesc")}
                icon={Users}
                accentColor="indigo"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isFieldEnabled("fatherLink") && (
                    <div className="space-y-1">
                      <ContactPicker
                        label={t("students.form.fatherLink")}
                        value={studentDraft.fatherContactId ? String(studentDraft.fatherContactId) : null}
                        onChange={(id, contactObj) => handleParentSelect("father", id, contactObj)}
                        filterGender={GENDERS[0]}
                        createDefaults={{ gender: GENDERS[0] }}
                        excludeIds={fatherExcludeIds}
                        searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                        emptyTitle={t("contacts.picker.emptyTitle")}
                        error={!!getFieldError("fatherLink")}
                      />
                      {renderFieldError(getFieldError("fatherLink"))}
                    </div>
                  )}

                  {isFieldEnabled("motherLink") && (
                    <div className="space-y-1">
                      <ContactPicker
                        label={t("students.form.motherLink")}
                        value={studentDraft.motherContactId ? String(studentDraft.motherContactId) : null}
                        onChange={(id, contactObj) => handleParentSelect("mother", id, contactObj)}
                        filterGender={GENDERS[1]}
                        createDefaults={{ gender: GENDERS[1] }}
                        excludeIds={motherExcludeIds}
                        searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                        emptyTitle={t("contacts.picker.emptyTitle")}
                        error={!!getFieldError("motherLink")}
                      />
                      {renderFieldError(getFieldError("motherLink"))}
                    </div>
                  )}

                  {isFieldEnabled("guardianLink") && (
                    <div className="sm:col-span-2 space-y-1">
                      <ContactPicker
                        label={t("students.form.guardianLink")}
                        value={studentDraft.guardianContactId ? String(studentDraft.guardianContactId) : null}
                        onChange={(id, contactObj) => handleParentSelect("guardian", id, contactObj)}
                        excludeIds={guardianExcludeIds}
                        searchPlaceholder={t("contacts.picker.searchPlaceholder")}
                        emptyTitle={t("contacts.picker.emptyTitle")}
                        error={!!getFieldError("guardianLink")}
                      />
                      {renderFieldError(getFieldError("guardianLink"))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* Academic / Internal Notes */}
          {enabledTabs.has("academic") && (
            <div className="space-y-6">
              <SectionCard
                title={t("students.form.notesSection")}
                icon={FileText}
                accentColor="emerald"
              >
                <Field label={t("students.form.notesSection")}>
                  <Textarea
                    value={studentDraft.notes || ""}
                    onChange={(event) => updateDraft({ notes: event.target.value })}
                    placeholder={t("students.form.notesPlaceholder")}
                    className="min-h-[120px] bg-background"
                  />
                </Field>
              </SectionCard>
            </div>
          )}
        </div>
      </FormModal>
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={(open) => {
          if (!open) clearDuplicatePrompt();
          else setDuplicateConfirmOpen(true);
        }}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        description={typedDuplicateReason
          ? t("students.form.duplicateSaveWarning", { message: t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]) })
          : ""}
        confirmLabel={t("students.form.saveAnyway")}
        cancelLabel={t("students.form.reviewDuplicate")}
        onConfirm={confirmDuplicateSave}
      />
    </>
  );
}
