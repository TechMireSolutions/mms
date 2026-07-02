import React, { useMemo, useState, useEffect, useCallback } from "react";
import { GraduationCap, User, Users, Hash, Tag, Percent, Calendar, FileText } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { DatePicker } from "../ui/DatePicker";
import ContactPicker from "../contactLink/ContactPicker";
import { ConfirmAlertDialog } from "../ui/ConfirmAlertDialog";
import { FORM_INPUT } from "../ui/formStyles";
import { Field } from "@/components/ui/FormPrimitives";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useContactMutations, useContactById } from "@/hooks/useContacts";
import { useStudentConfig } from "@/hooks/useStudentConfig";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/hooks/useStudents";
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
  STUDENT_TAB_REGISTRY,
  type FieldDefinition,
} from "@mms/shared";

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
  const { language } = useGlobalSettings();
  const { updateContact } = useContactMutations();
  const { settings, statuses: configStatuses, discountTypes } = useStudentConfig();

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [tab, setTab] = useState<string>("basic");
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
    registeredDate: student?.registeredDate ?? new Date().toISOString().split("T")[0],
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
      const fieldDef = tabFields.find((f) => f.key === fieldId);
      if (!fieldDef) return true;
      return fieldDef.enabled !== false;
    },
    [settings.fields]
  );

  const isFieldRequired = useCallback(
    (tabId: string, fieldId: string) => {
      const tabFields = (settings.fields?.[tabId] || []) as FieldDefinition[];
      const fieldDef = tabFields.find((f) => f.key === fieldId);
      if (!fieldDef) return false;
      return fieldDef.required === true;
    },
    [settings.fields]
  );

  const visibleTabs = useMemo(() => {
    return STUDENT_TAB_REGISTRY.filter((tabItem) => {
      return isTabEnabled(tabItem.key);
    });
  }, [isTabEnabled]);

  const getFieldError = (fieldId: string) => {
    const err = validationErrors.find((e) => e.fieldId === fieldId);
    return err ? err.message : undefined;
  };

  const getTabHasError = (tabId: string) => {
    return validationErrors.some((e) => e.tabId === tabId);
  };

  const { data: linkedContact } = useContactById(
    studentDraft.contactId ? String(studentDraft.contactId) : undefined,
    !!studentDraft.contactId,
  );

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() || "";

  const [typedDuplicateReason, setTypedDuplicateReason] = useState<StudentDuplicateReason | null>(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Student> | null>(null);

  const { data: linkedStudentContactIds = [] } = useStudentLinkedContactIds(
    student?.id ? String(student.id) : undefined,
  );

  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate: studentDraft.registeredDate || new Date().toISOString().split("T")[0],
    template: "GR-{YEAR}-{SEQ}",
    digits: 4,
    restartAnnually: true,
    enabled: !student?.id,
  });

  useEffect(() => {
    if (student?.id || !nextGrNumber) return;
    if (!studentDraft.grNumber) {
      updateDraft({ grNumber: nextGrNumber });
    }
  }, [nextGrNumber, student?.id, studentDraft.grNumber]);

  const commitSave = (data: Partial<Student>) => {
    const saved = {
      ...data,
      registeredDate: data.registeredDate || undefined,
      fatherName: data.fatherName ? toTitleCase(data.fatherName) : "",
      motherName: data.motherName ? toTitleCase(data.motherName) : "",
      guardianName: data.guardianName ? toTitleCase(data.guardianName) : "",
    };

    onSave(
      normalizeStoredStudent({
        ...saved,
        id: student?.id || `st${Date.now()}`,
        enrolledSessions: student?.enrolledSessions || [],
        _blueprintId: "1",
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

    const parseResult = schema.safeParse(studentDraft);
    if (!parseResult.success) {
      const zodErrors = formatStudentZodIssues(parseResult.error, studentDraft, settings.fields || {});
      setValidationErrors(zodErrors);

      if (zodErrors.length > 0) {
        const firstErrTab = zodErrors[0].tabId;
        if (firstErrTab && firstErrTab !== tab) {
          setTab(firstErrTab);
        }
      }

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

      commitSave(studentDraft);
      onClose();
    } catch (err: any) {
      notify.error(t("settings.serverSaveFailed") || "Failed to save", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDuplicateSave = () => {
    if (pendingSaveData) {
      commitSave(pendingSaveData);
      setPendingSaveData(null);
    }
    setDuplicateConfirmOpen(false);
    onClose();
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 text-[10px] capitalize">
          {studentDraft.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      {t("students.form.contactRequired")}
    </span>
  );

  const renderBasic = () => {
    return (
      <div className="space-y-6">
        {/* Contact Link */}
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <User className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.contactLabel") || "Linked Contact"}</h3>
          </div>

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
              <Field label="Gender (contact)" hint="From contact profile">
                <div className="relative flex items-center group/input">
                  <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 transition-colors pointer-events-none" />
                  <Input disabled value={linkedGender || "—"} className={`${FORM_INPUT} pl-10`} />
                </div>
              </Field>
              <Field label="Date of Birth (contact)" hint="From contact profile">
                <div className="relative flex items-center group/input">
                  <Calendar className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 transition-colors pointer-events-none" />
                  <Input disabled value={linkedDob || "—"} className={`${FORM_INPUT} pl-10`} />
                </div>
              </Field>
            </div>
          )}
        </section>

        {/* Identity details (GR Number, Status, Registration Type) */}
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <GraduationCap className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.registrationSection") || "Registration Details"}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("students.form.grNumber")} required error={getFieldError("grNumber")}>
              <div className="relative flex items-center group/input">
                <Hash className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  required
                  value={studentDraft.grNumber || ""}
                  onChange={(e) => updateDraft({ grNumber: e.target.value })}
                  placeholder={t("students.form.grNumberPlaceholder") || "Enter GR Number"}
                  className={`${FORM_INPUT} pl-10`}
                />
              </div>
            </Field>

            <Field label={t("students.form.status")} required error={getFieldError("status")}>
              <FormSelect
                value={studentDraft.status || "active"}
                onChange={(val) => updateDraft({ status: val as StudentStatus })}
                options={(configStatuses.length > 0 ? configStatuses : STUDENT_STATUS_VALUES).map((s) => ({
                  value: s,
                  label: t(`students.form.status.${s}` as AppTranslationKey) || s,
                }))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Registration Type">
                <div className="relative flex items-center group/input">
                  <Tag className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    value={studentDraft.registrationType || ""}
                    onChange={(e) => updateDraft({ registrationType: e.target.value })}
                    placeholder="e.g. Regular, Online"
                    className={`${FORM_INPUT} pl-10`}
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderGuardian = () => {
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500/60 transition-colors group-hover:bg-purple-500" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <Users className="w-4 h-4 text-purple-500/70 group-hover:text-purple-500 transition-colors" />
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Family & Guardians</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Link parent/guardian contacts</p>
            </div>
          </div>

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
        </section>
      </div>
    );
  };

  const renderAcademic = () => {
    return (
      <div className="space-y-6">
        {/* Registration date & Finance Details */}
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <GraduationCap className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Enrollment & Finance</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isFieldEnabled("academic", "registeredDate") && (
              <Field label={t("students.form.registeredDate") || "Registration Date"} required={isFieldRequired("academic", "registeredDate")} error={getFieldError("registeredDate")}>
                <DatePicker
                  value={studentDraft.registeredDate || undefined}
                  onChange={(dateStr) => updateDraft({ registeredDate: dateStr })}
                />
              </Field>
            )}

            <Field label="Discount Type">
              <div className="relative flex items-center group/input">
                <Tag className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  value={studentDraft.discountType || ""}
                  onChange={(e) => updateDraft({ discountType: e.target.value })}
                  placeholder="e.g. Sibling, Need-based"
                  className={`${FORM_INPUT} pl-10`}
                />
              </div>
            </Field>

            <Field label="Discount %">
              <div className="relative flex items-center group/input">
                <Percent className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  type="number"
                  value={studentDraft.discountPct ?? 0}
                  onChange={(e) => updateDraft({ discountPct: Number(e.target.value) })}
                  className={`${FORM_INPUT} pl-10`}
                />
              </div>
            </Field>
          </div>
        </section>

        {/* Notes */}
        <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500" />
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
            <FileText className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("teachers.field.notes") || "Notes"}</h3>
          </div>
          <Field label="">
            <textarea
              value={studentDraft.notes || ""}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
            />
          </Field>
        </section>
      </div>
    );
  };

  const renderActiveTabContent = () => {
    switch (tab) {
      case "basic":
        return renderBasic();
      case "guardian":
        return renderGuardian();
      case "academic":
        return renderAcademic();
      default:
        return null;
    }
  };

  const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    basic: User,
    guardian: Users,
    academic: GraduationCap,
  };

  const modalTabs = visibleTabs.map((t) => ({
    ...t,
    icon: TAB_ICONS[t.key],
    label: getTabHasError(t.key) ? `${t.label} 🔴` : t.label,
  }));

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={GraduationCap}
        tall
        tabs={modalTabs}
        activeTab={tab}
        onTabChange={setTab}
        lang={language}
        cancelLabel={t("common.cancel") || "Cancel"}
        saveLabel={saving ? (t("students.form.saving") || "Saving...") : (student ? (t("students.form.saveUpdate") || "Update") : (t("students.form.saveRegister") || "Register"))}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!studentDraft.contactId}
        error={errorSummary || undefined}
        footerStart={footerStart}
      >
        {renderActiveTabContent()}
      </FormModal>
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
