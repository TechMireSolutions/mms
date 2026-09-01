import { describe, expect, it } from 'vitest';
import {
  activityActionMeta,
  cloneDefaultWorkspaceRoles,
  computeUserInitials,
  findWorkspaceRole,
  normalizeWorkspaceUser,
  rbacModuleLabel,
  resolveRoleDisplayName,
  resolveWorkspaceRole,
  userStatusMeta,
  workspaceRoleDescription,
  workspaceRoleLabel,
} from './userRoleUtils.js';
import { DEFAULT_WORKSPACE_ROLES } from './userRbacDefaults.js';

describe('userRoleUtils', () => {
  describe('computeUserInitials', () => {
    it('computes 2-letter initials for multi-word names', () => {
      expect(computeUserInitials('John Doe')).toBe('JD');
      expect(computeUserInitials('Syed Ali Naqvi')).toBe('SN');
      expect(computeUserInitials('Admin')).toBe('AD');
    });

    it('handles blank/null names with fallback', () => {
      expect(computeUserInitials('')).toBe('U');
      expect(computeUserInitials(null)).toBe('U');
      expect(computeUserInitials(undefined, 'X')).toBe('X');
    });
  });

  describe('normalizeWorkspaceUser', () => {
    it('handles empty/null payload safely', () => {
      const user = normalizeWorkspaceUser(null);
      expect(user.id).toBe('');
      expect(user.name).toBe('User');
      expect(user.role).toBe('teacher');
      expect(user.status).toBe('active');
    });

    it('falls back to loginEmail when email is missing', () => {
      const user = normalizeWorkspaceUser({
        loginEmail: 'admin@madrasa.org',
      });
      expect(user.email).toBe('admin@madrasa.org');
      expect(user.name).toBe('admin@madrasa.org');
    });

    it('formats createdDate removing time portion if present', () => {
      const user = normalizeWorkspaceUser({
        createdDate: '2026-05-12T14:30:00Z',
      });
      expect(user.createdDate).toBe('2026-05-12');
    });
  });

  describe('role resolution & labels', () => {
    const mockTranslate = (k: string) => `translated:${k}`;

    it('findWorkspaceRole retrieves system role in O(1)', () => {
      const admin = findWorkspaceRole('admin');
      expect(admin).toBeDefined();
      expect(admin?.id).toBe('admin');
      expect(findWorkspaceRole('nonexistent')).toBeUndefined();
    });

    it('resolveWorkspaceRole searches custom role list', () => {
      const customRole = {
        id: 'moderator',
        labelKey: 'users.role.teacher' as const,
        descriptionKey: 'users.role.teacherDesc' as const,
        isSystem: false,
        badgeVariant: 'primary' as const,
        permissions: {},
      };
      expect(resolveWorkspaceRole('moderator', [customRole])).toEqual(customRole);
    });

    it('resolveRoleDisplayName resolves custom then system role then fallback', () => {
      const customRole = {
        id: 'mentor',
        customLabel: 'Madrasa Mentor',
        labelKey: 'users.role.teacher' as const,
        descriptionKey: 'users.role.teacherDesc' as const,
        isSystem: false,
        badgeVariant: 'primary' as const,
        permissions: {},
      };
      expect(resolveRoleDisplayName('mentor', [customRole], mockTranslate)).toBe('Madrasa Mentor');
      expect(resolveRoleDisplayName('admin', [], mockTranslate)).toBe('translated:users.role.admin');
      expect(resolveRoleDisplayName('unknown_custom', [], mockTranslate)).toBe('unknown_custom');
    });

    it('workspaceRoleLabel respects customLabel override', () => {
      const role = {
        ...DEFAULT_WORKSPACE_ROLES[0]!,
        customLabel: 'Super Admin Override',
      };
      expect(workspaceRoleLabel(role, mockTranslate)).toBe('Super Admin Override');
    });

    it('workspaceRoleDescription respects customDescription override', () => {
      const role = {
        ...DEFAULT_WORKSPACE_ROLES[0]!,
        customDescription: 'Custom description text',
      };
      expect(workspaceRoleDescription(role, mockTranslate)).toBe('Custom description text');
    });

    it('cloneDefaultWorkspaceRoles deeply clones permissions', () => {
      const cloned = cloneDefaultWorkspaceRoles();
      expect(cloned.length).toBe(DEFAULT_WORKSPACE_ROLES.length);
      cloned[0]!.permissions['students'] = [];
      expect(DEFAULT_WORKSPACE_ROLES[0]!.permissions['students']?.length).toBeGreaterThan(0);
    });
  });

  describe('lookups metadata', () => {
    const mockTranslate = (k: string) => `translated:${k}`;

    it('rbacModuleLabel translates known module or returns id', () => {
      expect(rbacModuleLabel('students', mockTranslate)).toBe('translated:nav.students');
      expect(rbacModuleLabel('nonexistent', mockTranslate)).toBe('nonexistent');
    });

    it('userStatusMeta and activityActionMeta return correct records', () => {
      expect(userStatusMeta('active')?.id).toBe('active');
      expect(activityActionMeta('login')?.id).toBe('login');
    });
  });
});
