import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWithTenantTransaction = vi.fn();

vi.mock('../db/withTenantTransaction.js', () => ({
  withTenantTransaction: (...args: unknown[]) => mockWithTenantTransaction(...args),
}));

vi.mock('../db/repositories/teacherRepository.js', () => ({
  teacherRowToRecord: (row: unknown) => row,
}));

describe('bulkUpdateTeachersStatusSql', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates matching active ids in one transaction and returns row count', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 't-1' }, { id: 't-2' }]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mockWithTenantTransaction.mockImplementation(
      async (_tenant: unknown, fn: (tx: { update: typeof update }) => Promise<unknown>) =>
        fn({ update }),
    );

    const { bulkUpdateTeachersStatusSql } = await import(
      '../db/repositories/teacherRepositoryList.js'
    );
    const succeeded = await bulkUpdateTeachersStatusSql('Demo', ['t-1', 't-2', 't-1'], 'inactive');

    expect(mockWithTenantTransaction).toHaveBeenCalledWith('demo', expect.any(Function));
    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        customData: expect.anything(),
        updatedAt: expect.any(Date),
      }),
    );
    expect(succeeded).toBe(2);
  });

  it('returns 0 when ids are empty', async () => {
    const { bulkUpdateTeachersStatusSql } = await import(
      '../db/repositories/teacherRepositoryList.js'
    );
    const succeeded = await bulkUpdateTeachersStatusSql('demo', ['  ', ''], 'active');
    expect(succeeded).toBe(0);
    expect(mockWithTenantTransaction).not.toHaveBeenCalled();
  });
});
