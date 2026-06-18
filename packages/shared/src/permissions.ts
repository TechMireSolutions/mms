/** Dot-notation permission keys — align with `mms-rbac` registry vocabulary. */
export type Permission =
  | "contacts.read"
  | "contacts.write"
  | "contacts.delete"
  | "students.read"
  | "students.write"
  | "teachers.read"
  | "teachers.write"
  | "users.manage"
  | "settings.global.write"
  | "settings.branding.write"
  | "analytics.view"
  | "configuration.view"
  | "obligations.write"
  | "finance.write"
  | "enrollments.read"
  | "enrollments.write"
  | "attendance.write";

const ADMIN: Permission[] = [
  "contacts.read",
  "contacts.write",
  "contacts.delete",
  "students.read",
  "students.write",
  "teachers.read",
  "teachers.write",
  "users.manage",
  "settings.global.write",
  "settings.branding.write",
  "analytics.view",
  "configuration.view",
  "obligations.write",
  "finance.write",
  "enrollments.read",
  "enrollments.write",
  "attendance.write",
];

const TEACHER: Permission[] = [
  "contacts.read",
  "contacts.write",
  "students.read",
  "students.write",
  "teachers.read",
  "teachers.write",
  "analytics.view",
  "enrollments.read",
  "enrollments.write",
  "attendance.write",
];

const ACCOUNTANT: Permission[] = [
  "contacts.read",
  "students.read",
  "teachers.read",
  "analytics.view",
  "finance.write",
  "obligations.write",
  "enrollments.read",
];

const ASSISTANT_TEACHER: Permission[] = [
  "contacts.read",
  "students.read",
  "teachers.read",
  "analytics.view",
  "enrollments.read",
];

const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  admin: ADMIN,
  teacher: TEACHER,
  accountant: ACCOUNTANT,
  assistant_teacher: ASSISTANT_TEACHER,
  staff: TEACHER,
};

/**
 * Returns whether a workspace role grants a permission.
 */
export function roleHasPermission(role: string | undefined, permission: Permission): boolean {
  const normalized = (role ?? "").toLowerCase();
  const grants = ROLE_PERMISSIONS[normalized] ?? [];
  return grants.includes(permission);
}
