import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue({}),
  end: vi.fn().mockResolvedValue(undefined),
};

vi.mock('pg', () => ({
  default: {
    Client: vi.fn(function Client() {
      return mockClient;
    }),
  },
}));

vi.mock('../db/database.js', () => ({
  closeDatabase: vi.fn().mockResolvedValue(undefined),
  initializeDatabaseConnection: vi.fn(),
  initDb: vi.fn().mockResolvedValue(undefined),
  resetDbInitStateForTesting: vi.fn(),
}));

vi.mock('../config/serverConfig.js', () => ({
  loadServerConfig: () => ({ databaseUrl: 'postgresql://postgres:postgres@localhost:5432/mms' }),
}));

describe('platformDatabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.query.mockResolvedValue({});
    mockClient.end.mockResolvedValue(undefined);
  });

  it('closes the app pool, wipes schema on a standalone client, then re-inits', async () => {
    const { resetAndReseedDatabase } = await import('../services/platform/platformDatabaseService.js');
    const { closeDatabase, initializeDatabaseConnection, initDb, resetDbInitStateForTesting } = await import('../db/database.js');

    await expect(resetAndReseedDatabase()).resolves.not.toThrow();

    expect(closeDatabase).toHaveBeenCalledTimes(1);
    expect(mockClient.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalled();
    expect(mockClient.end).toHaveBeenCalledTimes(1);
    expect(initializeDatabaseConnection).toHaveBeenCalledTimes(1);
    expect(resetDbInitStateForTesting).toHaveBeenCalledTimes(1);
    expect(initDb).toHaveBeenCalledTimes(1);
  });
});
