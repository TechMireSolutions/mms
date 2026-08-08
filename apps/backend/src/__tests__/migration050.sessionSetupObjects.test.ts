import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListObjectStorageKeys = vi.fn();
const mockDeleteObjectByStorageKey = vi.fn();
const mockWithTenantTransaction = vi.fn();

vi.mock('../db/database.js', () => ({
  listObjectStorageKeys: (...args: unknown[]) => mockListObjectStorageKeys(...args),
  deleteObjectByStorageKey: (...args: unknown[]) => mockDeleteObjectByStorageKey(...args),
}));

vi.mock('../db/withTenantTransaction.js', () => ({
  withTenantTransaction: (...args: unknown[]) => mockWithTenantTransaction(...args),
}));

function chainSelect(result: unknown[]) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => result,
      }),
    }),
  };
}

function mockTx(selectResults: unknown[][]) {
  let call = 0;
  return {
    select: () => chainSelect(selectResults[call++] ?? []),
  };
}

describe('runMigration050', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteObjectByStorageKey.mockResolvedValue(undefined);
    mockWithTenantTransaction.mockImplementation(
      async (_tenant: unknown, fn: (tx: unknown) => Promise<unknown>) => fn(mockTx([[]])),
    );
  });

  it('deletes sessions_settings when typed Setup exists', async () => {
    mockListObjectStorageKeys.mockResolvedValue(['t:demo:sessions_settings']);
    mockWithTenantTransaction.mockImplementation(
      async (_tenant: unknown, fn: (tx: unknown) => Promise<unknown>) =>
        fn(mockTx([[{ workspaceSubdomain: 'demo' }]])),
    );
    vi.resetModules();
    const { runMigration050 } = await import(
      '../db/migrations/050_clear_legacy_session_setup_objects.js'
    );
    await runMigration050();
    expect(mockWithTenantTransaction).toHaveBeenCalledTimes(1);
    expect(mockWithTenantTransaction).toHaveBeenCalledWith(null, expect.any(Function));
    expect(mockDeleteObjectByStorageKey).toHaveBeenCalledWith('t:demo:sessions_settings');
  });

  it('skips sessions_settings when typed Setup is missing', async () => {
    mockListObjectStorageKeys.mockResolvedValue(['t:demo:sessions_settings']);
    mockWithTenantTransaction.mockImplementation(
      async (_tenant: unknown, fn: (tx: unknown) => Promise<unknown>) => fn(mockTx([[], []])),
    );
    vi.resetModules();
    const { runMigration050 } = await import(
      '../db/migrations/050_clear_legacy_session_setup_objects.js'
    );
    await runMigration050();
    expect(mockWithTenantTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeleteObjectByStorageKey).not.toHaveBeenCalled();
  });

  it('deletes column prefs when typed field-config exists even without column rows', async () => {
    mockListObjectStorageKeys.mockResolvedValue(['t:demo:session_user_column_preferences']);
    mockWithTenantTransaction.mockImplementation(
      async (_tenant: unknown, fn: (tx: unknown) => Promise<unknown>) =>
        fn(mockTx([[], [{ workspaceSubdomain: 'demo' }]])),
    );
    vi.resetModules();
    const { runMigration050 } = await import(
      '../db/migrations/050_clear_legacy_session_setup_objects.js'
    );
    await runMigration050();
    expect(mockWithTenantTransaction).toHaveBeenCalledTimes(1);
    expect(mockDeleteObjectByStorageKey).toHaveBeenCalledWith(
      't:demo:session_user_column_preferences',
    );
  });
});
