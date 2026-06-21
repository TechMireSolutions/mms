import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetchObject = vi.fn();
const mockPersistObject = vi.fn();
const mockLoadContacts = vi.fn();

vi.mock('../services/dbSyncService.js', () => ({
  fetchObject: (...args: unknown[]) => mockFetchObject(...args),
  persistObject: (...args: unknown[]) => mockPersistObject(...args),
}));

vi.mock('../services/contactService.js', () => ({
  loadContacts: (...args: unknown[]) => mockLoadContacts(...args),
}));

import {
  exchangeGoogleContactsOAuthCode,
  GoogleOAuthExchangeError,
  GoogleSyncError,
  runGoogleContactsSync,
  setContactGoogleSyncConfig,
} from '../services/contactGoogleSyncService.js';

describe('contactGoogleSyncService', () => {
  beforeEach(() => {
    mockFetchObject.mockReset().mockResolvedValue({});
    mockPersistObject.mockReset().mockResolvedValue(undefined);
    mockLoadContacts.mockReset().mockResolvedValue([]);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges OAuth code server-side and stores tokens', async () => {
    await setContactGoogleSyncConfig('u1', {
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });

    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ access_token: 'access-1', refresh_token: 'refresh-1' }),
    } as Response);

    const config = await exchangeGoogleContactsOAuthCode(
      'u1',
      'auth-code',
      'https://demo.localhost/contacts',
    );

    expect(config.isConnected).toBe(true);
    expect(config.hasRefreshToken).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid redirect URIs', async () => {
    await expect(
      exchangeGoogleContactsOAuthCode('u1', 'auth-code', 'https://evil.example/oauth'),
    ).rejects.toBeInstanceOf(GoogleOAuthExchangeError);
  });

  it('surfaces Google OAuth errors', async () => {
    await setContactGoogleSyncConfig('u1', {
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });

    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ error: 'invalid_grant', error_description: 'Code expired' }),
    } as Response);

    await expect(
      exchangeGoogleContactsOAuthCode('u1', 'bad-code', 'https://demo.localhost/contacts'),
    ).rejects.toMatchObject({ message: 'Code expired', code: 'invalid_grant' });
  });

  it('syncs Google contacts and skips existing names', async () => {
    await setContactGoogleSyncConfig('u1', {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });

    mockLoadContacts.mockResolvedValue([{ id: '1', name: 'Ali Khan' }]);

    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      json: async () => ({
        connections: [
          {
            names: [{ displayName: 'Ali Khan', givenName: 'Ali', familyName: 'Khan' }],
          },
          {
            names: [{ displayName: 'Sara Ahmed', givenName: 'Sara', familyName: 'Ahmed' }],
            phoneNumbers: [{ value: '+92 300 1112233' }],
          },
        ],
      }),
    } as Response);

    const result = await runGoogleContactsSync('u1');

    expect(result.total).toBe(2);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]?.name).toBe('Sara Ahmed');
  });

  it('refreshes access token after People API 401', async () => {
    await setContactGoogleSyncConfig('u1', {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      accessToken: 'expired-token',
      refreshToken: 'refresh-1',
    });

    mockLoadContacts.mockResolvedValue([]);

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        status: 401,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'fresh-token' }),
      } as Response)
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          connections: [{ names: [{ displayName: 'Fresh Contact' }] }],
        }),
      } as Response);

    const result = await runGoogleContactsSync('u1');

    expect(result.imported).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws session_expired when not connected', async () => {
    await expect(runGoogleContactsSync('u1')).rejects.toBeInstanceOf(GoogleSyncError);
  });
});
