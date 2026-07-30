import { describe, expect, it } from 'vitest';
import {
  editWorkspaceUserSchema,
  inviteWorkspaceUserSchema,
} from '../usersModuleManifest.js';

describe('workspace user form schemas', () => {
  it('accepts valid edit and invite values', () => {
    expect(editWorkspaceUserSchema.safeParse({
      contactId: 'contact-1',
      role: 'admin',
      status: 'active',
      twoFactorEnabled: true,
    }).success).toBe(true);

    expect(inviteWorkspaceUserSchema.safeParse({
      contactId: 42,
      role: 'teacher',
      status: 'inactive',
      sendEmail: true,
    }).success).toBe(true);
  });

  it('rejects missing contacts and roles', () => {
    const result = inviteWorkspaceUserSchema.safeParse({
      contactId: '',
      role: '',
      status: 'active',
      sendEmail: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining(['users.addErrorContact', 'users.errorRoleRequired']),
      );
    }
  });
});
