import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

const mockDb = {
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert,
  delete: mockDelete,
};

vi.mock('../db/dbClient.js', () => ({
  getDb: () => mockDb,
}));

vi.mock('../db/dbConnection.js', () => ({
  activeDb: () => mockDb,
  getRootDb: () => mockDb,
}));

import {
  replaceTenantUsersForWorkspace,
  upsertTenantUserRow,
} from '../db/repositories/tenantUserRepository.js';

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

describe('replaceTenantUsersForWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockInsert.mockReturnValue({ values: mockInsertValues });
    mockDelete.mockReturnValue({ where: mockDeleteWhere });
    mockSelectWhere.mockResolvedValue([existingDbRow]);
  });

  it('carries the stored password hash forward when the backup payload omits it', async () => {
    await replaceTenantUsersForWorkspace('dar-ul-quran', [
      {
        id: 'u-1',
        workspaceSubdomain: 'dar-ul-quran',
        loginEmail: 'teacher@workspace.local',
        name: 'Existing Teacher',
        role: 'teacher',
      },
    ]);

    expect(mockDelete).toHaveBeenCalledTimes(1);
    const inserted = mockInsertValues.mock.calls[0]?.[0] as Array<{ passwordHash: string }>;
    expect(inserted[0].passwordHash).toBe('salt:existing-hash');
  });

  it('matches by login email when the backup carries a different user id', async () => {
    await replaceTenantUsersForWorkspace('dar-ul-quran', [
      {
        id: 'u-restored',
        workspaceSubdomain: 'dar-ul-quran',
        loginEmail: 'Teacher@Workspace.local',
        name: 'Existing Teacher',
        role: 'teacher',
      },
    ]);

    const inserted = mockInsertValues.mock.calls[0]?.[0] as Array<{ passwordHash: string }>;
    expect(inserted[0].passwordHash).toBe('salt:existing-hash');
  });

  it('keeps an explicit password hash from the payload', async () => {
    await replaceTenantUsersForWorkspace('dar-ul-quran', [
      {
        id: 'u-1',
        workspaceSubdomain: 'dar-ul-quran',
        loginEmail: 'teacher@workspace.local',
        passwordHash: 'salt:payload-hash',
        name: 'Existing Teacher',
        role: 'teacher',
      },
    ]);

    const inserted = mockInsertValues.mock.calls[0]?.[0] as Array<{ passwordHash: string }>;
    expect(inserted[0].passwordHash).toBe('salt:payload-hash');
  });

  it('rejects restore when no live admin keeps a usable password hash', async () => {
    mockSelectWhere.mockResolvedValue([]);

    await expect(
      replaceTenantUsersForWorkspace('dar-ul-quran', [
        {
          id: 'u-new',
          workspaceSubdomain: 'dar-ul-quran',
          loginEmail: 'new@workspace.local',
          name: 'New User',
          role: 'teacher',
        },
      ]),
    ).rejects.toMatchObject({
      message: 'backup.missingUserCredentials',
      statusCode: 400,
      type: 'validation_error',
    });

    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it('parks an unusable hash for unknown users while an admin credential survives', async () => {
    mockSelectWhere.mockResolvedValue([
      { ...existingDbRow, id: 'u-admin', loginEmail: 'admin@workspace.local', role: 'admin' },
    ]);

    await replaceTenantUsersForWorkspace('dar-ul-quran', [
      {
        id: 'u-admin',
        workspaceSubdomain: 'dar-ul-quran',
        loginEmail: 'admin@workspace.local',
        name: 'Workspace Admin',
        role: 'admin',
      },
      {
        id: 'u-unknown',
        workspaceSubdomain: 'dar-ul-quran',
        loginEmail: 'unknown@workspace.local',
        name: 'Unknown User',
        role: 'teacher',
      },
    ]);

    const inserted = mockInsertValues.mock.calls[0]?.[0] as Array<{
      id: string;
      passwordHash: string;
      mustChangePassword: boolean;
    }>;
    expect(inserted[0]).toMatchObject({
      id: 'u-admin',
      passwordHash: 'salt:existing-hash',
      mustChangePassword: false,
    });
    expect(inserted[1]?.mustChangePassword).toBe(true);
    expect(inserted[1]?.passwordHash).toMatch(/^!restore-/);
    // No `salt:hash` separator, so `verifyPassword` can never accept a parked hash.
    expect(inserted[1]?.passwordHash).not.toContain(':');
  });
});
