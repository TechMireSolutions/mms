import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listBackupSnapshotCollectionKeys } from '../db/relationalReplaceMapping.js';

const dbSaveCollection = vi.fn();
const dbSaveObject = vi.fn();
const dbGetAllData = vi.fn();
const dbDeleteObject = vi.fn();
const dbDeleteCollection = vi.fn();
const dbListTenantObjectLogicalKeys = vi.fn(async () => [] as string[]);
const dbListTenantCollectionLogicalKeys = vi.fn(async () => [] as string[]);
const clearTenantBackgroundJobs = vi.fn(async () => 0);
const runInTransaction = vi.fn(async (fn: () => Promise<void>) => fn());
const runInReadSnapshotTransaction = vi.fn(async (fn: () => Promise<unknown>) => fn());
const loadRelationalSnapshotCollections = vi.fn();
const getRequestTenant = vi.fn();

vi.mock('../db/database.js', () => ({
  getCollection: vi.fn(),
  saveCollection: (name: string, data: unknown[], options?: unknown) =>
    dbSaveCollection(name, data, options),
  deleteCollection: (name: string) => dbDeleteCollection(name),
  getObject: vi.fn(),
  saveObject: (key: string, data: unknown) => dbSaveObject(key, data),
  getAllData: () => dbGetAllData(),
  resetTenantData: vi.fn(),
  runInTransaction: (fn: () => Promise<void>) => runInTransaction(fn),
  runInReadSnapshotTransaction: (fn: () => Promise<unknown>) => runInReadSnapshotTransaction(fn),
  deleteObject: (key: string) => dbDeleteObject(key),
  listTenantObjectLogicalKeys: () => dbListTenantObjectLogicalKeys(),
  listTenantCollectionLogicalKeys: () => dbListTenantCollectionLogicalKeys(),
}));

vi.mock('../db/relationalSnapshot.js', () => ({
  loadRelationalSnapshotCollections: (subdomain: string) =>
    loadRelationalSnapshotCollections(subdomain),
}));

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => getRequestTenant(),
}));

vi.mock('../services/backgroundJobService.js', () => ({
  clearTenantBackgroundJobs: () => clearTenantBackgroundJobs(),
}));

const listAllTenantUsersByWorkspace = vi.fn(async (_subdomain?: string) => [] as unknown[]);
vi.mock('../db/repositories/tenantUserRepository.js', () => ({
  listAllTenantUsersByWorkspace: (subdomain: string) => listAllTenantUsersByWorkspace(subdomain),
}));

const acquireTenantRestoreLock = vi.fn(async () => true);
vi.mock('../lib/restoreLock.js', () => ({
  acquireTenantRestoreLock: () => acquireTenantRestoreLock(),
  RestoreInProgressError: class RestoreInProgressError extends Error {
    readonly statusCode = 409;
    readonly type = 'conflict';
    constructor() {
      super('backup.restoreInProgress');
      this.name = 'RestoreInProgressError';
    }
  },
}));

describe('dbSyncService collection persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbListTenantObjectLogicalKeys.mockResolvedValue([]);
    dbListTenantCollectionLogicalKeys.mockResolvedValue([]);
    clearTenantBackgroundJobs.mockResolvedValue(0);
  });

  it('persistCollection writes JSON only without relational replace', async () => {
    const { persistCollection } = await import('../services/dbSyncService.js');
    await persistCollection('students', [{ id: 's-1' }]);
    expect(dbSaveCollection).toHaveBeenCalledWith('students', [{ id: 's-1' }], undefined);
    const options = dbSaveCollection.mock.calls[0]?.[2] as { mirrorRelationalReplace?: boolean } | undefined;
    expect(options?.mirrorRelationalReplace).toBeUndefined();
  });

  it('synchronizeData mirrors relational replace for admin restore', async () => {
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { users: [{ id: 'u-1' }], contacts: [{ id: 'c-1' }], students: [{ id: 's-1' }] },
      objects: {},
    }, undefined, true);
    const savedNames = dbSaveCollection.mock.calls.map((call) => call[0] as string);
    expect(savedNames[0]).toBe('contacts');
    // Contacts must restore before users (tenant_users.contact_id FK); per-user
    // column-prefs (incl. hasanat user_id → tenant_users.id FK) restore after users.
    expect(savedNames.indexOf('users')).toBeGreaterThan(savedNames.indexOf('contacts'));
    expect(savedNames).toContain('students');
    expect(savedNames).toContain('message_logs');
    expect(dbSaveCollection).toHaveBeenCalledWith('students', [{ id: 's-1' }], {
      mirrorRelationalReplace: true,
    });
    expect(dbSaveCollection).toHaveBeenCalledWith('message_logs', [], {
      mirrorRelationalReplace: true,
    });
    expect(clearTenantBackgroundJobs).toHaveBeenCalledTimes(1);
  });

  it('synchronizeData does not expand partial payloads without users', async () => {
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { students: [{ id: 's-1' }] },
      objects: {},
    });
    expect(dbSaveCollection.mock.calls.map((call) => call[0])).toEqual(['students']);
    expect(clearTenantBackgroundJobs).not.toHaveBeenCalled();
    expect(dbDeleteCollection).not.toHaveBeenCalled();
  });

  it('hydrates typed Students Setup from legacy objects on full restore and skips re-saving them', async () => {
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { users: [{ id: 'u-1' }] },
      objects: {
        branding: { madrasaName: 'Demo' },
        students_settings: {
          fields: {},
          autoGenerateId: true,
          grNumberTemplate: '{seq}-{year}',
          grNumberDigits: 4,
          grNumberRestartAnnually: true,
        },
        student_user_column_preferences: {
          'u-admin': [{ key: 'name', enabled: true, order: 0 }],
        },
      },
    }, undefined, true);

    const fieldCall = dbSaveCollection.mock.calls.find((call) => call[0] === 'student_field_configs');
    const prefsCall = dbSaveCollection.mock.calls.find(
      (call) => call[0] === 'student_module_preferences',
    );
    const columnCall = dbSaveCollection.mock.calls.find(
      (call) => call[0] === 'student_user_column_prefs',
    );
    expect(fieldCall?.[1]).toEqual([expect.objectContaining({ config: expect.any(Object) })]);
    expect(prefsCall?.[1]).toEqual([
      expect.objectContaining({ preferences: expect.objectContaining({ autoGenerateId: true }) }),
    ]);
    expect(columnCall?.[1]).toEqual([
      { userId: 'u-admin', preferences: [{ key: 'name', enabled: true, order: 0 }] },
    ]);

    const savedObjectKeys = dbSaveObject.mock.calls.map((call) => call[0] as string);
    expect(savedObjectKeys).toContain('branding');
    expect(savedObjectKeys).not.toContain('students_settings');
    expect(savedObjectKeys).not.toContain('student_user_column_preferences');
  });

  it('prunes tenant objects the full backup does not carry', async () => {
    dbListTenantObjectLogicalKeys.mockResolvedValue([
      'branding',
      'global_settings',
      'students_settings',
    ]);
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { users: [{ id: 'u-1' }] },
      objects: { branding: { madrasaName: 'Dar ul Quran' } },
    }, undefined, true);

    expect(dbSaveObject).toHaveBeenCalledWith('branding', { madrasaName: 'Dar ul Quran' });
    expect(dbDeleteObject.mock.calls.map((call) => call[0]).sort()).toEqual([
      'contacts_duplicate_scan_cache',
      'global_settings',
      'students_settings',
      'user_export_artifacts',
    ]);
  });

  it('prunes stale document-store collections on full restore', async () => {
    dbListTenantCollectionLogicalKeys.mockResolvedValue([
      'genders',
      'phoneLabels',
      'users',
      'messages_u:peer',
    ]);
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: {
        users: [{ id: 'u-1' }],
        genders: [{ id: 'g-1' }],
        'messages_u:admin': [{ id: 'm-1' }],
      },
      objects: { branding: {} },
    }, undefined, true);

    expect(dbDeleteCollection.mock.calls.map((call) => call[0]).sort()).toEqual([
      'messages_u:peer',
      'phoneLabels',
    ]);
  });

  it('stops writing and rejects when the sync signal aborts mid-restore', async () => {
    const controller = new AbortController();
    dbSaveCollection.mockImplementation(async () => {
      controller.abort();
    });
    const { synchronizeData } = await import('../services/dbSyncService.js');

    await expect(
      synchronizeData(
        {
          collections: { users: [{ id: 'u-1' }], contacts: [{ id: 'c-1' }], students: [{ id: 's-1' }] },
          objects: { branding: {} },
        },
        controller.signal,
        true,
      ),
    ).rejects.toThrow('backup.syncTimeout');

    // The throw propagates out of runInTransaction so the restore rolls back.
    expect(dbSaveCollection).toHaveBeenCalledTimes(1);
    expect(dbSaveObject).not.toHaveBeenCalled();
    expect(dbDeleteCollection).not.toHaveBeenCalled();
    dbSaveCollection.mockReset();
  });

  it('never prunes objects for a partial sync without users', async () => {
    dbListTenantObjectLogicalKeys.mockResolvedValue(['branding', 'global_settings']);
    dbListTenantCollectionLogicalKeys.mockResolvedValue(['genders']);
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { students: [{ id: 's-1' }] },
      objects: { branding: { madrasaName: 'Dar ul Quran' } },
    });

    expect(dbDeleteObject).not.toHaveBeenCalled();
    expect(dbDeleteCollection).not.toHaveBeenCalled();
  });

  it('rejects a concurrent restore that cannot acquire the tenant lock before writing', async () => {
    getRequestTenant.mockReturnValue('demo');
    acquireTenantRestoreLock.mockResolvedValue(false);
    const { synchronizeData } = await import('../services/dbSyncService.js');

    await expect(
      synchronizeData(
        {
          collections: { users: [{ id: 'u-1', role: 'admin' }], contacts: [{ id: 'c-1' }] },
          objects: { branding: {} },
        },
        undefined,
        true,
      ),
    ).rejects.toThrow('backup.restoreInProgress');

    expect(acquireTenantRestoreLock).toHaveBeenCalledTimes(1);
    // The lock check runs before any write, so nothing is persisted.
    expect(dbSaveCollection).not.toHaveBeenCalled();
    expect(dbSaveObject).not.toHaveBeenCalled();
    expect(dbDeleteCollection).not.toHaveBeenCalled();
    getRequestTenant.mockReset();
    acquireTenantRestoreLock.mockResolvedValue(true);
  });

  it('rolls back a full restore that would leave only a soft-deleted admin', async () => {
    getRequestTenant.mockReturnValue('demo');
    dbSaveCollection.mockResolvedValue(undefined);
    dbSaveObject.mockResolvedValue(undefined);
    dbDeleteObject.mockResolvedValue(undefined);
    dbListTenantCollectionLogicalKeys.mockResolvedValue([]);
    dbListTenantObjectLogicalKeys.mockResolvedValue([]);
    // Post-restore state: the only admin is soft-deleted, so the workspace would lock out.
    listAllTenantUsersByWorkspace.mockResolvedValue([
      { id: 'u-1', role: 'admin', deletedAt: '2026-06-20T00:00:00Z' },
    ]);

    const { synchronizeData } = await import('../services/dbSyncService.js');
    await expect(
      synchronizeData(
        {
          collections: { users: [{ id: 'u-1', role: 'admin' }] },
          objects: {},
        },
        undefined,
        true,
      ),
    ).rejects.toThrow('backup.missingAdminUser');

    expect(listAllTenantUsersByWorkspace).toHaveBeenCalledWith('demo');
    getRequestTenant.mockReset();
    listAllTenantUsersByWorkspace.mockReset();
    listAllTenantUsersByWorkspace.mockResolvedValue([]);
  });
});

describe('fetchBackupSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRequestTenant.mockReturnValue('dar-ul-quran');
    dbGetAllData.mockResolvedValue({
      collections: { students: [{ id: 'stale-doc-store' }], genders: [{ id: 'g-1' }] },
      objects: { branding: { madrasaName: 'Dar ul Quran' } },
    });
    loadRelationalSnapshotCollections.mockImplementation(async () => {
      const collections: Record<string, unknown[]> = {};
      for (const key of listBackupSnapshotCollectionKeys()) {
        collections[key] = key === 'students' ? [{ id: 's-1' }, { id: 's-2' }] : key === 'contacts' ? [{ id: 'c-1' }] : [];
      }
      return collections;
    });
  });

  it('reads document store and relational tables in one snapshot transaction', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    await fetchBackupSnapshot();

    expect(runInReadSnapshotTransaction).toHaveBeenCalledTimes(1);
  });

  it('overrides the stale document store with authoritative relational rows', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(loadRelationalSnapshotCollections).toHaveBeenCalledWith('dar-ul-quran');
    expect(snapshot.collections?.students).toEqual([{ id: 's-1' }, { id: 's-2' }]);
    expect(snapshot.collections?.contacts).toEqual([{ id: 'c-1' }]);
  });

  it('includes every mapped business collection in the tenant backup', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();
    const keys = listBackupSnapshotCollectionKeys();

    expect(keys.length).toBeGreaterThan(20);
    for (const key of keys) {
      expect(Array.isArray(snapshot.collections?.[key])).toBe(true);
    }
    expect(snapshot.collections?.genders).toEqual([{ id: 'g-1' }]);
    expect(snapshot.objects).toEqual(expect.objectContaining({ branding: { madrasaName: 'Dar ul Quran' } }));
  });

  it('keeps document-store-only collections and objects', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(snapshot.collections?.genders).toEqual([{ id: 'g-1' }]);
    expect(snapshot.objects).toEqual(expect.objectContaining({ branding: { madrasaName: 'Dar ul Quran' } }));
  });

  it('falls back to the document store when no tenant is in scope', async () => {
    getRequestTenant.mockReturnValue(undefined);
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(loadRelationalSnapshotCollections).not.toHaveBeenCalled();
    expect(snapshot.collections?.students).toEqual([{ id: 'stale-doc-store' }]);
  });
});
