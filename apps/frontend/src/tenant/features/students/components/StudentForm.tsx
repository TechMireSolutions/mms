import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Calendar, Clock, FileText, GraduationCap, Hash, User, Users } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { formatDate, formatDateTime } from "@/lib/utils";
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
import { useStudentConfig } from "@/tenant/features/students/hooks/useStudentConfig";
import { SectionCard } from "@/components/ui/SectionCard";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/tenant/features/students/hooks/useStudents";
import {
  Student,
  Contact,
  StudentStatus,
  STUDENT_STATUS_VALUES,
  normalizeStoredStudent,
  toTitleCase,
  type StudentDuplicateReason,
  type AppTranslationKey,
  buildDynamicStudentSchema,
  formatStudentZodIssues,
  type ValidationError,
  type FieldDefinition,
} from "@mms/shared";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  const { settings, statuses: configStatuses } = useStudentConfig();

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [manualError, setManualError] = useState("");

  const [studentDraft, setStudentDraft] = useState<Partial<Student>>(() => ({
    contactId: student?.contactId ?? "",
    fatherContactId: student?.fatherContactId ?? null,
    motherContactId: student?.motherContactId ?? null,
    guardianContactId: student?.guardianContactId ?? null,
    fatherName: student?.fatherName ?? "",
    motherName: student?.motherName ?? "",
    guardianName: student?.guardianName ?? "",
    status: student?.status ?? "active",
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? new Date().toISOString(),
    discountType: student?.discountType ?? "",
    discountPct: student?.discountPct ?? 0,
    registrationType: student?.registrationType ?? "",
    notes: student?.notes ?? "",
  }));

  const updateDraft = (patch: Partial<Student>) => {
    setStudentDraft((prev) => ({ ...prev, ...patch }));
  };

  const enabledTabs = useMemo(() => new Set(settings.enabledTabs || ["guardian", "academic"]), [settings.enabledTabs]);

  const isTabEnabled = useCallback(
    (tabId: string) => {
      if (tabId === "basic") return true;
      return enabledTabs.has(tabId);
    },
    [enabledTabs]
  );

  const isFieldEnabled = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFields = (settings.fields?.[tabId] || []) as FieldDefinition[];
      const fieldDef = tabFields.find((fieldDefinition) => fieldDefinition.key === fieldId);
      if (!fieldDef) return true;
      return fieldDef.enabled !== false;
    },
    [settings.fields]
  );

  const getFieldError = (fieldId: string) => {
    const fieldError = validationErrors.find((validationError) => validationError.fieldId === fieldId);
    return fieldError ? fieldError.message : undefined;
  };

  const { data: linkedContact } = useContactById(
    studentDraft.contactId ? String(studentDraft.contactId) : undefined,
    !!studentDraft.contactId,
  );

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() ? formatDate(linkedContact.dob.trim()) : "";

  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);

  const { data: linkedStudentContactIds = [] } = useStudentLinkedContactIds(
    student?.id ? String(student.id) : undefined,
  );

  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate: (studentDraft.registeredDate || new Date().toISOString()).split("T")[0],
    template: settings.grNumberTemplate,
    digits: settings.grNumberDigits,
    restartAnnually: settings.grNumberRestartAnnually,
    enabled: !student?.id,
  });

  useEffect(() => {
    if (student?.id || !nextGrNumber) return;
    if (!studentDraft.grNumber) {
      updateDraft({ grNumber: nextGrNumber });
    }
  }, [nextGrNumber, student?.id, studentDraft.grNumber]);

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
        id: student?.id || `st${Date.now()}`,
        enrolledSessions: student?.enrolledSessions || [],
        ...(settings.version != null ? { _blueprintId: String(settings.version) } : {}),
      }) as unknown as Student,
    );
  };

  const handleSave = async () => {
    setValidationErrors([]);
    setManualError("");

    const requiredTabs = new Set(settings.requiredTabs || []);
    const schema = buildDynamicStudentSchema(
      settings,
      enabledTabs,
      requiredTabs,
      settings.fields || {},
      language
    );

    const validationDraft = {
      ...studentDraft,
      gender: linkedGender,
      dob: linkedDob,
    };
    const parseResult = schema.safeParse(validationDraft);
    if (!parseResult.success) {
      const zodErrors = formatStudentZodIssues(parseResult.error, validationDraft, settings.fields || {});
      setValidationErrors(zodErrors);

      notify.error(t("contacts.form.pleaseFixErrors") || "Please fix validation errors");
      return;
    }

    setSaving(true);
    try {
      const email = linkedContact?.emails?.[0]?.address || linkedContact?.email || "";
      const duplicateReason = await checkStudentRegistrationDuplicate({
        excludeId: student?.id ? String(student.id) : undefined,
        contactId: String(studentDraft.contactId),
        email,
        name: linkedContact?.name,
        dob: linkedDob || undefined,
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
      notify.error(t("settings.serverSaveFailed") || "Failed to save", { description: errorMessage(err) });
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
        notify.error(t("settings.serverSaveFailed") || "Failed to save", { description: errorMessage(err) });
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

  const renderContactOwnedFieldError = (message?: string) => {
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
      <Field label={label} hint={t("students.form.contactFieldHint")}>
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
        {renderContactOwnedFieldError(error)}
      </Field>
    );
  };

  const handleContactSelect = (id: string | number | null): void => {
    if (!id) {
      updateDraft({ contactId: "", grNumber: "" });
    } else {
      updateDraft({ contactId: String(id) });
      if (!student && !studentDraft.grNumber && nextGrNumber) {
        updateDraft({ grNumber: nextGrNumber });
      }
    }
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!studentDraft.contactId || !linkedContact) return;
    void updateContact.mutateAsync({
      id: String(studentDraft.contactId),
      contact: { ...linkedContact, avatar: avatarUrl },
    });
  };

  const handleFatherSelect = (id: string | number | null, contactObj?: Contact | null): void => {
    updateDraft({ fatherContactId: id ? String(id) : null, fatherName: contactObj?.name ?? "" });
  };

  const handleMotherSelect = (id: string | number | null, contactObj?: Contact | null): void => {
    updateDraft({ motherContactId: id ? String(id) : null, motherName: contactObj?.name ?? "" });
  };

  const handleGuardianSelect = (id: string | number | null, contactObj?: Contact | null): void => {
    updateDraft({ guardianContactId: id ? String(id) : null, guardianName: contactObj?.name ?? "" });
  };

  const excludeIds = useMemo(() => {
    const list = [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId]
      .filter(Boolean)
      .map(String);
    return [...list, ...linkedStudentContactIds.map(String)];
  }, [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId, linkedStudentContactIds]);

  const errorSummary = useMemo(() => {
    if (manualError) return manualError;
    if (typedDuplicateReason) return t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]);
    return "";
  }, [manualError, typedDuplicateReason, t]);

  const footerStart = linkedContact?.name ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {linkedContact.name}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
          GR: {studentDraft.grNumber || "—"}
        </span>
        <StatusBadge status={studentDraft.status || "active"} size="sm" />
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      {t("students.form.contactRequired")}
    </span>
  );



  const renderContact = () => {
    return (
      <div className="space-y-6">
        <SectionCard
          title={t("students.form.contactLabel") || "Linked Contact"}
          subtitle={t("students.form.contactHint")}
          icon={User}
          accentColor="primary"
        >
          <div className="space-y-4">
            <ContactPicker
              label={t("students.form.contactLabel") || "Linked Contact"}
              value={studentDraft.contactId ? String(studentDraft.contactId) : null}
              onChange={handleContactSelect}
              excludeIds={excludeIds}
              onAvatarChange={handleStudentAvatarChange}
              searchPlaceholder={t("teachers.form.searchContact")}
              emptyTitle={t("teachers.form.noContacts")}
              emptyHint={t("teachers.form.noContactsHint")}
              error={!!getFieldError("contactId")}
            />
            {getFieldError("contactId") && (
              <p className="text-[10px] text-destructive mt-1 font-medium">{getFieldError("contactId")}</p>
            )}

            {studentDraft.contactId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                {renderContactProfileValue(t("students.gender"), linkedGender, User, genderError)}
                {renderContactProfileValue(t("students.form.fieldDob"), linkedDob, Calendar, dobError)}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderRegistration = () => {
    return (
      <div className="space-y-6">
        <SectionCard
          title={t("students.form.registrationSection") || "Registration Details"}
          subtitle={t("students.form.registrationSectionDesc")}
          icon={GraduationCap}
          accentColor="primary"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("students.form.grNumber")} required error={getFieldError("grNumber")}>
              <div className="relative flex items-center group/input">
                <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  required
                  value={studentDraft.grNumber || ""}
                  onChange={(event) => updateDraft({ grNumber: event.target.value })}
                  placeholder={t("students.form.grNumberPlaceholder") || "Enter GR Number"}
                  className={`${FORM_INPUT} pl-10`}
                />
              </div>
            </Field>

            <Field label={t("students.form.status")} required error={getFieldError("status")}>
              <FormSelect
                value={studentDraft.status || "active"}
                onChange={(val) => updateDraft({ status: val as StudentStatus })}
                options={(configStatuses.length > 0 ? configStatuses : STUDENT_STATUS_VALUES).map((status) => ({
                  value: status,
                  label: t(`students.form.status.${status}` as AppTranslationKey) || status,
                }))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label={t("reports.fields.registeredDate") || "Registration Date & Time"}>
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5 min-h-[44px] text-sm text-muted-foreground select-none font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span>
                    {studentDraft.registeredDate ? formatDateTime(studentDraft.registeredDate, true) : "—"}
                  </span>
                </div>
              </Field>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderGuardian = () => {
    return (
      <div className="space-y-6">
        <SectionCard
          title={t("students.form.guardiansSection")}
          subtitle={t("students.form.guardiansSectionDesc")}
          icon={Users}
          accentColor="indigo"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isFieldEnabled("guardian", "fatherLink") && (
              <div className="space-y-1">
                <ContactPicker
                  label={t("students.form.fatherLink") || "Father"}
                  value={studentDraft.fatherContactId ? String(studentDraft.fatherContactId) : null}
                  onChange={handleFatherSelect}
                  filterGender="Male"
                  excludeIds={[studentDraft.contactId, studentDraft.motherContactId, studentDraft.guardianContactId].filter(Boolean).map(String)}
                  searchPlaceholder={t("teachers.form.searchContact")}
                  emptyTitle={t("teachers.form.noContacts")}
                  error={!!getFieldError("fatherLink")}
                />
                {getFieldError("fatherLink") && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{getFieldError("fatherLink")}</p>
                )}
              </div>
            )}

            {isFieldEnabled("guardian", "motherLink") && (
              <div className="space-y-1">
                <ContactPicker
                  label={t("students.form.motherLink") || "Mother"}
                  value={studentDraft.motherContactId ? String(studentDraft.motherContactId) : null}
                  onChange={handleMotherSelect}
                  filterGender="Female"
                  excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.guardianContactId].filter(Boolean).map(String)}
                  searchPlaceholder={t("teachers.form.searchContact")}
                  emptyTitle={t("teachers.form.noContacts")}
                  error={!!getFieldError("motherLink")}
                />
                {getFieldError("motherLink") && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{getFieldError("motherLink")}</p>
                )}
              </div>
            )}

            {isFieldEnabled("guardian", "guardianLink") && (
              <div className="sm:col-span-2 space-y-1">
                <ContactPicker
                  label={t("students.form.guardianLink") || "Guardian (Other)"}
                  value={studentDraft.guardianContactId ? String(studentDraft.guardianContactId) : null}
                  onChange={handleGuardianSelect}
                  excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.motherContactId].filter(Boolean).map(String)}
                  searchPlaceholder={t("teachers.form.searchContact")}
                  emptyTitle={t("teachers.form.noContacts")}
                  error={!!getFieldError("guardianLink")}
                />
                {getFieldError("guardianLink") && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{getFieldError("guardianLink")}</p>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderAcademic = () => {
    return (
      <div className="space-y-6">
        {/* Notes */}
        <SectionCard
          title={t("teachers.field.notes") || "Notes"}
          icon={FileText}
          accentColor="emerald"
        >
          <Field label="">
            <Textarea
              value={studentDraft.notes || ""}
              onChange={(event) => updateDraft({ notes: event.target.value })}
              placeholder={t("students.form.notesPlaceholder")}
              className="min-h-[120px] bg-background"
            />
          </Field>
        </SectionCard>
      </div>
    );
  };

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={GraduationCap}
        lang={language}
        cancelLabel={t("common.cancel") || "Cancel"}
        saveLabel={saving ? (t("students.form.saving") || "Saving...") : (student ? (t("students.form.saveUpdate") || "Update") : (t("students.form.saveRegister") || "Register"))}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!studentDraft.contactId}
        error={validationErrorSummary ?? (errorSummary || undefined)}
        footerStart={footerStart}
      >
        <div className="space-y-6 pb-6">
          <div className="relative z-30">{renderContact()}</div>
          <div className="relative z-20">{renderRegistration()}</div>
          {isTabEnabled("guardian") && <div className="relative z-10">{renderGuardian()}</div>}
          {isTabEnabled("academic") && <div className="relative z-0">{renderAcademic()}</div>}
        </div>
      </FormModal>
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={setDuplicateConfirmOpen}
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
