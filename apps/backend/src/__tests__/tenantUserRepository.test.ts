import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
};

vi.mock('../db/dbClient.js', () => ({
  getDb: () => mockDb,
}));

import { upsertTenantUserRow } from '../db/repositories/tenantUserRepository.js';

const existingDbRow = {
  id: 'u-1',
  workspaceSubdomain: 'dar-ul-quran',
  loginEmail: 'teacher@workspace.local',
  passwordHash: 'salt:existing-hash',
  name: 'Existing Teacher',
  role: 'teacher',
  contactId: 'c-1',
  emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  pendingLoginEmail: null,
  mustChangePassword: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  deletedBy: null,
  profileJson: null,
};

describe('upsertTenantUserRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockSelectWhere.mockResolvedValue([existingDbRow]);
    mockWhere.mockResolvedValue(undefined);
  });

  it('preserves name, loginEmail, and passwordHash when contact-linked payload blanks them', async () => {
    await upsertTenantUserRow({
      id: 'u-1',
      workspaceSubdomain: 'dar-ul-quran',
      contactId: 'c-1',
      role: 'teacher',
      // Stripped contact profile fields + missing auth credentials
      name: '',
      loginEmail: '',
      passwordHash: '',
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockInsertValues).not.toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Existing Teacher',
        loginEmail: 'teacher@workspace.local',
        passwordHash: 'salt:existing-hash',
        workspaceSubdomain: 'dar-ul-quran',
      }),
    );
  });

  it('keeps the existing workspace subdomain (rejects reassignment)', async () => {
    await upsertTenantUserRow({
      id: 'u-1',
      workspaceSubdomain: 'other-tenant',
      loginEmail: 'teacher@workspace.local',
      passwordHash: 'salt:existing-hash',
      name: 'Existing Teacher',
      role: 'teacher',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceSubdomain: 'dar-ul-quran',
      }),
    );
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it('applies non-empty name and loginEmail updates', async () => {
    await upsertTenantUserRow({
      id: 'u-1',
      workspaceSubdomain: 'dar-ul-quran',
      name: 'Updated Name',
      loginEmail: 'new.login@workspace.local',
      passwordHash: 'salt:existing-hash',
      role: 'teacher',
    });

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Name',
        loginEmail: 'new.login@workspace.local',
      }),
    );
  });
});
