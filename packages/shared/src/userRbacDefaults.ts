import type { AppTranslationKey } from './appTranslations.js';
import type {
  ActivityAction,
  PermissionMap,
  UserBadgeVariant,
  UserStatus,
  WorkspaceRole,
} from './userEntityTypes.js';
import { PERMISSION_ACTIONS } from './userEntityTypes.js';
import { RBAC_MODULE_REGISTRY } from './userRbacModuleRegistry.js';

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
