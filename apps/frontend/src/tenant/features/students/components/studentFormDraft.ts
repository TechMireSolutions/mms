import { type Student, todayISO } from "@mms/shared";

const STUDENT_FORM_VOLATILE_KEYS = new Set([
  "id",
  "name",
  "gender",
  "dob",
  "phone",
  "email",
  "city",
  "cnic",
  "avatar",
  "enrolledSessions",
  "enrollmentDate",
  "deletedAt",
  "deletedBy",
  "deletionReason",
  "_blueprintId",
  "createdAt",
  "updatedAt",
  // Obsolete triad / unused prefs — not edited on the form.
  "fatherContactId",
  "motherContactId",
  "guardianContactId",
  "fatherName",
  "motherName",
  "guardianName",
  "discountType",
  "discountPct",
  "registrationType",
  "studentId",
]);

/** Draft for FormModal — form-owned fields + Setup custom values; strip hydrated/obsolete chrome. */
export function getInitialStudentDraft(student?: Partial<Student> | null): Partial<Student> {
  const draft: Partial<Student> = {
    contactId: student?.contactId ?? "",
    status: student?.status ?? "active",
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? todayISO(),
    notes: student?.notes ?? "",
  };

  if (!student) return draft;

  for (const [key, value] of Object.entries(student)) {
    if (STUDENT_FORM_VOLATILE_KEYS.has(key)) continue;
    if (key in draft) continue;
    (draft as Record<string, unknown>)[key] = value;
  }
  return draft;
}

export function studentDraftSnapshot(draft: Partial<Student>): string {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (STUDENT_FORM_VOLATILE_KEYS.has(key)) continue;
    payload[key] = value ?? "";
  }
  return JSON.stringify(payload);
}
