import React, { useMemo, useState, useEffect, useTransition, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMmsForm } from "@/hooks/useMmsForm";
import { GraduationCap } from "lucide-react";
import {
  normalizeStoredStudent,
  type AppTranslationKey,
  type FieldDefinition,
  type StudentDuplicateReason,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
  STUDENTS_MODULE_CONTRACT,
  getDefaultFieldValue,
  buildDynamicStudentSchema,
  isRtlLanguage,
  hasFieldValue,
  toTitleCase,
} from "@mms/shared";
import type { Student, Contact } from "@mms/shared";
import { useContactMutations, useContactById } from "@/hooks/useContacts";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/hooks/useStudents";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useDebounce } from "@/hooks/useDebounce";
import { DatePicker } from "../ui/DatePicker";
import { MmsDynamicForm } from "../ui/MmsDynamicForm";
import ContactPicker from "../contactLink/ContactPicker";
import { ConfirmAlertDialog } from "../ui/ConfirmAlertDialog";
import { FORM_INPUT } from "../ui/formStyles";
import { useStudentConfig } from "@/hooks/useStudentConfig";
import { Input } from "../ui/input";
import { FormSelect } from "../ui/FormSelect";
import { Field, CustomFieldInput } from "../ui/FormPrimitives";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import StudentsSettings from "./StudentsSettings";

interface StudentFormData {
  contactId: string | number | null;
  fatherContactId: string | number | null;
  motherContactId: string | number | null;
  guardianContactId: string | number | null;
  fatherName: string;
  motherName: string;
  guardianName: string;
  status: string;
  grNumber: string;
  registeredDate: string | null;
  [key: string]: unknown;
}

function buildInitialData(student: Partial<Student> | null | undefined, defaultStatus: string): StudentFormData {
  const base: StudentFormData = {
    contactId: student?.contactId ?? null,
    fatherContactId: student?.fatherContactId ?? null,
    motherContactId: student?.motherContactId ?? null,
    guardianContactId: student?.guardianContactId ?? null,
    fatherName: student?.fatherName ?? "",
    motherName: student?.motherName ?? "",
    guardianName: student?.guardianName ?? "",
    status: student?.status ?? defaultStatus,
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? null,
  };

  if (student) {
    for (const [key, value] of Object.entries(student)) {
      if (!(key in base)) {
        base[key] = value;
      }
    }
  }

  return base;
}

function contactEmail(contact: Contact | undefined): string {
  if (!contact) return "";
  return ((contact.email as string | undefined) || contact.emails?.[0]?.address || "").trim().toLowerCase();
}



export interface StudentFormProps {
  student?: Partial<Student> | null;
  onClose: () => void;
  onSave: (student: Student) => void;
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
  const { role, can } = usePermissions();
  const viewerRole = role ?? "";
  const canEditSetup = can(STUDENTS_MODULE_CONTRACT.permissions.setupWrite);

  const queryClient = useQueryClient();
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [, startTransition] = useTransition();
  const { updateContact } = useContactMutations();
  const { settings, statuses, guardianContactDefaults } = useStudentConfig();
  const settingsFields = (settings.fields as Record<string, FieldDefinition[]>) || {};
  const defaultStatus = statuses[0] || "";

  const [manualError, setManualError] = useState("");

  const enabledTabsSet = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);
  const requiredTabsSet = useMemo(() => new Set(settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS), [settings.requiredTabs]);

  const { language } = useGlobalSettings();

  const initialValues = useMemo<StudentFormData>(() => {
    const draft = queryClient.getQueryData<StudentFormData>(['builder_draft', 'student', student?.id || 'new']);
    return draft || buildInitialData(student, defaultStatus);
  }, [queryClient, student, defaultStatus]);

  const schema = useMemo(() => {
    return buildDynamicStudentSchema(
      settings,
      enabledTabsSet,
      requiredTabsSet,
      settingsFields,
      language,
      viewerRole
    );
  }, [settings, enabledTabsSet, requiredTabsSet, settingsFields, language, viewerRole]);

  const {
    form,
    tab,
    setTab,
    saving,
    errors,
    errorSummary,
    handleSave,
  } = useMmsForm<StudentFormData>({
    schema,
    fields: settingsFields,
    initialData: initialValues,
    t,
  });

  const studentDraft = form.watch();
  const setValue = form.setValue;

  const handleToggleBuilderMode = useCallback((active: boolean) => {
    if (active) {
      queryClient.setQueryData(['builder_draft', 'student', student?.id || 'new'], form.getValues());
    }
    startTransition(() => {
      setIsBuilderMode(active);
    });
  }, [queryClient, student?.id, form]);

  const { data: linkedContact } = useContactById(
    studentDraft.contactId != null ? String(studentDraft.contactId) : undefined,
    studentDraft.contactId != null,
  );

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() || "";

  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<StudentFormData | null>(null);

  const identityString = useMemo(() => {
    return `${studentDraft.contactId || ""}|${linkedContact?.name || ""}|${contactEmail(linkedContact)}|${linkedDob || ""}`;
  }, [studentDraft.contactId, linkedContact, linkedDob]);

  const debouncedIdentityString = useDebounce(identityString, 500);

  const [debouncedContactId, debouncedName, debouncedEmail, debouncedDob] = useMemo(() => {
    const parts = debouncedIdentityString.split("|");
    return [parts[0] || "", parts[1] || "", parts[2] || "", parts[3] || ""];
  }, [debouncedIdentityString]);

  useEffect(() => {
    if (!debouncedContactId) {
      setTypedDuplicateReason(null);
      return;
    }

    let isMounted = true;
    const checkDuplicates = async () => {
      try {
        const reason = await checkStudentRegistrationDuplicate({
          excludeId: student?.id ? String(student.id) : undefined,
          contactId: debouncedContactId,
          email: debouncedEmail,
          name: debouncedName,
          dob: debouncedDob || undefined,
        });

        if (isMounted) {
          setTypedDuplicateReason(reason);
        }
      } catch (error) {
        console.error("Background duplicate check failed", error);
      }
    };

    void checkDuplicates();

    return () => {
      isMounted = false;
    };
  }, [debouncedContactId, debouncedName, debouncedEmail, debouncedDob, student?.id]);

  const error = useMemo(() => {
    if (errorSummary) return errorSummary;
    if (manualError) return manualError;
    if (typedDuplicateReason) return t(DUPLICATE_ERROR_KEYS[typedDuplicateReason]);
    return "";
  }, [errorSummary, manualError, typedDuplicateReason, t]);

  useEffect(() => {
    if (!studentDraft.status && defaultStatus) {
      setValue("status", defaultStatus);
    }
  }, [defaultStatus, studentDraft.status, setValue]);

  const commitSave = useCallback((formData: StudentFormData) => {
    const saved = {
      ...formData,
      registeredDate: formData.registeredDate ?? undefined,
    };
    (["fatherName", "motherName", "guardianName"] as const).forEach((key) => {
      if (typeof saved[key] === "string") {
        saved[key] = toTitleCase(saved[key]) as string;
      }
    });

    onSave(
      normalizeStoredStudent({
        ...saved,
        id: student?.id || `st${Date.now()}`,
        enrolledSessions: student?.enrolledSessions || [],
        _blueprintId: String(settings.version),
      }) as unknown as Student,
    );
  }, [onSave, student, settings.version]);

  const onSubmit = useCallback(async (formData: StudentFormData) => {
    setManualError("");

    // Gender & DOB requirements checks since they are part of contact
    const basicFields = settingsFields.basic || [];
    const genderField = basicFields.find((field: FieldDefinition) => field.key === "gender");
    const dobField = basicFields.find((field: FieldDefinition) => field.key === "dob");

    if (genderField?.required && !linkedGender) {
      setManualError(t("students.form.genderRequiredOnContact"));
      return;
    }
    if (dobField?.required && !linkedDob) {
      setManualError(t("students.form.dobRequiredOnContact"));
      return;
    }

    const duplicateReason = await checkStudentRegistrationDuplicate({
      excludeId: student?.id ? String(student.id) : undefined,
      contactId: formData.contactId ?? undefined,
      email: contactEmail(linkedContact),
      name: linkedContact?.name,
      dob: linkedDob || undefined,
    });

    if (duplicateReason) {
      setPendingSaveData(formData);
      setTypedDuplicateReason(duplicateReason);
      setDuplicateConfirmOpen(true);
      return;
    }

    commitSave(formData);
  }, [settingsFields, linkedGender, linkedDob, student?.id, linkedContact, commitSave, t]);

  const confirmDuplicateSave = useCallback(() => {
    if (pendingSaveData) {
      commitSave(pendingSaveData);
      setPendingSaveData(null);
    }
    setDuplicateConfirmOpen(false);
  }, [commitSave, pendingSaveData]);

  const registeredDate = studentDraft.registeredDate || new Date().toISOString().split("T")[0];
  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate,
    template: settings.grNumberTemplate,
    digits: settings.grNumberDigits,
    restartAnnually: settings.grNumberRestartAnnually,
    enabled: !student?.id,
  });
  const { data: linkedStudentContactIds = [] } = useStudentLinkedContactIds(
    student?.id ? String(student.id) : undefined,
  );

  useEffect(() => {
    if (student?.id || !nextGrNumber) return;
    if (!studentDraft.grNumber) {
      setValue("grNumber", nextGrNumber);
    }
  }, [nextGrNumber, student?.id, studentDraft.grNumber, setValue]);

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    // Core fields: contactId, grNumber, status
    totalRequired += 3;
    if (studentDraft.contactId) filledRequired += 1;
    if (studentDraft.grNumber) filledRequired += 1;
    if (studentDraft.status) filledRequired += 1;

    Object.entries(settingsFields).forEach(([tabId, tabFields]) => {
      if (tabId !== "basic" && !enabledTabsSet.has(tabId)) return;
      tabFields.forEach((field) => {
        if (!field.enabled) return;
        if (field.key === "gender" || field.key === "dob") return;
        if (field.type === "boolean" || field.type === "ai_summary") return;

        let valueKey = field.key;
        if (field.key === "fatherLink") valueKey = "fatherContactId";
        else if (field.key === "motherLink") valueKey = "motherContactId";
        else if (field.key === "guardianLink") valueKey = "guardianContactId";

        const isFilled = hasFieldValue(studentDraft[valueKey]);
        if (field.required) {
          totalRequired += 1;
          if (isFilled) filledRequired += 1;
        } else {
          totalOptional += 1;
          if (isFilled) filledOptional += 1;
        }
      });
    });

    const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (reqRatio * 0.7) + (optRatio * 0.3);

    return Math.round(progress * 100);
  }, [studentDraft, settingsFields, enabledTabsSet]);



  const alreadyRegisteredContactIds = linkedStudentContactIds;

  const studentExcludeIds = useMemo(() => {
    const linkedIds = [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId].filter(Boolean);
    return [...linkedIds, ...alreadyRegisteredContactIds];
  }, [studentDraft.fatherContactId, studentDraft.motherContactId, studentDraft.guardianContactId, alreadyRegisteredContactIds]);

  const handleContactSelect = (id: string | number | null): void => {
    if (!id) {
      setValue("contactId", null);
      setValue("grNumber", "");
    } else {
      setValue("contactId", id);
      if (!student && !studentDraft.grNumber && nextGrNumber) {
        setValue("grNumber", nextGrNumber);
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

  const handleRegisteredDateChange = (newDate: string): void => {
    setValue("registeredDate", newDate);
    if (!student) {
      setValue("grNumber", "");
    }
  };

  const handleFatherSelect = (id: string | number | null, contact?: Contact | null): void => {
    setValue("fatherContactId", id);
    setValue("fatherName", contact?.name ?? "");
  };

  const handleMotherSelect = (id: string | number | null, contact?: Contact | null): void => {
    setValue("motherContactId", id);
    setValue("motherName", contact?.name ?? "");
  };

  const handleGuardianSelect = (id: string | number | null, contact?: Contact | null): void => {
    setValue("guardianContactId", id);
    setValue("guardianName", contact?.name ?? "");
  };



  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    if (field.key === "gender") {
      return (
        <div key="gender">
          <Field label="Gender (contact)" required={field.required} hint="Hydrated from linked contact">
            <Input
              disabled
              value={linkedGender || "—"}
              className={FORM_INPUT}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "dob") {
      return (
        <div key="dob">
          <Field label="Date of Birth (contact)" required={field.required} hint="Hydrated from linked contact">
            <Input
              disabled
              value={linkedDob || "—"}
              className={FORM_INPUT}
            />
          </Field>
        </div>
      );
    }

    if (field.key === "fatherLink") {
      const fieldError = errors.find((error) => error.fieldId === "fatherLink");
      return (
        <div key="fatherLink" className="sm:col-span-2" id="fatherLink" data-field-key="fatherLink">
          <ContactPicker
            label={`${t("students.form.fatherLink")}${field.required ? " *" : ""}`}
            value={studentDraft.fatherContactId}
            onChange={handleFatherSelect}
            filterGender={guardianContactDefaults.fatherLink?.filterGender}
            excludeIds={[studentDraft.contactId, studentDraft.motherContactId, studentDraft.guardianContactId].filter(Boolean)}
            createDefaults={
              guardianContactDefaults.fatherLink?.createGender
                ? {
                  gender: guardianContactDefaults.fatherLink.createGender,
                  lockGender: guardianContactDefaults.fatherLink.lockGender ?? true,
                }
                : undefined
            }
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!fieldError}
          />
          {fieldError && (
            <p className="text-[10px] text-destructive mt-1 font-medium">{fieldError.message}</p>
          )}
        </div>
      );
    }

    if (field.key === "motherLink") {
      const fieldError = errors.find((error) => error.fieldId === "motherLink");
      return (
        <div key="motherLink" className="sm:col-span-2" id="motherLink" data-field-key="motherLink">
          <ContactPicker
            label={`${t("students.form.motherLink")}${field.required ? " *" : ""}`}
            value={studentDraft.motherContactId}
            onChange={handleMotherSelect}
            filterGender={guardianContactDefaults.motherLink?.filterGender}
            excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.guardianContactId].filter(Boolean)}
            createDefaults={
              guardianContactDefaults.motherLink?.createGender
                ? {
                  gender: guardianContactDefaults.motherLink.createGender,
                  lockGender: guardianContactDefaults.motherLink.lockGender ?? true,
                }
                : undefined
            }
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!fieldError}
          />
          {fieldError && (
            <p className="text-[10px] text-destructive mt-1 font-medium">{fieldError.message}</p>
          )}
        </div>
      );
    }

    if (field.key === "guardianLink") {
      const fieldError = errors.find((error) => error.fieldId === "guardianLink");
      return (
        <div key="guardianLink" className="sm:col-span-2" id="guardianLink" data-field-key="guardianLink">
          <ContactPicker
            label={`${t("students.form.guardianLink")}${field.required ? " *" : ""}`}
            value={studentDraft.guardianContactId}
            onChange={handleGuardianSelect}
            excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.motherContactId].filter(Boolean)}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!fieldError}
          />
          {fieldError && (
            <p className="text-[10px] text-destructive mt-1 font-medium">{fieldError.message}</p>
          )}
        </div>
      );
    }

    if (field.key === "registeredDate") {
      const fieldError = errors.find((error) => error.fieldId === "registeredDate");
      return (
        <div key="registeredDate" id="registeredDate" data-field-key="registeredDate">
          <Field label={t("students.form.registeredDate")} required={field.required} error={fieldError?.message}>
            <DatePicker
              required={field.required}
              value={studentDraft.registeredDate ?? undefined}
              onChange={handleRegisteredDateChange}
              className={fieldError ? "border-destructive focus-within:border-destructive focus-within:ring-destructive" : ""}
            />
          </Field>
        </div>
      );
    }

    const value = studentDraft[field.key] ?? getDefaultFieldValue(field);
    const fieldError = errors.find((error) => error.fieldId === field.key);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(nextValue) => setValue(field.key as any, nextValue, { shouldValidate: true, shouldDirty: true })}
            error={!!fieldError}
          />
        </Field>
      </div>
    );
  };

  const renderBasicContent = () => {
    if (tab !== "basic") {
      return null;
    }

    const guardianFields = settingsFields.guardian || [];
    const hasGuardianFields = guardianFields.some((f) => f.enabled);

    // Extract all dynamic custom or system fields from settingsFields
    const additionalFields = (() => {
      const list: FieldDefinition[] = [];
      Object.entries(settingsFields).forEach(([tabId, tabFields]) => {
        if (tabId === "guardian") return;
        (tabFields || []).forEach((field) => {
          if (!field.enabled) return;
          if (
            field.key === "gender" ||
            field.key === "dob" ||
            field.key === "registeredDate" ||
            field.key === "fatherLink" ||
            field.key === "motherLink" ||
            field.key === "guardianLink"
          ) {
            return;
          }
          list.push(field);
        });
      });
      return list;
    })();

    return (
      <div className="space-y-6 text-left pb-4">
        {/* Section 1: Contact Registry Link */}
        <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.contactLabel")}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("students.form.contactHint")}</p>
          </div>

          <ContactPicker
            label={t("students.form.contactLabel")}
            value={studentDraft.contactId}
            onChange={handleContactSelect}
            excludeIds={studentExcludeIds}
            onAvatarChange={handleStudentAvatarChange}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!errors.find((error) => error.fieldId === "contactId")}
          />
          {errors.find((error) => error.fieldId === "contactId") && (
            <p className="text-[10px] text-destructive mt-1 font-medium">
              {errors.find((error) => error.fieldId === "contactId")?.message}
            </p>
          )}

          {/* Inline Profile fields revealed when Contact is selected */}
          {studentDraft.contactId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
              {settingsFields.basic?.some((f) => f.key === "gender" && f.enabled) && (
                renderFieldByKey(settingsFields.basic.find((f) => f.key === "gender")!)
              )}
              {settingsFields.basic?.some((f) => f.key === "dob" && f.enabled) && (
                renderFieldByKey(settingsFields.basic.find((f) => f.key === "dob")!)
              )}
            </div>
          )}
        </section>

        {/* Section 2: Registration Details */}
        <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.registrationSection")}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("students.form.registrationSectionDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Field label={t("students.form.grNumber")} required hint={t("students.form.grNumberHint")} error={errors.find((error) => error.fieldId === "grNumber")?.message}>
                <Input
                  required
                  className={cn(FORM_INPUT, errors.find((error) => error.fieldId === "grNumber") && "border-destructive focus-visible:ring-destructive")}
                  value={studentDraft.grNumber || ""}
                  onChange={(event) => setValue("grNumber", event.target.value, { shouldValidate: true, shouldDirty: true })}
                  placeholder={t("students.form.grNumberPlaceholder")}
                />
              </Field>
            </div>

            <div>
              <Field label={t("students.form.status")} error={errors.find((error) => error.fieldId === "status")?.message}>
                <FormSelect
                  value={studentDraft.status}
                  onChange={(statusValue) => setValue("status", statusValue, { shouldValidate: true, shouldDirty: true })}
                  options={statuses.map((status) => ({
                    value: status,
                    label: t(`students.form.status.${status}` as AppTranslationKey),
                  }))}
                  className={errors.find((error) => error.fieldId === "status") ? "border-destructive focus:border-destructive" : ""}
                />
              </Field>
            </div>

            {/* Registration Date if enabled */}
            {Object.values(settingsFields).flat().some((f) => f.key === "registeredDate" && f.enabled) && (
              renderFieldByKey(Object.values(settingsFields).flat().find((f) => f.key === "registeredDate")!)
            )}
          </div>
        </section>

        {/* Section 3: Family & Guardians */}
        {hasGuardianFields && (
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Family & Guardians</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Link parents or guardians for emergency and system notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guardianFields.map((field) => renderFieldByKey(field))}
            </div>
          </section>
        )}

        {/* Section 4: Additional Information */}
        {additionalFields.length > 0 && (
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Additional Information</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Extra information configured in fields registry settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {additionalFields.map((field) => renderFieldByKey(field))}
            </div>
          </section>
        )}
      </div>
    );
  };

  const footerStart = linkedContact?.name ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{linkedContact.name}</span>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <span>GR: {studentDraft.grNumber}</span>
        <span className="border-l border-border pl-2 capitalize">
          Status: {studentDraft.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">{t("students.form.contactRequired")}</span>
  );

  return (
    <>
      <MmsDynamicForm
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={GraduationCap}
        tall
        progress={completeness}
        progressLabel={t("common.formProgress")}
        showBuilderToggle={canEditSetup}
        isBuilderMode={isBuilderMode}
        onBuilderModeChange={handleToggleBuilderMode}
        tabs={undefined}
        activeTab={undefined}
        onTabChange={undefined}
        tabPanelIdPrefix="student-form-tab"
        dir={isRtlLanguage(language) ? "rtl" : "ltr"}
        lang={language}
        cancelLabel={t("common.cancel")}
        saveLabel={
          saving
            ? t("students.form.saving")
            : student
              ? t("students.form.saveUpdate")
              : t("students.form.saveRegister")
        }
        onSave={() => void handleSave(onSubmit)()}
        saving={saving}
        saveDisabled={!studentDraft.contactId}
        error={error || undefined}
        footerStart={footerStart}
        fields={settingsFields[tab] || []}
        data={studentDraft}
        setValue={setValue}
        errors={errors}
        renderField={renderFieldByKey}
        renderBasicContent={renderBasicContent}
        builderPanel={<StudentsSettings mode="fields" />}
      />
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={setDuplicateConfirmOpen}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        description={typedDuplicateReason ? `${t(DUPLICATE_ERROR_KEYS[typedDuplicateReason])} Save anyway?` : ""}
        confirmLabel={t("common.yes")}
        onConfirm={confirmDuplicateSave}
      />
    </>
  );
}
