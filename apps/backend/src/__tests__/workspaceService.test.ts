import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

const mocks = vi.hoisted(() => ({
  getObject: vi.fn(),
  purgeTenantDataBySubdomain: vi.fn(),
  runInTransaction: vi.fn(),
}));

vi.mock('../db/database.js', () => ({
  getObject: mocks.getObject,
  purgeTenantDataBySubdomain: mocks.purgeTenantDataBySubdomain,
  runInTransaction: mocks.runInTransaction,
}));

vi.mock('../db/dbClient.js', () => ({
  getDb: () => mockDb,
}));

import { deleteWorkspace } from '../services/workspaceService.js';

describe('workspaceService', () => {
  beforeEach(() => {
    mocks.getObject.mockReset().mockResolvedValue(null);
    mocks.purgeTenantDataBySubdomain.mockReset().mockResolvedValue(undefined);
    mocks.runInTransaction.mockReset().mockImplementation(async (cb: () => Promise<unknown>) => cb());
    vi.mocked(mockDb.select).mockClear();
    vi.mocked(mockDb.from).mockClear();
    vi.mocked(mockDb.where).mockClear();
    vi.mocked(mockDb.delete).mockClear();
  });

  it('purges all tenant data before removing a platform workspace registry entry', async () => {
    const mockWs = {
      id: 'ws-demo',
      subdomain: 'demo',
      madrasaName: 'Demo Madrasa',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      enabled: true,
    };
    
    vi.mocked(mockDb.where).mockResolvedValue([mockWs] as any);

    const removed = await deleteWorkspace(' Demo ');

    expect(removed).toMatchObject({ subdomain: 'demo' });
    expect(mocks.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.purgeTenantDataBySubdomain).toHaveBeenCalledWith('demo');
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
