import React, { useMemo, useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import {
  normalizeStoredStudent,
  type AppTranslationKey,
  type FieldDefinition,
  type StudentDuplicateReason,
  DEFAULT_STUDENT_ENABLED_TABS,
  DEFAULT_STUDENT_REQUIRED_TABS,
} from "@mms/shared";
import type { Student } from "@/lib/data/studentsData";
import type { Contact } from "@mms/shared";
import { toTitleCase } from "@/lib/utils";
import { useContactMutations, useContactById } from "@/hooks/useContacts";
import {
  checkStudentRegistrationDuplicate,
  useStudentLinkedContactIds,
  useStudentNextGrNumber,
} from "@/hooks/useStudents";
import useTranslation from "@/hooks/useTranslation";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import ContactPicker from "../contactLink/ContactPicker";
import { calculateKeyedUnitsCompleteness } from "@/lib/formCompleteness";
import { FORM_INPUT, FORM_LABEL } from "../ui/formStyles";
import { useStudentConfig } from "@/hooks/useStudentConfig";
import { buildDynamicStudentSchema, formatZodIssues, type ValidationError } from "@/lib/studentConfig/validationSchema";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import FormSelect from "../ui/FormSelect";
import { Checkbox } from "../ui/checkbox";

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
  registeredDate: string;
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
    registeredDate: student?.registeredDate ?? new Date().toISOString().split("T")[0],
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

function CustomFieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}): React.JSX.Element {
  if (field.type === "textarea") {
    return (
      <Textarea
        className="bg-background text-xs py-1.5 min-h-[80px]"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        placeholder={field.placeholder || ""}
      />
    );
  }
  if (field.type === "select") {
    return (
      <FormSelect
        placeholder="—"
        value={(value as string) ?? ""}
        onChange={(val) => onChange(val)}
        options={field.options || []}
      />
    );
  }
  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-2.5 py-2">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
          id={`field-${field.key}`}
        />
        <label htmlFor={`field-${field.key}`} className="text-xs font-medium text-foreground cursor-pointer select-none">
          {field.label}
        </label>
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <Input
        type="number"
        className={FORM_INPUT}
        value={(value as number) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        placeholder={field.placeholder || ""}
      />
    );
  }
  if (field.type === "date") {
    return (
      <DatePicker
        value={(value as string) ?? ""}
        onChange={(val) => onChange(val)}
        required={field.required}
      />
    );
  }
  return (
    <Input
      type="text"
      className={FORM_INPUT}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      placeholder={field.placeholder || ""}
    />
  );
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
  const { updateContact } = useContactMutations();
  const { settings, statuses, guardianContactDefaults } = useStudentConfig();
  const settingsFields = (settings.fields as Record<string, FieldDefinition[]>) || {};
  const defaultStatus = statuses[0] || "";

  const [tab, setTab] = useState<string>("basic");
  const [data, setData] = useState<StudentFormData>(() => buildInitialData(student, defaultStatus));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const enabledTabsSet = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);
  const requiredTabsSet = useMemo(() => new Set(settings.requiredTabs || DEFAULT_STUDENT_REQUIRED_TABS), [settings.requiredTabs]);

  const visibleTabs = useMemo(() => {
    const tabsFromConfig = settings.formTabs || [];
    return [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tabDef) => {
        if (!tabDef.enabled) return false;
        if (tabDef.key === "basic") return true;
        return enabledTabsSet.has(tabDef.key);
      });
  }, [settings.formTabs, enabledTabsSet]);

  const formTabs = useMemo(
    () =>
      visibleTabs.map((t) => ({
        key: t.key,
        label: t.label,
      })),
    [visibleTabs],
  );

  useEffect(() => {
    setData((current) => (current.status || !defaultStatus ? current : { ...current, status: defaultStatus }));
  }, [defaultStatus]);

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
    setData((d) => (d.grNumber ? d : { ...d, grNumber: nextGrNumber }));
  }, [nextGrNumber, student?.id]);

  const { data: linkedContact } = useContactById(
    data.contactId != null ? String(data.contactId) : undefined,
    data.contactId != null,
  );

  const completeness = useMemo(() => {
    const units: { key: string; enabled?: boolean }[] = [{ key: "contactId" }];
    const fields = settingsFields;
    
    Object.entries(fields).forEach(([tabId, tabFields]) => {
      if (tabId !== "basic" && !enabledTabsSet.has(tabId)) return;
      tabFields.forEach((field) => {
        if (!field.enabled) return;
        if (field.key === "fatherLink") units.push({ key: "fatherContactId" });
        else if (field.key === "motherLink") units.push({ key: "motherContactId" });
        else if (field.key === "guardianLink") units.push({ key: "guardianContactId" });
        else if (field.key !== "gender" && field.key !== "dob") units.push({ key: field.key });
      });
    });
    return calculateKeyedUnitsCompleteness(data, units);
  }, [data, settingsFields, enabledTabsSet]);

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() || "";

  const alreadyRegisteredContactIds = linkedStudentContactIds;

  const studentExcludeIds = useMemo(() => {
    const linkedIds = [data.fatherContactId, data.motherContactId, data.guardianContactId].filter(Boolean);
    return [...linkedIds, ...alreadyRegisteredContactIds];
  }, [data.fatherContactId, data.motherContactId, data.guardianContactId, alreadyRegisteredContactIds]);

  const handleContactSelect = (id: string | number | null): void => {
    setData((d) => {
      if (!id) {
        return { ...d, contactId: null, grNumber: "" };
      }
      const autoGr = !student && !d.grNumber && nextGrNumber ? nextGrNumber : d.grNumber;
      return { ...d, contactId: id, grNumber: autoGr };
    });
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!data.contactId || !linkedContact) return;
    void updateContact.mutateAsync({
      id: String(data.contactId),
      contact: { ...linkedContact, avatar: avatarUrl },
    });
  };

  const handleRegisteredDateChange = (newDate: string): void => {
    setData((d) => ({
      ...d,
      registeredDate: newDate,
      grNumber: !student ? "" : d.grNumber,
    }));
  };

  const handleFatherSelect = (id: string | number | null, contact?: Contact | null): void => {
    setData((d) => ({ ...d, fatherContactId: id, fatherName: contact?.name ?? "" }));
  };

  const handleMotherSelect = (id: string | number | null, contact?: Contact | null): void => {
    setData((d) => ({ ...d, motherContactId: id, motherName: contact?.name ?? "" }));
  };

  const handlePageChangeTab = (nextTab: string): void => {
    setTab(nextTab);
  };

  const handleGuardianSelect = (id: string | number | null, contact?: Contact | null): void => {
    setData((d) => ({ ...d, guardianContactId: id, guardianName: contact?.name ?? "" }));
  };

  const handleSave = async (): Promise<void> => {
    setError("");
    setErrors([]);

    const fields = settingsFields;
    const schema = buildDynamicStudentSchema(
      settings,
      enabledTabsSet,
      requiredTabsSet,
      fields,
      "en"
    );

    const validationData = {
      ...data,
      gender: linkedGender,
      dob: linkedDob,
    };

    const result = schema.safeParse(validationData);
    if (!result.success) {
      const validationErrors = formatZodIssues(result.error, validationData, fields);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setError(validationErrors[0].message);
        if (validationErrors[0].tabId) {
          setTab(validationErrors[0].tabId);
        }
        return;
      }
    }

    // Gender & DOB requirements checks since they are part of contact
    const basicFields = fields.basic || [];
    const genderDef = basicFields.find((f: FieldDefinition) => f.key === "gender");
    const dobDef = basicFields.find((f: FieldDefinition) => f.key === "dob");

    if (genderDef?.required && !linkedGender) {
      setError(t("students.form.genderRequiredOnContact"));
      setTab("basic");
      return;
    }
    if (dobDef?.required && !linkedDob) {
      setError(t("students.form.dobRequiredOnContact"));
      setTab("basic");
      return;
    }

    setSaving(true);

    const duplicateReason = await checkStudentRegistrationDuplicate({
      excludeId: student?.id ? String(student.id) : undefined,
      contactId: data.contactId ?? undefined,
      email: contactEmail(linkedContact),
      name: linkedContact?.name,
      dob: linkedDob || undefined,
    });
    if (duplicateReason) {
      setError(t(DUPLICATE_ERROR_KEYS[duplicateReason]));
      setSaving(false);
      return;
    }

    const saved = { ...data };
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
      }) as unknown as Student,
    );
    setSaving(false);
  };

  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    if (field.key === "gender") {
      return (
        <div key="gender">
          <label className={FORM_LABEL}>
            Gender (contact)
            {field.required ? " *" : ""}
          </label>
          <Input
            disabled
            value={linkedGender || "—"}
            className={FORM_INPUT}
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">Hydrated from linked contact</p>
        </div>
      );
    }

    if (field.key === "dob") {
      return (
        <div key="dob">
          <label className={FORM_LABEL}>
            Date of Birth (contact)
            {field.required ? " *" : ""}
          </label>
          <Input
            disabled
            value={linkedDob || "—"}
            className={FORM_INPUT}
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">Hydrated from linked contact</p>
        </div>
      );
    }

    if (field.key === "fatherLink") {
      return (
        <div key="fatherLink" className="sm:col-span-2">
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
          />
        </div>
      );
    }

    if (field.key === "motherLink") {
      return (
        <div key="motherLink" className="sm:col-span-2">
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
          />
        </div>
      );
    }

    if (field.key === "guardianLink") {
      return (
        <div key="guardianLink" className="sm:col-span-2">
          <ContactPicker
            label={`${t("students.form.guardianLink")}${field.required ? " *" : ""}`}
            value={data.guardianContactId}
            onChange={handleGuardianSelect}
            excludeIds={[data.contactId, data.fatherContactId, data.motherContactId].filter(Boolean)}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
          />
        </div>
      );
    }

    if (field.key === "registeredDate") {
      return (
        <div key="registeredDate">
          <label className={FORM_LABEL}>
            {t("students.form.registeredDate")}
            {field.required ? " *" : ""}
          </label>
          <DatePicker
            required={field.required}
            value={data.registeredDate}
            onChange={handleRegisteredDateChange}
          />
        </div>
      );
    }

    const value = data[field.key] ?? "";
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        {field.type !== "boolean" ? (
          <label className={FORM_LABEL}>
            {field.label}
            {field.required ? " *" : ""}
          </label>
        ) : null}
        <CustomFieldInput
          field={field}
          value={value}
          onChange={(next) => setData((d) => ({ ...d, [field.key]: next }))}
        />
        {field.description && (
          <p className="text-[10px] text-muted-foreground mt-1">{field.description}</p>
        )}
      </div>
    );
  };

  const renderTab = () => {
    if (tab === "basic") {
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
            />
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
                <label className={FORM_LABEL}>{t("students.form.grNumber")} *</label>
                <Input
                  required
                  className={FORM_INPUT}
                  value={data.grNumber || ""}
                  onChange={(e) => setData((d) => ({ ...d, grNumber: e.target.value }))}
                  placeholder={t("students.form.grNumberPlaceholder")}
                />
                <p className="text-[9px] text-muted-foreground mt-1">{t("students.form.grNumberHint")}</p>
              </div>

              <div>
                <label className={FORM_LABEL}>{t("students.form.status")}</label>
                <FormSelect
                  value={data.status}
                  onChange={(val) =>
                    setData((d) => ({
                      ...d,
                      status: val,
                     }))
                  }
                  options={statuses.map((status) => ({
                    value: status,
                    label: t(`students.form.status.${status}` as AppTranslationKey),
                  }))}
                />
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
    }

    const tabFields = (settingsFields[tab] || []).filter((f: FieldDefinition) => f.enabled);

    return (
      <div className="space-y-4 text-left">
        <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tabFields.map((field: FieldDefinition) => renderFieldByKey(field))}
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
      <FormModal
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={GraduationCap}
        tall
        progress={completeness}
        progressLabel={t("common.formProgress")}
        tabs={formTabs}
        activeTab={tab}
        onTabChange={handlePageChangeTab}
        tabPanelIdPrefix="student-form-tab"
        cancelLabel={t("common.cancel")}
        saveLabel={
          saving
            ? t("students.form.saving")
            : student
              ? t("students.form.saveUpdate")
              : t("students.form.saveRegister")
        }
        onSave={() => void handleSave()}
        saving={saving}
        saveDisabled={!data.contactId}
        error={error || undefined}
        footerStart={footerStart}
      >
        {renderTab()}
      </FormModal>
    </>
  );
}
