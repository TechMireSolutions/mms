import { describe, expect, it } from 'vitest';
import { roleHasPermission } from '@mms/shared';

describe('usePermissions matrix', () => {
  it('admin can write students', () => {
    expect(roleHasPermission('admin', 'students.write')).toBe(true);
  });

  it('assistant_teacher cannot write users', () => {
    expect(roleHasPermission('assistant_teacher', 'users.manage')).toBe(false);
  });
});
