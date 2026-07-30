import type { AppTranslationKey } from './appTranslations.js';
import type {
  ActivityAction,
  UserStatus,
  WorkspaceRole,
  WorkspaceUser,
} from './userEntityTypes.js';
import {
  ACTIVITY_ACTION_REGISTRY,
  DEFAULT_WORKSPACE_ROLES,
  RBAC_MODULE_REGISTRY,
  USER_STATUS_REGISTRY,
} from './userRbacRegistry.js';

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

  const email =
    (typeof raw.email === 'string' && raw.email.trim()) ||
    (typeof raw.loginEmail === 'string' && raw.loginEmail.trim()) ||
    '';
  const name =
    (typeof raw.name === 'string' && raw.name.trim()) || email || 'User';
  const initials =
    (typeof raw.avatarInitials === 'string' && raw.avatarInitials.trim()) ||
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
    email,
    loginEmail: typeof raw.loginEmail === 'string' ? raw.loginEmail : undefined,
    mustChangePassword: raw.mustChangePassword === true,
    phone: raw.phone ?? '',
    role,
    status: raw.status ?? 'active',
    twoFactorEnabled: raw.twoFactorEnabled ?? false,
    lastLogin: raw.lastLogin ?? '',
    createdDate: created.includes('T') ? created.split('T')[0] : created,
    failedLoginAttempts: raw.failedLoginAttempts ?? 0,
    activeSessions: raw.activeSessions ?? 0,
    avatarInitials: initials,
    deletedAt: raw.deletedAt ?? null,
    deletedBy: raw.deletedBy ?? null,
  };
}


/** Clones default system roles for editable local state. */
export function cloneDefaultWorkspaceRoles(): WorkspaceRole[] {
  return DEFAULT_WORKSPACE_ROLES.map((workspaceRole) => ({
    ...workspaceRole,
    permissions: structuredClone(workspaceRole.permissions),
  }));
}

export function resolveWorkspaceRole(
  roleId: string,
  roles: readonly WorkspaceRole[],
): WorkspaceRole | undefined {
  return roles.find((workspaceRole) => workspaceRole.id === roleId);
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
