import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWithTenant = vi.fn();

vi.mock('../db/tenant-context.js', () => ({
  withTenant: (_tenant: string, cb: (tx: unknown) => Promise<unknown>) => mockWithTenant(cb),
}));

import {
  findSessionById,
  findSessionsByIds,
  listSessionsByWorkspace,
} from '../db/repositories/sessionRepositoryHydrate.js';

function createMockTx(queue: unknown[][]) {
  let index = 0;
  const makeNode = (): any => ({
    from: () => makeNode(),
    where: () => makeNode(),
    orderBy: () => makeNode(),
    offset: () => makeNode(),
    limit: () => makeNode(),
    then: (resolve: (v: unknown) => void) => resolve(queue[index++] ?? []),
  });

  return {
    select: vi.fn(() => makeNode()),
  };
}

describe('sessionRepositoryHydrate', () => {
  beforeEach(() => {
    mockWithTenant.mockReset();
  });

  it('findSessionById returns null when session is not found', async () => {
    const tx = createMockTx([[]]);
    mockWithTenant.mockImplementation(async (cb) => cb(tx));

    const result = await findSessionById('test-tenant', 'sess-nonexistent');

    expect(result).toBeNull();
  });

  it('findSessionById returns fully hydrated session when found', async () => {
    const sessionRow = {
      id: 'sess-1',
      workspaceSubdomain: 'test-tenant',
      name: 'Spring 2026',
      type: 'term',
      status: 'active',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      baseFee: '500',
      currency: 'USD',
      description: 'Spring term',
      budgetTotalRevenue: '10000',
      budgetCollected: '5000',
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const classRow = {
      id: 'cls-1',
      sessionId: 'sess-1',
      name: 'Quran 101',
      ageMin: 5,
      ageMax: 10,
      gender: 'any',
      teacherId: 't-1',
      teacherName: 'Ustadh Ali',
      capacity: 20,
      enrolled: 15,
      room: '1A',
      sortOrder: 1,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    // 1 select for session row, then 7 selects for children in hydrateSessionsList
    const tx = createMockTx([[sessionRow], [classRow], [], [], [], [], [], []]);
    mockWithTenant.mockImplementation(async (cb) => cb(tx));

    const result = await findSessionById('test-tenant', 'sess-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('sess-1');
    expect(result?.name).toBe('Spring 2026');
    expect(result?.classes).toHaveLength(1);
    expect(result?.classes[0]?.name).toBe('Quran 101');
  });

  it('findSessionsByIds returns empty array when empty ids given', async () => {
    const result = await findSessionsByIds('test-tenant', []);
    expect(result).toEqual([]);
    expect(mockWithTenant).not.toHaveBeenCalled();
  });

  it('listSessionsByWorkspace handles options and hydrates session list', async () => {
    const sessionRow = {
      id: 'sess-1',
      workspaceSubdomain: 'test-tenant',
      name: 'Summer 2026',
      type: 'camp',
      status: 'upcoming',
      startDate: '2026-07-01',
      endDate: '2026-08-15',
      baseFee: '250',
      currency: 'USD',
      description: null,
      budgetTotalRevenue: null,
      budgetCollected: null,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const tx = createMockTx([[sessionRow], [], [], [], [], [], [], []]);
    mockWithTenant.mockImplementation(async (cb) => cb(tx));

    const result = await listSessionsByWorkspace('test-tenant', { limit: 10, offset: 5 });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Summer 2026');
  });
});
