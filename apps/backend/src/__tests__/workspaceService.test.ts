import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKSPACES_COLLECTION } from '@mms/shared';

const mocks = vi.hoisted(() => ({
  getCollection: vi.fn(),
  getCollectionForUpdate: vi.fn(),
  getObject: vi.fn(),
  purgeTenantDataBySubdomain: vi.fn(),
  runInTransaction: vi.fn(),
  saveCollection: vi.fn(),
}));

vi.mock('../db/database.js', () => ({
  getCollection: mocks.getCollection,
  getCollectionForUpdate: mocks.getCollectionForUpdate,
  getObject: mocks.getObject,
  purgeTenantDataBySubdomain: mocks.purgeTenantDataBySubdomain,
  runInTransaction: mocks.runInTransaction,
  saveCollection: mocks.saveCollection,
}));

vi.mock('../db/dbClient.js', () => ({
  getDb: vi.fn(),
}));

import { deleteWorkspace } from '../services/workspaceService.js';

describe('workspaceService', () => {
  beforeEach(() => {
    mocks.getCollection.mockReset();
    mocks.getCollectionForUpdate.mockReset();
    mocks.getObject.mockReset().mockResolvedValue(null);
    mocks.purgeTenantDataBySubdomain.mockReset().mockResolvedValue(undefined);
    mocks.runInTransaction.mockReset().mockImplementation(async (cb: () => Promise<unknown>) => cb());
    mocks.saveCollection.mockReset().mockResolvedValue(undefined);
  });

  it('purges all tenant data before removing a platform workspace registry entry', async () => {
    mocks.getCollectionForUpdate.mockResolvedValue([
      {
        id: 'ws-demo',
        subdomain: 'demo',
        madrasaName: 'Demo Madrasa',
        createdAt: '2026-01-01T00:00:00.000Z',
        enabled: true,
      },
      {
        id: 'ws-other',
        subdomain: 'other',
        madrasaName: 'Other Madrasa',
        createdAt: '2026-01-02T00:00:00.000Z',
        enabled: true,
      },
    ]);

    const removed = await deleteWorkspace(' Demo ');

    expect(removed).toMatchObject({ subdomain: 'demo' });
    expect(mocks.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.purgeTenantDataBySubdomain).toHaveBeenCalledWith('demo');
    expect(mocks.saveCollection).toHaveBeenCalledWith(WORKSPACES_COLLECTION, [
      expect.objectContaining({ subdomain: 'other' }),
    ]);
    expect(mocks.purgeTenantDataBySubdomain.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.saveCollection.mock.invocationCallOrder[0],
    );
  });
});
