import type { AppTranslationKey } from './appTranslations.js';
import { SYSTEM_MODULES_BY_ID, normalizeEnabledModules } from './settingsTypes.js';

/** Workspace account status (UI + local store; backend enforcement is future work). */
export type UserStatus = 'active' | 'inactive' | 'suspended';

export const USER_STATUS_VALUES = ['active', 'inactive', 'suspended'] as const satisfies readonly UserStatus[];

/** CRUD actions granted per module in the roles matrix. */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export const PERMISSION_ACTIONS: readonly PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
] as const;

/** Map of module id → permitted actions. */
export type PermissionMap = Record<string, PermissionAction[]>;

export type UserBadgeVariant = 'primary' | 'muted' | 'warning' | 'destructive' | 'success';

/** RBAC module row in the permissions grid. */
export interface RbacModuleDef {
  id: string;
  labelKey: AppTranslationKey;
}

/** System or custom role definition. */
export interface WorkspaceRole {
  id: string;
  labelKey: AppTranslationKey;
  descriptionKey: AppTranslationKey;
  /** Overrides `labelKey` for user-created roles. */
  customLabel?: string;
  /** Overrides `descriptionKey` for user-created roles. */
  customDescription?: string;
  isSystem: boolean;
  badgeVariant: UserBadgeVariant;
  permissions: PermissionMap;
}

/** Local workspace user record (display layer; auth JWT uses singular `role`). */
export interface WorkspaceUser {
  id: string;
  contactId?: string | number;
  name: string;
  email: string;
  /** Auth sign-in identifier when user has credentials — may differ from contact email. */
  loginEmail?: string;
  phone: string;
  role: string;
  status: UserStatus;
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdDate: string;
  failedLoginAttempts: number;
  activeSessions: number;
  avatarInitials: string;
}

export type SystemUser = WorkspaceUser;

export const DEFAULT_WORKSPACE_USERS: WorkspaceUser[] = [];
export const DEFAULT_USER_ACTIVITY_LOGS: ActivityLog[] = [];

/** Types of actions recorded in the activity log. */
export type ActivityAction =
  | 'login'
  | 'login_failed'
  | 'create'
  | 'update'
  | 'delete'
  | 'role_change';

export const ACTIVITY_ACTION_VALUES: readonly ActivityAction[] = [
  'login',
  'login_failed',
  'create',
  'update',
  'delete',
  'role_change',
] as const;

/** A single activity log entry. */
export interface ActivityLog {
  id: string;
  userId: string;
  /** Hydrated from `users` on read; not persisted. */
  userName?: string;
  action: ActivityAction;
  module: string;
  detail: string;
  ts: string;
  ip: string;
}

export const RBAC_MODULE_REGISTRY: readonly RbacModuleDef[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard' },
  { id: 'students', labelKey: 'nav.students' },
  { id: 'teachers', labelKey: 'nav.teachers' },
  { id: 'enrollments', labelKey: 'nav.enrollments' },
  { id: 'sessions', labelKey: 'nav.sessions' },
  { id: 'attendance', labelKey: 'nav.attendance' },
  { id: 'finance', labelKey: 'nav.finance' },
  { id: 'hasanat', labelKey: 'nav.hasanatCards' },
  { id: 'examinations', labelKey: 'nav.examinations' },
  { id: 'questionBank', labelKey: 'nav.questionBank' },
  { id: 'users', labelKey: 'nav.users' },
  { id: 'settings', labelKey: 'nav.settings' },
] as const;

/**
 * Maps RBAC matrix row ids to `global_settings.enabledModules` keys where they differ.
 * (e.g. RBAC `enrollments` ↔ system module `enrollment`.)
 */
export const RBAC_SYSTEM_MODULE_ID: Record<string, string> = {
  enrollments: 'enrollment',
  examinations: 'examination',
};

/**
 * Resolves the system-modules settings key for an RBAC permission row.
 */
export function rbacModuleSystemId(rbacModuleId: string): string {
  return RBAC_SYSTEM_MODULE_ID[rbacModuleId] ?? rbacModuleId;
}

/**
 * Whether an RBAC module row should appear in the permissions matrix
 * (respects Settings → System Modules toggles).
 */
export function isRbacModuleEnabled(
  rbacModuleId: string,
  enabledModules?: Record<string, boolean> | null,
): boolean {
  if (rbacModuleId === 'settings') return true;
  const normalized = normalizeEnabledModules(enabledModules);
  const systemId = rbacModuleSystemId(rbacModuleId);
  if (!SYSTEM_MODULES_BY_ID[systemId]) return true;
  return normalized[systemId] !== false;
}

/**
 * RBAC registry rows visible for the current workspace module toggles.
 */
export function filterRbacModulesForSettings(
  enabledModules?: Record<string, boolean> | null,
): RbacModuleDef[] {
  return RBAC_MODULE_REGISTRY.filter((m) => isRbacModuleEnabled(m.id, enabledModules));
}

/** Standalone RBAC row in the permissions matrix nav layout. */
export interface RbacPermissionNavModule {
  type: 'module';
  rbacId: string;
}

/** Grouped RBAC rows — mirrors sidebar Academics section. */
export interface RbacPermissionNavGroup {
  type: 'group';
  labelKey: AppTranslationKey;
  rbacIds: readonly string[];
}

export type RbacPermissionNavEntry = RbacPermissionNavModule | RbacPermissionNavGroup;

/**
 * Permissions matrix section order — aligned with `NAV_ITEMS` / `SYSTEM_MODULE_NAV`
 * (standalone items + Academics group; RBAC ids where they differ from `moduleId`).
 */
export const RBAC_PERMISSION_NAV: readonly RbacPermissionNavEntry[] = [
  { type: 'module', rbacId: 'dashboard' },
  {
    type: 'group',
    labelKey: 'nav.academics',
    rbacIds: ['students', 'teachers', 'sessions', 'attendance', 'enrollments', 'hasanat', 'examinations', 'questionBank'],
  },
  { type: 'module', rbacId: 'finance' },
  { type: 'module', rbacId: 'users' },
  { type: 'module', rbacId: 'settings' },
] as const;

/** One render section in the permissions matrix (optional group heading + module rows). */
export interface RbacPermissionMatrixGroup {
  labelKey?: AppTranslationKey;
  modules: RbacModuleDef[];
}

/**
 * Orders visible RBAC modules into sidebar-aligned groups for the permissions matrix.
 */
export function groupRbacModulesForPermissionsNav(
  visibleModules: readonly RbacModuleDef[],
): RbacPermissionMatrixGroup[] {
  const byId = new Map(visibleModules.map((m) => [m.id, m]));
  const placed = new Set<string>();
  const groups: RbacPermissionMatrixGroup[] = [];

  const pushStandalone = (rbacId: string): void => {
    const mod = byId.get(rbacId);
    if (!mod || placed.has(rbacId)) return;
    placed.add(rbacId);
    groups.push({ modules: [mod] });
  };

  for (const entry of RBAC_PERMISSION_NAV) {
    if (entry.type === 'module') {
      pushStandalone(entry.rbacId);
      continue;
    }
    const mods: RbacModuleDef[] = [];
    for (const id of entry.rbacIds) {
      const mod = byId.get(id);
      if (mod && !placed.has(id)) {
        mods.push(mod);
        placed.add(id);
      }
    }
    if (mods.length > 0) {
      groups.push({ labelKey: entry.labelKey, modules: mods });
    }
  }

  for (const mod of visibleModules) {
    if (!placed.has(mod.id)) {
      groups.push({ modules: [mod] });
    }
  }

  return groups;
}

function allPerms(moduleIds: string[]): PermissionMap {
  const p: PermissionMap = {};
  for (const m of moduleIds) {
    p[m] = [...PERMISSION_ACTIONS];
  }
  return p;
}

const ALL_MODULE_IDS = RBAC_MODULE_REGISTRY.map((m) => m.id);

/** Default system roles shipped with the workspace. */
export const DEFAULT_WORKSPACE_ROLES: readonly WorkspaceRole[] = [
  {
    id: 'admin',
    labelKey: 'users.role.admin',
    descriptionKey: 'users.role.adminDesc',
    isSystem: true,
    badgeVariant: 'destructive',
    permissions: allPerms(ALL_MODULE_IDS),
  },
  {
    id: 'teacher',
    labelKey: 'users.role.teacher',
    descriptionKey: 'users.role.teacherDesc',
    isSystem: true,
    badgeVariant: 'primary',
    permissions: {
      dashboard: ['read'],
      students: ['read'],
      enrollments: ['read'],
      sessions: ['read'],
      attendance: ['create', 'read', 'update'],
      examinations: ['create', 'read', 'update'],
      questionBank: ['create', 'read', 'update'],
      hasanat: ['read'],
    },
  },
  {
    id: 'assistant_teacher',
    labelKey: 'users.role.assistantTeacher',
    descriptionKey: 'users.role.assistantTeacherDesc',
    isSystem: true,
    badgeVariant: 'primary',
    permissions: {
      dashboard: ['read'],
      students: ['read'],
      sessions: ['read'],
      attendance: ['create', 'read'],
      hasanat: ['read'],
    },
  },
  {
    id: 'accountant',
    labelKey: 'users.role.accountant',
    descriptionKey: 'users.role.accountantDesc',
    isSystem: true,
    badgeVariant: 'warning',
    permissions: {
      dashboard: ['read'],
      finance: ['create', 'read', 'update'],
      students: ['read'],
      enrollments: ['read'],
    },
  },
] as const;

export const USER_STATUS_REGISTRY: readonly {
  id: UserStatus;
  labelKey: AppTranslationKey;
  badgeVariant: UserBadgeVariant;
}[] = [
  { id: 'active', labelKey: 'users.status.active', badgeVariant: 'success' },
  { id: 'inactive', labelKey: 'users.status.inactive', badgeVariant: 'muted' },
  { id: 'suspended', labelKey: 'users.status.suspended', badgeVariant: 'destructive' },
] as const;

export const ACTIVITY_ACTION_REGISTRY: readonly {
  id: ActivityAction;
  labelKey: AppTranslationKey;
  badgeVariant: UserBadgeVariant;
}[] = [
  { id: 'login', labelKey: 'users.action.login', badgeVariant: 'success' },
  { id: 'login_failed', labelKey: 'users.action.loginFailed', badgeVariant: 'destructive' },
  { id: 'create', labelKey: 'users.action.create', badgeVariant: 'primary' },
  { id: 'update', labelKey: 'users.action.update', badgeVariant: 'warning' },
  { id: 'delete', labelKey: 'users.action.delete', badgeVariant: 'destructive' },
  { id: 'role_change', labelKey: 'users.action.roleChange', badgeVariant: 'primary' },
] as const;

/** @deprecated Use `DEFAULT_WORKSPACE_ROLES`. */
export const DEFAULT_ROLES = DEFAULT_WORKSPACE_ROLES;

/** @deprecated Use `RBAC_MODULE_REGISTRY`. */
export const MODULES = RBAC_MODULE_REGISTRY;

/** @deprecated Use `PERMISSION_ACTIONS`. */
export const ACTIONS = PERMISSION_ACTIONS;

/** @deprecated Use `USER_STATUS_VALUES`. */
export const STATUS_OPTIONS = USER_STATUS_VALUES;

/** @deprecated Use `ACTIVITY_ACTION_VALUES`. */
export const ACTION_TYPES = ACTIVITY_ACTION_VALUES;

/** @deprecated Use `DEFAULT_WORKSPACE_USERS`. */
export const SAMPLE_USERS = DEFAULT_WORKSPACE_USERS;

/** @deprecated Use `DEFAULT_USER_ACTIVITY_LOGS`. */
export const SAMPLE_ACTIVITY_LOGS = DEFAULT_USER_ACTIVITY_LOGS;

/**
 * Normalizes stored/API user payloads to the workspace UI model (singular `role`).
 */
export function normalizeWorkspaceUser(
  raw: Partial<WorkspaceUser> & { roles?: string[]; role?: string; createdAt?: string },
): WorkspaceUser {
  const role =
    typeof raw.role === 'string' && raw.role.trim()
      ? raw.role.trim()
      : Array.isArray(raw.roles) && raw.roles[0]
        ? raw.roles[0]
        : 'teacher';

  const name = raw.name ?? raw.email ?? 'User';
  const initials =
    raw.avatarInitials ??
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const created = raw.createdDate ?? raw.createdAt ?? '';

  return {
    id: raw.id ?? '',
    contactId: raw.contactId,
    name,
    email: raw.email ?? '',
    loginEmail: typeof raw.loginEmail === 'string' ? raw.loginEmail : undefined,
    phone: raw.phone ?? '',
    role,
    status: raw.status ?? 'active',
    twoFactorEnabled: raw.twoFactorEnabled ?? false,
    lastLogin: raw.lastLogin ?? '',
    createdDate: created.includes('T') ? created.split('T')[0] : created,
    failedLoginAttempts: raw.failedLoginAttempts ?? 0,
    activeSessions: raw.activeSessions ?? 0,
    avatarInitials: initials,
  };
}

/** @deprecated Use `normalizeWorkspaceUser`. */
export const normalizeSystemUser = normalizeWorkspaceUser;

/** Clones default system roles for editable local state. */
export function cloneDefaultWorkspaceRoles(): WorkspaceRole[] {
  return DEFAULT_WORKSPACE_ROLES.map((r) => ({
    ...r,
    permissions: structuredClone(r.permissions),
  }));
}

export function resolveWorkspaceRole(
  roleId: string,
  roles: readonly WorkspaceRole[],
): WorkspaceRole | undefined {
  return roles.find((r) => r.id === roleId);
}

export function findWorkspaceRole(roleId: string): WorkspaceRole | undefined {
  return resolveWorkspaceRole(roleId, DEFAULT_WORKSPACE_ROLES);
}

/** Resolved display label for a workspace role (custom or translated). */
export function workspaceRoleLabel(
  role: WorkspaceRole,
  t: (key: AppTranslationKey) => string,
): string {
  return role.customLabel?.trim() || t(role.labelKey);
}

/** Resolved description for a workspace role (custom or translated). */
export function workspaceRoleDescription(
  role: WorkspaceRole,
  t: (key: AppTranslationKey) => string,
): string {
  return role.customDescription?.trim() || t(role.descriptionKey);
}

export function rbacModuleLabel(
  moduleId: string,
  t: (key: AppTranslationKey) => string,
): string {
  const mod = RBAC_MODULE_REGISTRY.find((m) => m.id === moduleId);
  return mod ? t(mod.labelKey) : moduleId;
}

export function userStatusMeta(status: UserStatus): (typeof USER_STATUS_REGISTRY)[number] | undefined {
  return USER_STATUS_REGISTRY.find((s) => s.id === status);
}

export function activityActionMeta(action: ActivityAction): (typeof ACTIVITY_ACTION_REGISTRY)[number] | undefined {
  return ACTIVITY_ACTION_REGISTRY.find((a) => a.id === action);
}
