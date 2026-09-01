/**
 * @file userRoleUtils.ts
 * @description Pure utility functions for workspace users, roles, statuses, and permissions.
 */

import type { AppTranslationKey } from './appTranslations.js';
import type {
  ActivityAction,
  UserStatus,
  WorkspaceRole,
  WorkspaceUser,
} from './userEntityTypes.js';
import {
  ACTIVITY_ACTION_MAP,
  DEFAULT_WORKSPACE_ROLES,
  DEFAULT_WORKSPACE_ROLES_MAP,
  getRbacModuleDef,
  USER_STATUS_MAP,
} from './userRbacRegistry.js';

/** Computes uppercase 1-2 letter initials from a user's display name or email. */
export function computeUserInitials(name?: string | null, fallback = 'U'): string {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return (parts[0]?.slice(0, 2) || fallback).toUpperCase();
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase() || fallback;
}

/**
 * Normalizes stored/API user payloads to the workspace UI model (singular `role`).
 */
export function normalizeWorkspaceUser(
  raw?: (Partial<WorkspaceUser> & { roles?: string[]; role?: string; createdAt?: string }) | null,
): WorkspaceUser {
  const data = raw || {};
  const role =
    typeof data.role === 'string' && data.role.trim()
      ? data.role.trim()
      : Array.isArray(data.roles) && data.roles[0]
        ? data.roles[0]
        : 'teacher';

  const email =
    (typeof data.email === 'string' && data.email.trim()) ||
    (typeof data.loginEmail === 'string' && data.loginEmail.trim()) ||
    '';
  const name =
    (typeof data.name === 'string' && data.name.trim()) || email || 'User';
  const initials =
    (typeof data.avatarInitials === 'string' && data.avatarInitials.trim()) ||
    computeUserInitials(name);

  const created = data.createdDate ?? data.createdAt ?? '';

  return {
    id: data.id ?? '',
    contactId: data.contactId,
    name,
    email,
    loginEmail: typeof data.loginEmail === 'string' ? data.loginEmail : undefined,
    mustChangePassword: data.mustChangePassword === true,
    phone: data.phone ?? '',
    role,
    status: data.status ?? 'active',
    twoFactorEnabled: data.twoFactorEnabled ?? false,
    lastLogin: data.lastLogin ?? '',
    createdDate: created.includes('T') ? created.split('T')[0] : created,
    failedLoginAttempts: data.failedLoginAttempts ?? 0,
    activeSessions: data.activeSessions ?? 0,
    avatarInitials: initials,
    deletedAt: data.deletedAt ?? null,
    deletedBy: data.deletedBy ?? null,
    emailVerifiedAt:
      typeof data.emailVerifiedAt === 'string'
        ? data.emailVerifiedAt
        : data.emailVerifiedAt
          ? String(data.emailVerifiedAt)
          : null,
  };
}

/** Clones default system roles for editable local state. */
export function cloneDefaultWorkspaceRoles(): WorkspaceRole[] {
  return DEFAULT_WORKSPACE_ROLES.map((workspaceRole) => ({
    ...workspaceRole,
    permissions: structuredClone(workspaceRole.permissions),
  }));
}

/** Resolves a workspace role by ID from a custom list. */
export function resolveWorkspaceRole(
  roleId: string,
  roles: readonly WorkspaceRole[],
): WorkspaceRole | undefined {
  return roles.find((workspaceRole) => workspaceRole.id === roleId);
}

/** Resolves a default system role by ID via fast O(1) lookup. */
export function findWorkspaceRole(roleId: string): WorkspaceRole | undefined {
  return DEFAULT_WORKSPACE_ROLES_MAP[roleId];
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

/** Resolves the display label for any role ID (checking custom roles, then system roles). */
export function resolveRoleDisplayName(
  roleId: string,
  customRoles: readonly WorkspaceRole[] = [],
  t: (key: AppTranslationKey) => string,
): string {
  const custom = customRoles.find((r) => r.id === roleId);
  if (custom) return workspaceRoleLabel(custom, t);
  const system = findWorkspaceRole(roleId);
  if (system) return workspaceRoleLabel(system, t);
  return roleId;
}

/** Resolves translated label for an RBAC module. */
export function rbacModuleLabel(
  moduleId: string,
  t: (key: AppTranslationKey) => string,
): string {
  const mod = getRbacModuleDef(moduleId);
  return mod ? t(mod.labelKey) : moduleId;
}

/** Metadata lookup for user statuses. */
export function userStatusMeta(status: UserStatus): (typeof USER_STATUS_MAP)[UserStatus] | undefined {
  return USER_STATUS_MAP[status];
}

/** Metadata lookup for user activity actions. */
export function activityActionMeta(action: ActivityAction): (typeof ACTIVITY_ACTION_MAP)[ActivityAction] | undefined {
  return ACTIVITY_ACTION_MAP[action];
}
