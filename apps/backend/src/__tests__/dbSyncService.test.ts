import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbSaveCollection = vi.fn();
const dbSaveObject = vi.fn();
const runInTransaction = vi.fn(async (fn: () => Promise<void>) => fn());

vi.mock('../db/database.js', () => ({
  getCollection: vi.fn(),
  saveCollection: (name: string, data: unknown[], options?: unknown) =>
    dbSaveCollection(name, data, options),
  getObject: vi.fn(),
  saveObject: (key: string, data: unknown) => dbSaveObject(key, data),
  getAllData: vi.fn(),
  resetTenantData: vi.fn(),
  runInTransaction: (fn: () => Promise<void>) => runInTransaction(fn),
  deleteObject: vi.fn(),
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
      collections: { students: [{ id: 's-1' }] },
      objects: {},
    });
    expect(dbSaveCollection).toHaveBeenCalledWith('students', [{ id: 's-1' }], {
      mirrorRelationalReplace: true,
    });
  });
});
