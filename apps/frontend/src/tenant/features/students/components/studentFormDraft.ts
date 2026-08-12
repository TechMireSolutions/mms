import {
  type Student,
  type FieldDefinition,
  type TabConfig,
  todayISO,
  applyStudentScalarCustomFieldDefaults,
  applyStudentDfsCustomFieldDefaults,
} from "@mms/shared";

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

interface GetInitialStudentDraftOptions {
  student?: Partial<Student> | null;
  fields?: Record<string, FieldDefinition[]>;
  dfsTabs?: TabConfig[];
}

/** Draft for FormModal — form-owned fields + Setup custom values; strip hydrated/obsolete chrome. */
export function getInitialStudentDraft(
  studentOrOptions?: Partial<Student> | null | GetInitialStudentDraftOptions,
): Partial<Student> {
  const options: GetInitialStudentDraftOptions =
    studentOrOptions && typeof studentOrOptions === "object" && ("fields" in studentOrOptions || "dfsTabs" in studentOrOptions)
      ? (studentOrOptions as GetInitialStudentDraftOptions)
      : { student: studentOrOptions as Partial<Student> | null | undefined };

  const { student, fields, dfsTabs } = options;

  let draft: Partial<Student> = {
    contactId: student?.contactId ?? "",
    status: student?.status ?? "active",
    grNumber: student?.grNumber ?? "",
    registeredDate: student?.registeredDate ?? todayISO(),
    notes: student?.notes ?? "",
  };

  if (student) {
    for (const [key, value] of Object.entries(student)) {
      if (STUDENT_FORM_VOLATILE_KEYS.has(key)) continue;
      if (key in draft) continue;
      (draft as Record<string, unknown>)[key] = value;
    }
  }

  if (fields) {
    draft = applyStudentScalarCustomFieldDefaults(draft, fields);
  }
  if (dfsTabs) {
    draft = applyStudentDfsCustomFieldDefaults(draft, dfsTabs);
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

