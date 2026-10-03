import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findAncestorChain } from '../db/repositories/facultyRepositorySubordinates.js';
import { listFacultyPage } from '../db/repositories/facultyRepositoryListQueryPage.js';
import { guardFacultyAssignmentDependents } from '../db/repositories/facultyDeleteGuard.js';

const { tx } = vi.hoisted(() => ({ tx: { execute: vi.fn(), select: vi.fn() } }));
vi.mock('../db/tenant-context.js', () => ({
  withTenant: (_tenant: string, work: (value: typeof tx) => Promise<unknown>) => work(tx),
  withTenantRead: (_tenant: string, work: (value: typeof tx) => Promise<unknown>) => work(tx),
}));
beforeEach(() => { tx.execute.mockReset(); tx.select.mockReset(); });

describe('Faculty repository review regressions', () => {
  it('given a PostgreSQL result envelope, returns ancestor IDs when checking a supervisor', async () => {
    // Arrange
    tx.execute.mockResolvedValue({ rows: [{ ancestor_id: 'manager' }, { ancestor_id: 'principal' }], rowCount: 2 });
    // Act / Assert
    expect(await findAncestorChain('demo', 'member')).toEqual(['manager', 'principal']);
  });

  it('given stored custom fields and notes, includes them in the directory response', async () => {
    // Arrange
    const stored: Record<string, unknown> = {
      id: 'f', contactId: 'c', status: 'active', hierarchyRank: 10,
      notes: 'Office hours', customData: { office: 'Room 12' },
    };
    tx.select.mockImplementation((projection: Record<string, unknown>) => {
      const query = {
        from: () => query, where: () => query, orderBy: () => query, limit: () => query,
        offset: () => query, groupBy: async () => [],
        then: (resolve: (value: unknown) => void) => resolve('count' in projection ? [{ count: 1 }]
          : [Object.fromEntries(Object.keys(projection).map((key) => [key, stored[key] ?? null]))]),
      };
      return query;
    });
    // Act
    const result = await listFacultyPage('demo', {});
    // Assert
    expect(result.faculty[0]).toMatchObject({ id: 'f', notes: 'Office hours', office: 'Room 12' });
  });

  it('given an assignment dependent, rejects deletion after acquiring the hierarchy lock', async () => {
    // Arrange
    tx.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 'child' }] });
    // Act / Assert
    await expect(guardFacultyAssignmentDependents('demo', ['manager'])).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.execute).toHaveBeenCalledTimes(2);
  });

  it('given no surviving dependents, permits deletion', async () => {
    // Arrange
    tx.execute.mockResolvedValue({ rows: [] });
    // Act / Assert
    await expect(guardFacultyAssignmentDependents('demo', ['manager', 'child'])).resolves.toBeUndefined();
  });
});
