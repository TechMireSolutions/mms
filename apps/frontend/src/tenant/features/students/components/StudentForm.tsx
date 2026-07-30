import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { GraduationCap } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useContactMutations, useContactById } from "@/tenant/hooks/collections/contacts";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { studentStatusBadgeConfig, studentStatusLabel } from "@/lib/students/studentStatusUi";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/tenant/features/students/hooks/useStudents";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import {
  type Student,
  type Contact,
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
  todayISO,
  type FieldDefinition,
  DEFAULT_STUDENT_ENABLED_TABS,
} from "@mms/shared";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { getInitialStudentDraft } from "@/tenant/features/students/components/studentFormDraft";
import {
  StudentContactSection,
  StudentGuardianSection,
  StudentNotesSection,
  StudentRegistrationSection,
} from "@/tenant/features/students/components/StudentFormSections";

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
  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);
  const grManuallyEdited = useRef(false);

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

  const handleContactSelect = (id: string | number | null): void => {
    if (!id) {
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

  const validationErrorSummary = useMemo(() => {
    if (validationErrors.length === 0) return undefined;
    return validationErrors.map((validationError) => validationError.message);
  }, [validationErrors]);

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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
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
          <StudentContactSection
            contactId={studentDraft.contactId}
            excludeIds={excludeIds}
            linkedGenderLabel={linkedGenderLabel}
            linkedDob={linkedDob}
            genderError={getFieldError("gender")}
            dobError={getFieldError("dob")}
            getFieldError={getFieldError}
            onContactSelect={handleContactSelect}
            onStudentAvatarChange={handleStudentAvatarChange}
          />

          <StudentRegistrationSection
            studentDraft={studentDraft}
            isGrAutoAssigned={isGrAutoAssigned}
            statusSelectOptions={statusSelectOptions}
            getFieldError={getFieldError}
            onGrNumberChange={handleGrNumberChange}
            onDraftChange={updateDraft}
          />

          <StudentGuardianSection
            enabled={enabledTabs.has("guardian")}
            studentDraft={studentDraft}
            fatherExcludeIds={fatherExcludeIds}
            motherExcludeIds={motherExcludeIds}
            guardianExcludeIds={guardianExcludeIds}
            getFieldError={getFieldError}
            isFieldEnabled={isFieldEnabled}
            onParentSelect={handleParentSelect}
          />

          <StudentNotesSection
            enabled={enabledTabs.has("academic")}
            notes={studentDraft.notes}
            onDraftChange={updateDraft}
          />
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
