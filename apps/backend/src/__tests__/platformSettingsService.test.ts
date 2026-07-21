import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/dbClient.js', () => {
  const mockRows: Record<string, unknown>[] = [];
  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mockRows,
        }),
      }),
    }),
    insert: () => ({
      values: (val: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => [val],
        }),
        onConflictDoUpdate: async () => [val],
      }),
    }),
  };
  return {
    getDb: () => mockDb,
  };
});

describe('platformSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns platform settings and updates cache on update', async () => {
    const { getPlatformSettings, updatePlatformSettings } = await import(
      '../services/platform/platformSettingsService.js'
    );

    const initial = getPlatformSettings();
    expect(initial.id).toBe('global');

    const updated = await updatePlatformSettings({
      certbotEmail: 'admin@example.com',
      syncTlsOnCreate: true,
      tlsExtraSans: '*.example.com',
    });

    expect(updated.certbotEmail).toBe('admin@example.com');
    expect(updated.syncTlsOnCreate).toBe(true);
    expect(updated.tlsExtraSans).toBe('*.example.com');

    const cached = getPlatformSettings();
    expect(cached.certbotEmail).toBe('admin@example.com');
  });
});
