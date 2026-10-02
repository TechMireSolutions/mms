import {
  DEFAULT_FACULTY_USER_ROLE,
  resolveFacultyStatus,
  type FacultyMember,
  todayISO,
} from "@mms/shared";
import { createModuleFormDraft } from "@/lib/forms/createModuleFormDraft";

export interface FacultyFormControllerOptions {
  faculty?: FacultyMember;
  onClose: () => void;
  onSave: (faculty: FacultyMember) => void | Promise<void>;
}
export type UseFacultyFormControllerOptions = FacultyFormControllerOptions;

/** Hydrated / archive chrome — not edited on the faculty form. */
const FACULTY_FORM_VOLATILE_KEYS = [
  "id",
  "name",
  "phone",
  "email",
  "gender",
  "avatar",
  "contact",
  "subordinates",
  "subordinateCount",
  "reportingFacultyName",
  "deletedAt",
  "deletedBy",
  "deletionReason",
  "restoredAt",
  "restoredBy",
  "deletedWithCascade",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
];

const { getInitialDraft, draftSnapshot } = createModuleFormDraft<FacultyMember>({
  volatileKeys: FACULTY_FORM_VOLATILE_KEYS,
  getDefaults: (faculty, defaultSpecialization) => ({
    contactId: faculty?.contactId ?? "",
    employeeId: faculty?.employeeId ?? "",
    specialization: faculty?.specialization ?? (defaultSpecialization as string),
    designation: faculty?.designation ?? "",
    designationId: faculty?.designationId ?? "",
    designationStartsOn: faculty?.designationStartsOn ?? todayISO(),
    designationEndsOn: faculty?.designationEndsOn ?? null,
    designationAssignableRoles: faculty?.designationAssignableRoles ?? [],
    department: faculty?.department ?? "",
    reportingFacultyId: faculty?.reportingFacultyId ?? null,
    hierarchyRank: faculty?.hierarchyRank ?? 4,
    status: resolveFacultyStatus(faculty?.status),
    joinDate: faculty?.joinDate ?? todayISO(),
    qualification: faculty?.qualification ?? "",
    notes: faculty?.notes ?? "",
    userId: faculty?.userId ?? null,
  }),
});

export interface GetInitialFacultyDraftOptions {
  faculty?: FacultyMember;
  defaultSpecialization: string;
}

/** Draft for FormModal — form-owned fields; strip hydrated chrome. */
export function getInitialFacultyDraft(
  facultyOrOptions?: FacultyMember | GetInitialFacultyDraftOptions,
  defaultSpecializationOrUndefined?: string,
): Partial<FacultyMember> {
  const isOptions =
    facultyOrOptions &&
    typeof facultyOrOptions === "object" &&
    "defaultSpecialization" in facultyOrOptions;
  const faculty = isOptions
    ? (facultyOrOptions as GetInitialFacultyDraftOptions).faculty
    : (facultyOrOptions as FacultyMember | undefined);
  const defaultSpecialization = isOptions
    ? (facultyOrOptions as GetInitialFacultyDraftOptions).defaultSpecialization
    : (defaultSpecializationOrUndefined ?? "");

  return getInitialDraft(faculty, defaultSpecialization);
}

export function facultyDraftSnapshot(draft: Partial<FacultyMember>): string {
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

export const DEFAULT_USER_ACCOUNT_DRAFT = {
  enabled: false,
  role: DEFAULT_FACULTY_USER_ROLE,
  setupMethod: "password" as const,
  password: "",
  forceReset: true,
};

export function filterSupervisorCandidates(
  allFaculty: import("@mms/shared").Faculty[],
  currentId: string | null,
  currentRank: number,
): import("@mms/shared").Faculty[] {
  return allFaculty.filter((f) => {
    if (currentId && String(f.id) === currentId) return false;
    const rank = typeof f.hierarchyRank === "number" ? f.hierarchyRank : 4;
    return rank < currentRank;
  });
}

