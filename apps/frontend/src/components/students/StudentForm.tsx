import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  DEFAULT_STUDENTS_SETTINGS,
  getStudentRegistrationFields,
  normalizeStoredStudent,
  type StudentFieldDef,
  type StudentsSettings,
} from "@mms/shared";
import type { Student } from "@/lib/data/studentsData";
import type { Contact } from "@/lib/contactFields";
import { toTitleCase } from "@/lib/utils";
import { getObject, saveCollection } from "@/lib/db";
import { useContactsCollection } from "@/hooks/useContacts";
import useTranslation from "@/hooks/useTranslation";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import ContactPicker from "../ui/ContactPicker";
import { calculateKeyedUnitsCompleteness } from "@/lib/formCompleteness";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT, FORM_TEXTAREA } from "../ui/formStyles";

function generateGrNumber(studentsList: Student[], regDate: string): string {
  const settings = getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS);
  const template = settings.grNumberTemplate || "{seq}-{year}";
  const digits = settings.grNumberDigits || 4;
  const restartAnnually = settings.grNumberRestartAnnually !== false;
  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();

  let nextSeq = 1;
  if (restartAnnually) {
    const yearlyStudents = studentsList.filter((s) => {
      const sDate = s.registeredDate || "";
      if (sDate.startsWith(String(year))) return true;
      if (s.grNumber && s.grNumber.includes(String(year))) return true;
      return false;
    });
    nextSeq = yearlyStudents.length + 1;
  } else {
    nextSeq = studentsList.length + 1;
  }

  const seqStr = String(nextSeq).padStart(digits, "0");
  return template.replace("{seq}", seqStr).replace("{year}", String(year));
}

interface StudentFormData {
  contactId: string | number | null;
  fatherContactId: string | number | null;
  motherContactId: string | number | null;
  guardianContactId: string | number | null;
  fatherName: string;
  motherName: string;
  guardianName: string;
  status: "active" | "inactive" | "suspended";
  grNumber: string;
  registeredDate: string;
  [key: string]: unknown;
}

function buildInitialData(student?: Partial<Student> | null): StudentFormData {
  const base: StudentFormData = {
    contactId: student?.contactId ?? null,
    fatherContactId: student?.fatherContactId ?? null,
    motherContactId: student?.motherContactId ?? null,
    guardianContactId: student?.guardianContactId ?? null,
    fatherName: student?.fatherName ?? "",
    motherName: student?.motherName ?? "",
    guardianName: student?.guardianName ?? "",
    status: student?.status ?? "active",
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
  field: StudentFieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}): React.JSX.Element {
  if (field.type === "textarea") {
    return (
      <textarea
        className={FORM_TEXTAREA}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select
        className={FORM_SELECT}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">—</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
        />
        <span className="text-xs font-medium text-foreground">{field.label}</span>
      </label>
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        className={FORM_INPUT}
        value={(value as number) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
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
    <input
      type="text"
      className={FORM_INPUT}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
    />
  );
}

export interface StudentFormProps {
  student?: Partial<Student> | null;
  students: Student[];
  onClose: () => void;
  onSave: (data: Student) => void;
}

export default function StudentForm({
  student,
  students,
  onClose,
  onSave,
}: StudentFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const contacts = useContactsCollection();

  const settings = useMemo(
    () => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS),
    [],
  );
  const fields = settings.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_STUDENTS_SETTINGS.fieldOrder || [];

  const registrationFields = useMemo(
    () => getStudentRegistrationFields(fieldOrder, fields, customFields),
    [fieldOrder, fields, customFields],
  );

  const guardianFields = useMemo(
    () =>
      registrationFields.filter(
        (f) => f.id === "fatherLink" || f.id === "motherLink" || f.id === "guardianLink",
      ),
    [registrationFields],
  );
  const customFormFields = useMemo(
    () => registrationFields.filter((f) => f.isCustom),
    [registrationFields],
  );
  const showRegisteredDate = fields.registeredDate?.enabled !== false;

  const [data, setData] = useState<StudentFormData>(() => {
    const base = buildInitialData(student);
    if (!student?.id && !base.grNumber) {
      base.grNumber = generateGrNumber(students, base.registeredDate);
    }
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const completeness = useMemo(() => {
    const units: { key: string; enabled?: boolean }[] = [{ key: "contactId" }];
    for (const field of registrationFields) {
      const enabled = field.isCustom ? true : fields[field.id]?.enabled !== false;
      if (!enabled) continue;
      if (field.id === "fatherLink") units.push({ key: "fatherContactId" });
      else if (field.id === "motherLink") units.push({ key: "motherContactId" });
      else if (field.id === "guardianLink") units.push({ key: "guardianContactId" });
      else if (field.id !== "gender" && field.id !== "dob") units.push({ key: field.id });
    }
    return calculateKeyedUnitsCompleteness(data, units);
  }, [data, registrationFields, fields]);

  const linkedContact = useMemo(
    () => contacts.find((c) => data.contactId != null && String(c.id) === String(data.contactId)),
    [contacts, data.contactId],
  );

  const linkedGender = linkedContact?.gender?.trim() || "";
  const linkedDob = linkedContact?.dob?.trim() || "";

  const fatherContacts = useMemo(
    () => contacts.filter((c) => c.gender?.toLowerCase() === "male"),
    [contacts],
  );
  const motherContacts = useMemo(
    () => contacts.filter((c) => c.gender?.toLowerCase() === "female"),
    [contacts],
  );

  const alreadyRegisteredContactIds = useMemo(
    () =>
      students
        .filter((s) => !student || s.id !== student.id)
        .map((s) => s.contactId)
        .filter(Boolean),
    [students, student],
  );

  const studentExcludeIds = useMemo(() => {
    const linkedIds = [data.fatherContactId, data.motherContactId, data.guardianContactId].filter(Boolean);
    return [...linkedIds, ...alreadyRegisteredContactIds];
  }, [data.fatherContactId, data.motherContactId, data.guardianContactId, alreadyRegisteredContactIds]);

  const handleContactSelect = (id: string | number | null): void => {
    setData((d) => {
      if (!id) {
        return { ...d, contactId: null, grNumber: "" };
      }
      const autoGr =
        !student && !d.grNumber
          ? generateGrNumber(students, d.registeredDate || new Date().toISOString().split("T")[0])
          : d.grNumber;
      return { ...d, contactId: id, grNumber: autoGr };
    });
  };

  const handleStudentAvatarChange = (avatarUrl: string): void => {
    if (!data.contactId) return;
    const updatedContacts = contacts.map((c) =>
      String(c.id) === String(data.contactId) ? { ...c, avatar: avatarUrl } : c,
    );
    saveCollection("contacts", updatedContacts);
  };

  const handleRegisteredDateChange = (newDate: string): void => {
    setData((d) => ({
      ...d,
      registeredDate: newDate,
      grNumber: !student ? generateGrNumber(students, newDate) : d.grNumber,
    }));
  };

  const handleFatherSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    setData((d) => ({ ...d, fatherContactId: id, fatherName: c ? c.name : "" }));
  };

  const handleMotherSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    setData((d) => ({ ...d, motherContactId: id, motherName: c ? c.name : "" }));
  };

  const handleGuardianSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    setData((d) => ({ ...d, guardianContactId: id, guardianName: c ? c.name : "" }));
  };

  const handleSave = async (): Promise<void> => {
    setError("");

    if (!data.contactId) {
      setError(t("students.form.contactRequired"));
      return;
    }

    if (fields.gender?.required && !linkedGender) {
      setError(t("students.form.genderRequiredOnContact"));
      return;
    }
    if (fields.dob?.required && !linkedDob) {
      setError(t("students.form.dobRequiredOnContact"));
      return;
    }
    if (fields.fatherLink?.required && !data.fatherContactId) {
      setError(t("students.form.fatherRequired"));
      return;
    }
    if (fields.motherLink?.required && !data.motherContactId) {
      setError(t("students.form.motherRequired"));
      return;
    }
    if (fields.guardianLink?.required && !data.guardianContactId) {
      setError(t("students.form.guardianLinkRequired"));
      return;
    }
    if (fields.registeredDate?.required && !data.registeredDate) {
      setError(t("students.form.registeredDateRequired"));
      return;
    }
    if (
      settings.requireGuardian &&
      !data.fatherContactId &&
      !data.motherContactId &&
      !data.guardianContactId
    ) {
      setError(t("students.form.guardianRequired"));
      return;
    }

    for (const field of customFields) {
      if (!field.required) continue;
      const val = data[field.id];
      if (val === undefined || val === null || val === "" || val === false) {
        setError(t("students.form.customFieldRequired", { label: field.label }));
        return;
      }
    }

    setSaving(true);

    for (const s of students) {
      if (student && s.id === student.id) continue;

      if (data.contactId && s.contactId && String(data.contactId) === String(s.contactId)) {
        setError(t("students.form.contactAlreadyStudent"));
        setSaving(false);
        return;
      }

      const email = contactEmail(linkedContact);
      if (email && s.email && email === s.email.trim().toLowerCase()) {
        setError(t("students.form.duplicateEmail"));
        setSaving(false);
        return;
      }

      if (linkedContact?.name && linkedDob && s.name && s.dob) {
        if (
          linkedContact.name.trim().toLowerCase() === s.name.trim().toLowerCase() &&
          linkedDob === s.dob
        ) {
          setError(t("students.form.duplicateNameDob"));
          setSaving(false);
          return;
        }
      }
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

  const renderRegistrationField = (field: StudentFieldDef): React.ReactNode => {
    const isEnabled = field.isCustom ? true : fields[field.id]?.enabled !== false;
    if (!isEnabled) return null;

    if (field.id === "fatherLink") {
      return (
        <div key="fatherLink" className="sm:col-span-2">
          <ContactPicker
            label={`${t("students.form.fatherLink")}${field.required ? " *" : ""}`}
            value={data.fatherContactId}
            onChange={handleFatherSelect}
            contacts={fatherContacts}
            excludeIds={[data.contactId, data.motherContactId, data.guardianContactId].filter(Boolean)}
            createDefaults={{ gender: "male", lockGender: true }}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
          />
        </div>
      );
    }

    if (field.id === "motherLink") {
      return (
        <div key="motherLink" className="sm:col-span-2">
          <ContactPicker
            label={`${t("students.form.motherLink")}${field.required ? " *" : ""}`}
            value={data.motherContactId}
            onChange={handleMotherSelect}
            contacts={motherContacts}
            excludeIds={[data.contactId, data.fatherContactId, data.guardianContactId].filter(Boolean)}
            createDefaults={{ gender: "female", lockGender: true }}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
          />
        </div>
      );
    }

    if (field.id === "guardianLink") {
      return (
        <div key="guardianLink" className="sm:col-span-2">
          <ContactPicker
            label={`${t("students.form.guardianLink")}${field.required ? " *" : ""}`}
            value={data.guardianContactId}
            onChange={handleGuardianSelect}
            contacts={contacts}
            excludeIds={[data.contactId, data.fatherContactId, data.motherContactId].filter(Boolean)}
            searchPlaceholder={t("teachers.form.searchContact")}
            emptyTitle={t("teachers.form.noContacts")}
            emptyHint={t("teachers.form.noContactsHint")}
          />
        </div>
      );
    }

    if (field.id === "registeredDate") {
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

    if (field.isCustom) {
      const value = data[field.id] ?? "";
      return (
        <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          {field.type !== "boolean" ? (
            <label className={FORM_LABEL}>
              {field.label}
              {field.required ? " *" : ""}
            </label>
          ) : null}
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setData((d) => ({ ...d, [field.id]: next }))}
          />
        </div>
      );
    }

    return null;
  };

  const showGuardians = guardianFields.some((f) => fields[f.id]?.enabled !== false);
  const showCustomFields = customFormFields.length > 0;

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? t("students.form.editTitle") : t("students.form.addTitle")}
        subtitle={t("students.form.subtitle")}
        icon={Sparkles}
        tall
        progress={completeness}
        progressLabel={t("common.formProgress")}
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
      >
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-foreground">{t("students.form.contactLabel")}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("students.form.contactHint")}</p>
            </div>
            <ContactPicker
              label={t("students.form.contactLabel")}
              value={data.contactId}
              onChange={handleContactSelect}
              contacts={contacts}
              excludeIds={studentExcludeIds}
              onAvatarChange={handleStudentAvatarChange}
              searchPlaceholder={t("teachers.form.searchContact")}
              emptyTitle={t("teachers.form.noContacts")}
              emptyHint={t("teachers.form.noContactsHint")}
            />
          </section>

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
                <input
                  required
                  className={FORM_INPUT}
                  value={data.grNumber}
                  onChange={(e) => setData((d) => ({ ...d, grNumber: e.target.value }))}
                  placeholder={t("students.form.grNumberPlaceholder")}
                />
                <p className="text-[9px] text-muted-foreground mt-1">{t("students.form.grNumberHint")}</p>
              </div>

              <div>
                <label className={FORM_LABEL}>{t("students.form.status")}</label>
                <select
                  className={FORM_SELECT}
                  value={data.status}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      status: e.target.value as StudentFormData["status"],
                    }))
                  }
                >
                  <option value="active">{t("students.form.status.active")}</option>
                  <option value="inactive">{t("students.form.status.inactive")}</option>
                  <option value="suspended">{t("students.form.status.suspended")}</option>
                </select>
              </div>

              {showRegisteredDate
                ? renderRegistrationField(
                    registrationFields.find((f) => f.id === "registeredDate") ?? {
                      id: "registeredDate",
                      label: t("students.form.registeredDate"),
                    },
                  )
                : null}
            </div>
          </section>

          {showGuardians ? (
            <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-foreground">{t("students.form.guardiansSection")}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t("students.form.guardiansSectionDesc")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guardianFields.map((field) => renderRegistrationField(field))}
              </div>
            </section>
          ) : null}

          {showCustomFields ? (
            <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customFormFields.map((field) => renderRegistrationField(field))}
              </div>
            </section>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
