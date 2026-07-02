import React, { useMemo, useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
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

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});
    setManualError("");

    const newErrors: Record<string, string> = {};
    if (!studentDraft.contactId) {
      newErrors.contactId = t("students.form.contactRequired") || "Contact is required";
    }
    if (!studentDraft.grNumber?.trim()) {
      newErrors.grNumber = t("students.form.grNumber") || "GR Number is required";
    }
    if (!studentDraft.status) {
      newErrors.status = "Status is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{linkedContact.name}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>GR: {studentDraft.grNumber}</span>
        <span className="border-s border-border ps-2 capitalize">
          Status: {studentDraft.status}
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
        lang={language}
        cancelLabel={t("common.cancel") || "Cancel"}
        saveLabel={saving ? (t("students.form.saving") || "Saving...") : (student ? (t("students.form.saveUpdate") || "Update") : (t("students.form.saveRegister") || "Register"))}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!studentDraft.contactId}
        error={errorSummary || undefined}
        footerStart={footerStart}
      >
        <div className="space-y-6 text-left pb-4">
          {/* Section 1: Contact Link */}
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.contactLabel") || "Linked Contact"}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("students.form.contactHint")}</p>
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
              error={!!errors.contactId}
            />
            {errors.contactId && (
              <p className="text-[10px] text-destructive mt-1 font-medium">{errors.contactId}</p>
            )}

            {studentDraft.contactId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/40">
                <Field label="Gender (contact)" hint="From contact profile">
                  <Input disabled value={linkedGender || "—"} className={FORM_INPUT} />
                </Field>
                <Field label="Date of Birth (contact)" hint="From contact profile">
                  <Input disabled value={linkedDob || "—"} className={FORM_INPUT} />
                </Field>
              </div>
            )}
          </section>

          {/* Section 2: Registration details */}
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("students.form.registrationSection") || "Registration"}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("students.form.grNumber")} required error={errors.grNumber}>
                <Input
                  required
                  value={studentDraft.grNumber || ""}
                  onChange={(e) => updateDraft({ grNumber: e.target.value })}
                  placeholder={t("students.form.grNumberPlaceholder") || "Enter GR Number"}
                  className={FORM_INPUT}
                />
              </Field>

              <Field label={t("students.form.status")}>
                <FormSelect
                  value={studentDraft.status || "active"}
                  onChange={(val) => updateDraft({ status: val as StudentStatus })}
                  options={STUDENT_STATUS_VALUES.map((s) => ({
                    value: s,
                    label: t(`students.form.status.${s}` as AppTranslationKey) || s,
                  }))}
                />
              </Field>

              <Field label={t("students.form.registeredDate") || "Registration Date"}>
                <DatePicker
                  value={studentDraft.registeredDate || undefined}
                  onChange={(dateStr) => updateDraft({ registeredDate: dateStr })}
                />
              </Field>
            </div>
          </section>

          {/* Section 3: Family & Guardians */}
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Family & Guardians</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Link parent/guardian contacts</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContactPicker
                label={t("students.form.fatherLink") || "Father"}
                value={studentDraft.fatherContactId ? String(studentDraft.fatherContactId) : null}
                onChange={handleFatherSelect}
                filterGender="Male"
                excludeIds={[studentDraft.contactId, studentDraft.motherContactId, studentDraft.guardianContactId].filter(Boolean).map(String)}
                searchPlaceholder={t("teachers.form.searchContact")}
                emptyTitle={t("teachers.form.noContacts")}
              />

              <ContactPicker
                label={t("students.form.motherLink") || "Mother"}
                value={studentDraft.motherContactId ? String(studentDraft.motherContactId) : null}
                onChange={handleMotherSelect}
                filterGender="Female"
                excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.guardianContactId].filter(Boolean).map(String)}
                searchPlaceholder={t("teachers.form.searchContact")}
                emptyTitle={t("teachers.form.noContacts")}
              />

              <div className="sm:col-span-2">
                <ContactPicker
                  label={t("students.form.guardianLink") || "Guardian (Other)"}
                  value={studentDraft.guardianContactId ? String(studentDraft.guardianContactId) : null}
                  onChange={handleGuardianSelect}
                  excludeIds={[studentDraft.contactId, studentDraft.fatherContactId, studentDraft.motherContactId].filter(Boolean).map(String)}
                  searchPlaceholder={t("teachers.form.searchContact")}
                  emptyTitle={t("teachers.form.noContacts")}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Finance details */}
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Finance & Discount</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Discount Type">
                <Input
                  value={studentDraft.discountType || ""}
                  onChange={(e) => updateDraft({ discountType: e.target.value })}
                  placeholder="e.g. Sibling, Need-based"
                  className={FORM_INPUT}
                />
              </Field>

              <Field label="Discount %">
                <Input
                  type="number"
                  value={studentDraft.discountPct ?? 0}
                  onChange={(e) => updateDraft({ discountPct: Number(e.target.value) })}
                  className={FORM_INPUT}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Registration Type">
                  <Input
                    value={studentDraft.registrationType || ""}
                    onChange={(e) => updateDraft({ registrationType: e.target.value })}
                    placeholder="e.g. Regular, Online"
                    className={FORM_INPUT}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Section 5: Notes */}
          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
            <Field label={t("teachers.field.notes") || "Notes"}>
              <textarea
                value={studentDraft.notes || ""}
                onChange={(e) => updateDraft({ notes: e.target.value })}
                placeholder="Additional notes..."
                className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
              />
            </Field>
          </section>
        </div>
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
