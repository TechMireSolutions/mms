import { applyTeacherDfsCustomFieldDefaults, resolveTeacherStatus, type Teacher, type TabConfig, todayISO } from "@mms/shared";
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

interface GetInitialTeacherDraftOptions {
  teacher?: Teacher;
  defaultSpecialization: string;
  dfsTabs?: TabConfig[];
}

/** Draft for FormModal — form-owned fields + Setup custom values; strip hydrated chrome. */
export function getInitialTeacherDraft(
  teacherOrOptions?: Teacher | GetInitialTeacherDraftOptions,
  defaultSpecializationOrUndefined?: string,
): Partial<Teacher> {
  const isOptions = teacherOrOptions && typeof teacherOrOptions === "object" && "defaultSpecialization" in teacherOrOptions;
  const teacher = isOptions ? (teacherOrOptions as GetInitialTeacherDraftOptions).teacher : (teacherOrOptions as Teacher | undefined);
  const defaultSpecialization = isOptions ? (teacherOrOptions as GetInitialTeacherDraftOptions).defaultSpecialization : (defaultSpecializationOrUndefined ?? "");
  const dfsTabs = isOptions ? (teacherOrOptions as GetInitialTeacherDraftOptions).dfsTabs : undefined;

  const draft = getInitialDraft(teacher, defaultSpecialization);
  return dfsTabs ? applyTeacherDfsCustomFieldDefaults(draft, dfsTabs) : draft;
}

export function teacherDraftSnapshot(draft: Partial<Teacher>): string {
  return draftSnapshot(draft);
}