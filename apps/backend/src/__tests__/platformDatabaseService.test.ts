import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/database.js', () => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({}),
    release: vi.fn(),
  };
  const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
  };
  return {
    getPool: () => mockPool,
    initDb: vi.fn().mockResolvedValue(undefined),
  };
});

describe('platformDatabaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes database schema wipe and triggers initDb', async () => {
    const { resetAndReseedDatabase } = await import('../services/platform/platformDatabaseService.js');
    const { initDb } = await import('../db/database.js');

    await expect(resetAndReseedDatabase()).resolves.not.toThrow();
    expect(initDb).toHaveBeenCalledTimes(1);
  });
});
