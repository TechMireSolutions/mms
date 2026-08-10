import { resolveTeacherStatus, type Teacher, todayISO } from "@mms/shared";
import { createModuleFormDraft } from "@/lib/forms/createModuleFormDraft";

/** Hydrated / archive chrome — not edited on the Teachers form. */
const TEACHER_FORM_VOLATILE_KEYS = [
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
];

const { getInitialDraft, draftSnapshot } = createModuleFormDraft<Teacher>({
  volatileKeys: TEACHER_FORM_VOLATILE_KEYS,
  getDefaults: (teacher, defaultSpecialization) => ({
    contactId: teacher?.contactId ?? "",
    employeeId: teacher?.employeeId ?? "",
    specialization: teacher?.specialization ?? (defaultSpecialization as string),
    status: resolveTeacherStatus(teacher?.status),
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
  }),
});

/** Draft for FormModal — form-owned fields + Setup custom values; strip hydrated chrome. */
export function getInitialTeacherDraft(
  teacher: Teacher | undefined,
  defaultSpecialization: string,
): Partial<Teacher> {
  return getInitialDraft(teacher, defaultSpecialization);
}

export function teacherDraftSnapshot(draft: Partial<Teacher>): string {
  return draftSnapshot(draft);
}
