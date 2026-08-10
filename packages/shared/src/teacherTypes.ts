/** Active employment status for a teacher profile. */
export const TEACHER_STATUS_VALUES = ['active', 'inactive', 'on_leave'] as const;
export type TeacherStatus = (typeof TEACHER_STATUS_VALUES)[number];

export type TeacherStatusRoles = { active: string; inactive: string; onLeave: string };

/** Named roles for the default teacher status values (SSOT for active/inactive/on-leave). */
export function resolveTeacherStatusRoles(): TeacherStatusRoles {
  const [active, inactive, onLeave] = TEACHER_STATUS_VALUES;
  return { active, inactive, onLeave };
}

/** Default status when unset (first of {@link TEACHER_STATUS_VALUES}). */
export const DEFAULT_TEACHER_STATUS: TeacherStatus = TEACHER_STATUS_VALUES[0];

/** Prefer configured status options; fall back to the shared default list. */
export function resolveTeacherStatuses(statuses?: readonly string[] | null): readonly string[] {
  return statuses && statuses.length > 0 ? statuses : TEACHER_STATUS_VALUES;
}

/** Resolve the effective status for a teacher, falling back to {@link DEFAULT_TEACHER_STATUS}. */
export function resolveTeacherStatus(status?: string | null): string {
  return status || DEFAULT_TEACHER_STATUS;
}

/** Teaching specialization options for madrasa faculty. */
export const TEACHER_SPECIALIZATION_VALUES = [
  'Hifz',
  'Qaidah',
  'Tajweed',
  'Islamic Studies',
  'Arabic',
  'General',
  'Other',
] as const;
export type TeacherSpecialization = (typeof TEACHER_SPECIALIZATION_VALUES)[number];

/** Prefer configured specializations; fall back to the shared default list. */
export function resolveTeacherSpecializations(
  specializations?: readonly string[] | null,
): readonly string[] {
  return specializations && specializations.length > 0
    ? specializations
    : TEACHER_SPECIALIZATION_VALUES;
}

/** Default specialization when unset (must remain in {@link TEACHER_SPECIALIZATION_VALUES}). */
export const DEFAULT_TEACHER_SPECIALIZATION: TeacherSpecialization =
  TEACHER_SPECIALIZATION_VALUES.find((value) => value === 'General')
  ?? TEACHER_SPECIALIZATION_VALUES[0];

/**
 * Faculty profile in the `teachers` collection.
 * Identity fields (`name`, `phone`, `email`, `gender`) live on the linked Contact and are hydrated for display.
 * `status` is a free-form lookup value (defaults from {@link TEACHER_STATUS_VALUES}).
 */
export interface Teacher {
  id: string;
  contactId: string | number;
  /** Hydrated from Contact — not persisted when `contactId` is set. */
  name?: string;
  employeeId?: string;
  phone?: string;
  email?: string;
  gender?: 'male' | 'female';
  specialization?: string;
  status: string;
  joinDate?: string;
  qualification?: string;
  notes?: string;
  userId?: string | null;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
}
