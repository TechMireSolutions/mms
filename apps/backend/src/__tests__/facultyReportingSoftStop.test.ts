import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistFacultyTx } from '../db/repositories/facultyRepositoryColumns.js';

describe('persistFacultyTx employment profile writes', () => {
  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists core employment fields without legacy denormalized columns', async () => {
    await persistFacultyTx(tx as never, 'demo', {
      id: 'f1',
      contactId: 'c1',
      status: 'active',
      reportingFacultyId: 'legacy-sup',
      department: 'Legacy Dept',
      designation: 'Legacy Title',
      hierarchyRank: 3,
    } as never);

    expect(tx.insert).toHaveBeenCalled();
    const valuesArg = tx.insert.mock.results[0]?.value.values.mock.calls[0]?.[0];
    expect(valuesArg).toMatchObject({
      id: 'f1',
      contactId: 'c1',
      status: 'active',
    });
    expect(valuesArg).not.toHaveProperty('department');
    expect(valuesArg).not.toHaveProperty('designation');
    expect(valuesArg).not.toHaveProperty('reportingFacultyId');
    expect(valuesArg).not.toHaveProperty('hierarchyRank');
  });
});
