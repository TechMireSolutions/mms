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
    designation: teacher?.designation ?? "",
    department: teacher?.department ?? "",
    status: resolveTeacherStatus(teacher?.status),
    joinDate: teacher?.joinDate ?? todayISO(),
    qualification: teacher?.qualification ?? "",
    notes: teacher?.notes ?? "",
    userId: teacher?.userId ?? null,
  }),
});

interface GetInitialTeacherDraftOptions {
  teacher?: Teacher;
  defaultSpecialization: string;
}

/** Draft for FormModal — form-owned fields; strip hydrated chrome. */
export function getInitialTeacherDraft(
  teacherOrOptions?: Teacher | GetInitialTeacherDraftOptions,
  defaultSpecializationOrUndefined?: string,
): Partial<Teacher> {
  const isOptions = teacherOrOptions && typeof teacherOrOptions === "object" && "defaultSpecialization" in teacherOrOptions;
  const teacher = isOptions ? (teacherOrOptions as GetInitialTeacherDraftOptions).teacher : (teacherOrOptions as Teacher | undefined);
  const defaultSpecialization = isOptions ? (teacherOrOptions as GetInitialTeacherDraftOptions).defaultSpecialization : (defaultSpecializationOrUndefined ?? "");

  return getInitialDraft(teacher, defaultSpecialization);
}

export function teacherDraftSnapshot(draft: Partial<Teacher>): string {
  return draftSnapshot(draft);
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

/** Safely extract a string employee ID from a raw string, response object, or nested wrapper. */
export function extractEmployeeId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (isRecord(value)) {
    if (typeof value.employeeId === "string") {
      return value.employeeId.trim();
    }
    if (isRecord(value.body)) {
      return extractEmployeeId(value.body);
    }
    if (isRecord(value.data)) {
      return extractEmployeeId(value.data);
    }
  }
  return "";
}