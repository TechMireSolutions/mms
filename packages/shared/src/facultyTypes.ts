/** Active employment status for a faculty member. */
export const FACULTY_STATUS_VALUES = ['active', 'inactive', 'on_leave'] as const;
export type FacultyStatus = (typeof FACULTY_STATUS_VALUES)[number];

export type FacultyStatusRoles = { active: string; inactive: string; onLeave: string };

/** Named roles for the default faculty status values (SSOT for active/inactive/on-leave). */
export function resolveFacultyStatusRoles(): FacultyStatusRoles {
  const [active, inactive, onLeave] = FACULTY_STATUS_VALUES;
  return { active, inactive, onLeave };
}

/** Default status when unset (first of {@link FACULTY_STATUS_VALUES}). */
export const DEFAULT_FACULTY_STATUS: FacultyStatus = FACULTY_STATUS_VALUES[0];

/** Prefer configured status options; fall back to the shared default list. */
export function resolveFacultyStatuses(statuses?: readonly string[] | null): readonly string[] {
  return statuses && statuses.length > 0 ? statuses : FACULTY_STATUS_VALUES;
}

/** Resolve the effective status for a faculty member, falling back to {@link DEFAULT_FACULTY_STATUS}. */
export function resolveFacultyStatus(status?: string | null): string {
  return status || DEFAULT_FACULTY_STATUS;
}

/** Teaching specialization options for madrasa faculty. */
export const FACULTY_SPECIALIZATION_VALUES = [
  'Hifz',
  'Qaidah',
  'Tajweed',
  'Islamic Studies',
  'Arabic',
  'General',
  'Other',
] as const;
export type FacultySpecialization = (typeof FACULTY_SPECIALIZATION_VALUES)[number];

/** Prefer configured specializations; fall back to the shared default list. */
export function resolveFacultySpecializations(
  specializations?: readonly string[] | null,
): readonly string[] {
  return specializations && specializations.length > 0
    ? specializations
    : FACULTY_SPECIALIZATION_VALUES;
}

/** Academic / institutional designations for faculty members. */
export const FACULTY_DESIGNATION_VALUES = [
  'Teacher',
  'Senior Teacher',
  'Assistant Teacher',
  'Head of Department',
  'Qari',
  'Administrator',
] as const;
export type FacultyDesignation = (typeof FACULTY_DESIGNATION_VALUES)[number];

/** Prefer configured designations; fall back to the shared default list. */
export function resolveFacultyDesignations(
  designations?: readonly string[] | null,
): readonly string[] {
  return designations && designations.length > 0
    ? designations
    : FACULTY_DESIGNATION_VALUES;
}

export const resolveTeacherDesignations = resolveFacultyDesignations;
export const TEACHER_DESIGNATION_VALUES = FACULTY_DESIGNATION_VALUES;

/** Default specialization when unset (must remain in {@link FACULTY_SPECIALIZATION_VALUES}). */
export const DEFAULT_FACULTY_SPECIALIZATION: FacultySpecialization =
  FACULTY_SPECIALIZATION_VALUES.find((value) => value === 'General')
  ?? FACULTY_SPECIALIZATION_VALUES[0];

/** Hierarchy presets for delegation authority (lower number = higher authority). */
export interface FacultyHierarchyPreset {
  rank: number;
  label: string;
}

export const FACULTY_HIERARCHY_RANK_PRESETS: readonly FacultyHierarchyPreset[] = [
  { rank: 1, label: 'Dean / Principal' },
  { rank: 2, label: 'Head of Department (HoD)' },
  { rank: 3, label: 'Senior Faculty / Professor' },
  { rank: 4, label: 'Lecturer / Teacher' },
  { rank: 5, label: 'Assistant / Teaching Support' },
] as const;

export const DEFAULT_FACULTY_HIERARCHY_RANK = 4;

/** Hierarchical tree node for organizational chart and task delegation. */
export interface FacultyHierarchyNode {
  id: string;
  contactId: string | number;
  name: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  /** Server-projected designation effective today. */
  designationId?: string;
  designationStartsOn?: string;
  designationEndsOn?: string | null;
  designationAssignableRoles?: string[];
  hierarchyRank: number;
  status: string;
  avatar?: string | null;
  reportingFacultyId?: string | null;
  subordinates: FacultyHierarchyNode[];
}

/**
 * Faculty profile in the `faculty` collection.
 * Identity fields (`name`, `phone`, `email`, `gender`) live on the linked Contact and are hydrated for display.
 * `status` is a free-form lookup value (defaults from {@link FACULTY_STATUS_VALUES}).
 */
export interface FacultyMember {
  id: string;
  contactId: string | number;
  /** Hydrated from Contact — not persisted when `contactId` is set. */
  name?: string;
  employeeId?: string;
  phone?: string;
  email?: string;
  gender?: 'male' | 'female';
  /** Hydrated from the linked Contact — never persisted when `contactId` is set. */
  avatar?: string | null;
  /** Hydrated from the linked Contact's education or skills — canonical data lives on Contact. */
  specialization?: string;
  department?: string;
  designation?: string;
  /** Server-projected designation effective today; writes select a definition by id. */
  designationId?: string;
  designationStartsOn?: string;
  designationEndsOn?: string | null;
  designationAssignableRoles?: string[];
  customDesignation?: string;
  reportingFacultyId?: string | null;
  /** Numeric hierarchy rank (1 is highest authority, e.g. Dean; higher numbers denote subordinate tiers). */
  hierarchyRank?: number;
  /** Hydrated supervisory metadata */
  reportingFacultyName?: string;
  subordinateCount?: number;
  status: string;
  joinDate?: string;
  /** Hydrated from the linked Contact's education degrees — canonical data lives on Contact. */
  qualification?: string;
  notes?: string;
  userId?: string | null;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  restoredAt?: string;
  restoredBy?: string;
  deletedWithCascade?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  /** Custom Setup fields and other extension keys. */
  [key: string]: unknown;
}

export type Faculty = FacultyMember;

/** Whether a faculty record is soft-deleted. */
export function isFacultyDeleted(facultyMember: { deletedAt?: string | null }): boolean {
  return Boolean(facultyMember.deletedAt);
}

/** Active directory rows — excludes soft-deleted records from Work by default. */
export function filterActiveFaculty<T extends { deletedAt?: string | null }>(facultyList: T[]): T[] {
  return facultyList.filter((facultyMember) => !isFacultyDeleted(facultyMember));
}

/* ========================================================================= */
/*                    BACKWARD COMPATIBILITY ALIASES                        */
/* ========================================================================= */

export type Teacher = FacultyMember;
export type TeacherStatus = FacultyStatus;
export type TeacherStatusRoles = FacultyStatusRoles;
export const TEACHER_STATUS_VALUES = FACULTY_STATUS_VALUES;
export const DEFAULT_TEACHER_STATUS = DEFAULT_FACULTY_STATUS;
export const resolveTeacherStatusRoles = resolveFacultyStatusRoles;
export const resolveTeacherStatuses = resolveFacultyStatuses;
export const resolveTeacherStatus = resolveFacultyStatus;

export type TeacherSpecialization = FacultySpecialization;
export const TEACHER_SPECIALIZATION_VALUES = FACULTY_SPECIALIZATION_VALUES;
export const DEFAULT_TEACHER_SPECIALIZATION = DEFAULT_FACULTY_SPECIALIZATION;
export const resolveTeacherSpecializations = resolveFacultySpecializations;

export const isTeacherDeleted = isFacultyDeleted;
export const filterActiveTeachers = filterActiveFaculty;
