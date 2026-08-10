import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@mms/shared';

const mockRecordAudit = vi.fn();

vi.mock('../services/auditService.js', () => ({
  recordAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

import { createCollectionAuditHelper } from '../lib/createCollectionAuditHelper.js';

const admin: User = {
  id: 'user-1',
  email: 'admin@demo.test',
  name: 'Admin',
  role: 'admin',
  workspaceSubdomain: 'demo',
};

describe('createCollectionAuditHelper', () => {
  beforeEach(() => {
    mockRecordAudit.mockReset();
  });

  it('records a collection audit entry with the provided args', async () => {
    const auditCollection = createCollectionAuditHelper('contacts');
    await auditCollection(admin, 'contacts.delete', 'Deleted 3 contacts');

    expect(mockRecordAudit).toHaveBeenCalledOnce();
    expect(mockRecordAudit).toHaveBeenCalledWith({
      userId: 'user-1',
      userEmail: 'admin@demo.test',
      action: 'contacts.delete',
      entityType: 'collection',
      entityId: 'contacts',
      summary: 'Deleted 3 contacts',
    });
  });

  it('defaults entityId to the factory argument', async () => {
    const auditCollection = createCollectionAuditHelper('teachers');
    await auditCollection(admin, 'teachers.delete', '');

    expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({
      entityType: 'collection',
      entityId: 'teachers',
    });
  });

  it('overrides entityId when a 4th arg is passed', async () => {
    const auditCollection = createCollectionAuditHelper('contacts');
    await auditCollection(admin, 'contacts.delete', '', 'specific-contact');

    expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({ entityId: 'specific-contact' });
  });
});
