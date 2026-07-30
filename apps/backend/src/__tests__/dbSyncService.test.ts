import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbSaveCollection = vi.fn();
const dbSaveObject = vi.fn();
const dbGetAllData = vi.fn();
const runInTransaction = vi.fn(async (fn: () => Promise<void>) => fn());
const loadRelationalSnapshotCollections = vi.fn();
const getRequestTenant = vi.fn();

vi.mock('../db/database.js', () => ({
  getCollection: vi.fn(),
  saveCollection: (name: string, data: unknown[], options?: unknown) =>
    dbSaveCollection(name, data, options),
  getObject: vi.fn(),
  saveObject: (key: string, data: unknown) => dbSaveObject(key, data),
  getAllData: () => dbGetAllData(),
  resetTenantData: vi.fn(),
  runInTransaction: (fn: () => Promise<void>) => runInTransaction(fn),
  deleteObject: vi.fn(),
}));

vi.mock('../db/relationalSnapshot.js', () => ({
  loadRelationalSnapshotCollections: (subdomain: string) =>
    loadRelationalSnapshotCollections(subdomain),
}));

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => getRequestTenant(),
}));

describe('dbSyncService collection persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persistCollection writes JSON only without relational replace', async () => {
    const { persistCollection } = await import('../services/dbSyncService.js');
    await persistCollection('students', [{ id: 's-1' }]);
    expect(dbSaveCollection).toHaveBeenCalledWith('students', [{ id: 's-1' }], undefined);
    const options = dbSaveCollection.mock.calls[0]?.[2] as { mirrorRelationalReplace?: boolean } | undefined;
    expect(options?.mirrorRelationalReplace).toBeFalsy();
  });

  it('synchronizeData mirrors relational replace for admin restore', async () => {
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { users: [{ id: 'u-1' }], contacts: [{ id: 'c-1' }], students: [{ id: 's-1' }] },
      objects: {},
    });
    const savedNames = dbSaveCollection.mock.calls.map((call) => call[0] as string);
    expect(savedNames[0]).toBe('contacts');
    expect(savedNames.at(-1)).toBe('users');
    expect(savedNames).toContain('students');
    expect(savedNames).toContain('message_logs');
    expect(dbSaveCollection).toHaveBeenCalledWith('students', [{ id: 's-1' }], {
      mirrorRelationalReplace: true,
    });
    expect(dbSaveCollection).toHaveBeenCalledWith('message_logs', [], {
      mirrorRelationalReplace: true,
    });
  });

  it('synchronizeData does not expand partial payloads without users', async () => {
    const { synchronizeData } = await import('../services/dbSyncService.js');
    await synchronizeData({
      collections: { students: [{ id: 's-1' }] },
      objects: {},
    });
    expect(dbSaveCollection.mock.calls.map((call) => call[0])).toEqual(['students']);
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
    loadRelationalSnapshotCollections.mockResolvedValue({
      students: [{ id: 's-1' }, { id: 's-2' }],
      contacts: [{ id: 'c-1' }],
    });
  });

  it('overrides the stale document store with authoritative relational rows', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(loadRelationalSnapshotCollections).toHaveBeenCalledWith('dar-ul-quran');
    expect(snapshot.collections?.students).toEqual([{ id: 's-1' }, { id: 's-2' }]);
    expect(snapshot.collections?.contacts).toEqual([{ id: 'c-1' }]);
  });

  it('keeps document-store-only collections and objects', async () => {
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(snapshot.collections?.genders).toEqual([{ id: 'g-1' }]);
    expect(snapshot.objects).toEqual({ branding: { madrasaName: 'Dar ul Quran' } });
  });

  it('falls back to the document store when no tenant is in scope', async () => {
    getRequestTenant.mockReturnValue(undefined);
    const { fetchBackupSnapshot } = await import('../services/dbSyncService.js');
    const snapshot = await fetchBackupSnapshot();

    expect(loadRelationalSnapshotCollections).not.toHaveBeenCalled();
    expect(snapshot.collections?.students).toEqual([{ id: 'stale-doc-store' }]);
  });
});
