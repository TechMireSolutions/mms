import { type Teacher, DEFAULT_TEACHER_STATUS, todayISO } from "@mms/shared";

/** Hydrated / archive chrome — not edited on the Teachers form. */
export const TEACHER_FORM_VOLATILE_KEYS = new Set([
  "id",
  "name",
  "phone",
  "email",
  "avatar",
  "deletedAt",
  "deletedBy",
  "deletionReason",
  "createdAt",
  "updatedAt",
]);

/** Draft for FormModal — form-owned fields + Setup custom values; strip hydrated chrome. */
export function getInitialTeacherDraft(
  teacher: Teacher | undefined,
  defaultSpecialization: string,
): Partial<Teacher> {
  const draft: Partial<Teacher> = {
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? defaultSpecialization,
    status: teacher?.status ?? DEFAULT_TEACHER_STATUS,
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
  };

  if (!teacher) return draft;

  for (const [key, value] of Object.entries(teacher)) {
    if (TEACHER_FORM_VOLATILE_KEYS.has(key)) continue;
    if (key in draft) continue;
    (draft as Record<string, unknown>)[key] = value;
  }
  return draft;
}

export function teacherDraftSnapshot(draft: Partial<Teacher>): string {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (TEACHER_FORM_VOLATILE_KEYS.has(key)) continue;
    payload[key] = value ?? "";
  }
  return JSON.stringify(payload);
}
