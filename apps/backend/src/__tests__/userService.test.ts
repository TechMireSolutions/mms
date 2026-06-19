import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListTenantUsers = vi.fn();
const mockFindTenantUserById = vi.fn();
const mockReplaceTenantUsers = vi.fn();
const mockGetCollection = vi.fn();
const mockSaveCollection = vi.fn();
const mockVerifyPassword = vi.fn();
const mockGetRequestTenant = vi.fn();

vi.mock('../db/repositories/tenantUserRepository.js', () => ({
  listTenantUsersByWorkspace: (...args: unknown[]) => mockListTenantUsers(...args),
  findTenantUserRowById: (...args: unknown[]) => mockFindTenantUserById(...args),
  replaceTenantUsersForWorkspace: (...args: unknown[]) => mockReplaceTenantUsers(...args),
}));

vi.mock('../db/database.js', () => ({
  getCollection: (...args: unknown[]) => mockGetCollection(...args),
  saveCollection: (...args: unknown[]) => mockSaveCollection(...args),
}));

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../services/auth/passwordService.js', () => ({
  hashPassword: vi.fn(),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

vi.mock('../services/contactService.js', () => ({
  loadContacts: vi.fn().mockResolvedValue([]),
  updateContactById: vi.fn(),
}));

vi.mock('../services/globalSettingsService.js', () => ({
  assertPasswordMeetsPolicy: vi.fn().mockResolvedValue(undefined),
}));

import { validateCredentials } from '../services/auth/userService.js';

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyPassword.mockResolvedValue(true);
    mockGetRequestTenant.mockReturnValue('dar-ul-quran');
  });

  it('matches login by loginEmail not contact CRM email', async () => {
    mockListTenantUsers.mockResolvedValue([
      {
        id: 'auth-1',
        role: 'admin',
        contactId: '42',
        loginEmail: 'admin@workspace.local',
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        workspaceSubdomain: 'dar-ul-quran',
        passwordHash: 'salt:hash',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    mockGetCollection.mockImplementation(async (name: string) => {
      if (name === 'contacts') {
        return [
          {
            id: 42,
            name: 'Syed Ahmed Ali Naqvi',
            emails: [{ address: 'different@contact.local' }],
          },
        ];
      }
      return null;
    });

    const result = await validateCredentials(
      'admin@workspace.local',
      'secret',
      'dar-ul-quran',
    );

    expect(mockVerifyPassword).toHaveBeenCalledWith('secret', 'salt:hash');
    expect(result).toMatchObject({
      id: 'auth-1',
      email: 'admin@workspace.local',
      loginEmail: 'admin@workspace.local',
      name: 'Syed Ahmed Ali Naqvi',
    });
  });

  it('does not sign in with contact email when loginEmail differs', async () => {
    mockListTenantUsers.mockResolvedValue([
      {
        id: 'auth-1',
        role: 'admin',
        contactId: '42',
        loginEmail: 'admin@workspace.local',
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        workspaceSubdomain: 'dar-ul-quran',
        passwordHash: 'salt:hash',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    mockFindTenantUserById.mockResolvedValue(null);
    mockGetCollection.mockImplementation(async (name: string) => {
      if (name === 'contacts') {
        return [
          {
            id: 42,
            name: 'Admin',
            emails: [{ address: 'different@contact.local' }],
          },
        ];
      }
      return null;
    });

    const result = await validateCredentials(
      'different@contact.local',
      'secret',
      'dar-ul-quran',
    );

    expect(result).toBeNull();
  });
});
