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
  canViewContactTab,
  canViewContactField,
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
  onSave: (data: Student) => void;
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

  const visibleTabs = useMemo(() => {
    const tabsFromConfig = settings.formTabs || [];
    return [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tabDef) => {
        if (!tabDef.enabled) return false;
        if (tabDef.key === "basic") return true;
        if (!enabledTabsSet.has(tabDef.key)) return false;
        if (!canViewContactTab(viewerRole, tabDef)) return false;

        // Ghost Tab Prevention (Rule 13.3)
        const tabFields = settingsFields[tabDef.key] || [];
        if (tabFields.length > 0) {
          const hasVisibleFields = tabFields.some(
            (field) => field.enabled && canViewContactField(viewerRole, field)
          );
          if (!hasVisibleFields) return false;
        }
        return true;
      });
  }, [settings.formTabs, enabledTabsSet, settingsFields, viewerRole]);

  const formTabs = useMemo(() => {
    return visibleTabs.map((t) => ({
      key: t.key,
      label: t.label,
    }));
  }, [visibleTabs]);

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

  const data = form.watch();
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
    data.contactId != null ? String(data.contactId) : undefined,
    data.contactId != null,
  );

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() || "";

  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<StudentFormData | null>(null);

  const identityString = useMemo(() => {
    return `${data.contactId || ""}|${linkedContact?.name || ""}|${contactEmail(linkedContact)}|${linkedDob || ""}`;
  }, [data.contactId, linkedContact, linkedDob]);

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
      } catch (err) {
        console.error("Background duplicate check failed", err);
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
    if (!data.status && defaultStatus) {
      setValue("status", defaultStatus);
    }
  }, [defaultStatus, data.status, setValue]);

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
    const genderDef = basicFields.find((f: FieldDefinition) => f.key === "gender");
    const dobDef = basicFields.find((f: FieldDefinition) => f.key === "dob");

    if (genderDef?.required && !linkedGender) {
      setManualError(t("students.form.genderRequiredOnContact"));
      return;
    }
    if (dobDef?.required && !linkedDob) {
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

  const regDate = data.registeredDate || new Date().toISOString().split("T")[0];
  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate: regDate,
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
    if (!data.grNumber) {
      setValue("grNumber", nextGrNumber);
    }
  }, [nextGrNumber, student?.id, data.grNumber, setValue]);

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    // Core fields: contactId, grNumber, status
    totalRequired += 3;
    if (data.contactId) filledRequired += 1;
    if (data.grNumber) filledRequired += 1;
    if (data.status) filledRequired += 1;

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

        const isFilled = hasFieldValue(data[valueKey]);
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
  }, [data, settingsFields, enabledTabsSet]);



  const alreadyRegisteredContactIds = linkedStudentContactIds;

  const studentExcludeIds = useMemo(() => {
    const linkedIds = [data.fatherContactId, data.motherContactId, data.guardianContactId].filter(Boolean);
    return [...linkedIds, ...alreadyRegisteredContactIds];
  }, [data.fatherContactId, data.motherContactId, data.guardianContactId, alreadyRegisteredContactIds]);

  const handleContactSelect = (id: string | number | null): void => {
    if (!id) {
      setValue("contactId", null);
      setValue("grNumber", "");
    } else {
      setValue("contactId", id);
      if (!student && !data.grNumber && nextGrNumber) {
        setValue("grNumber", nextGrNumber);
      }
    }
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!data.contactId || !linkedContact) return;
    void updateContact.mutateAsync({
      id: String(data.contactId),
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
      const fieldError = errors.find((e) => e.fieldId === "fatherLink");
      return (
        <div key="fatherLink" className="sm:col-span-2" id="fatherLink" data-field-key="fatherLink">
          <ContactPicker
            label={`${t("students.form.fatherLink")}${field.required ? " *" : ""}`}
            value={data.fatherContactId}
            onChange={handleFatherSelect}
            filterGender={guardianContactDefaults.fatherLink?.filterGender}
            excludeIds={[data.contactId, data.motherContactId, data.guardianContactId].filter(Boolean)}
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
      const fieldError = errors.find((e) => e.fieldId === "motherLink");
      return (
        <div key="motherLink" className="sm:col-span-2" id="motherLink" data-field-key="motherLink">
          <ContactPicker
            label={`${t("students.form.motherLink")}${field.required ? " *" : ""}`}
            value={data.motherContactId}
            onChange={handleMotherSelect}
            filterGender={guardianContactDefaults.motherLink?.filterGender}
            excludeIds={[data.contactId, data.fatherContactId, data.guardianContactId].filter(Boolean)}
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
      const fieldError = errors.find((e) => e.fieldId === "guardianLink");
      return (
        <div key="guardianLink" className="sm:col-span-2" id="guardianLink" data-field-key="guardianLink">
          <ContactPicker
            label={`${t("students.form.guardianLink")}${field.required ? " *" : ""}`}
            value={data.guardianContactId}
            onChange={handleGuardianSelect}
            excludeIds={[data.contactId, data.fatherContactId, data.motherContactId].filter(Boolean)}
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
      const fieldError = errors.find((e) => e.fieldId === "registeredDate");
      return (
        <div key="registeredDate" id="registeredDate" data-field-key="registeredDate">
          <Field label={t("students.form.registeredDate")} required={field.required} error={fieldError?.message}>
            <DatePicker
              required={field.required}
              value={data.registeredDate ?? undefined}
              onChange={handleRegisteredDateChange}
              className={fieldError ? "border-destructive focus-within:border-destructive focus-within:ring-destructive" : ""}
            />
          </Field>
        </div>
      );
    }

    const value = data[field.key] ?? getDefaultFieldValue(field);
    const fieldError = errors.find((e) => e.fieldId === field.key);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setValue(field.key as any, next, { shouldValidate: true, shouldDirty: true })}
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

    const basicFields = (settingsFields.basic || []).filter((f: FieldDefinition) => f.enabled);

    return (
      <div className="space-y-5 text-left">
        {/* Contact Picker Section */}
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-foreground">{t("students.form.contactLabel")}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t("students.form.contactHint")}</p>
          </div>
          <ContactPicker
            label={t("students.form.contactLabel")}
            value={data.contactId}
            onChange={handleContactSelect}
            excludeIds={studentExcludeIds}
            onAvatarChange={handleStudentAvatarChange}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
            error={!!errors.find((e) => e.fieldId === "contactId")}
          />
          {errors.find((e) => e.fieldId === "contactId") && (
            <p className="text-[10px] text-destructive mt-1 font-medium">
              {errors.find((e) => e.fieldId === "contactId")?.message}
            </p>
          )}
        </section>

        {/* Identity Fields Section */}
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-foreground">{t("students.form.registrationSection")}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("students.form.registrationSectionDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Field label={t("students.form.grNumber")} required hint={t("students.form.grNumberHint")} error={errors.find((e) => e.fieldId === "grNumber")?.message}>
                <Input
                  required
                  className={cn(FORM_INPUT, errors.find((e) => e.fieldId === "grNumber") && "border-destructive focus-visible:ring-destructive")}
                  value={data.grNumber || ""}
                  onChange={(e) => setValue("grNumber", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  placeholder={t("students.form.grNumberPlaceholder")}
                />
              </Field>
            </div>

            <div>
              <Field label={t("students.form.status")} error={errors.find((e) => e.fieldId === "status")?.message}>
                <FormSelect
                  value={data.status}
                  onChange={(val) => setValue("status", val, { shouldValidate: true, shouldDirty: true })}
                  options={statuses.map((status) => ({
                    value: status,
                    label: t(`students.form.status.${status}` as AppTranslationKey),
                  }))}
                  className={errors.find((e) => e.fieldId === "status") ? "border-destructive focus:border-destructive" : ""}
                />
              </Field>
            </div>

            {basicFields.map((field: FieldDefinition) => {
              if (field.key !== "registeredDate") {
                return renderFieldByKey(field);
              }
              return null;
            })}

            {basicFields.some((f: FieldDefinition) => f.key === "registeredDate") && renderFieldByKey(
              basicFields.find((f: FieldDefinition) => f.key === "registeredDate")!
            )}
          </div>
        </section>
      </div>
    );
  };

  const footerStart = linkedContact?.name ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{linkedContact.name}</span>
      <div className="flex items-center gap-2 border-l border-border pl-3">
        <span>GR: {data.grNumber}</span>
        <span className="border-l border-border pl-2 capitalize">
          Status: {data.status}
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
        tabs={formTabs}
        activeTab={tab}
        onTabChange={setTab}
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
        saveDisabled={!data.contactId}
        error={error || undefined}
        footerStart={footerStart}
        fields={settingsFields[tab] || []}
        data={data}
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
