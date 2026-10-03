import { describe, expect, it, vi } from 'vitest';
import { persistFacultyTx } from '../db/repositories/facultyRepositoryColumns.js';

function makeTx(existing: { reportingFacultyId: string | null } | null) {
  const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  return {
    tx: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue(existing ? [existing] : []),
          })),
        })),
      })),
      insert: vi.fn(() => ({ values })),
    },
    values,
  };
}

describe('persistFacultyTx soft-stop for reportingFacultyId', () => {
  it('forces reportingFacultyId null on create', async () => {
    const { tx, values } = makeTx(null);
    await persistFacultyTx(tx as never, 'demo', {
      id: 'f-new',
      contactId: 'c1',
      status: 'active',
      reportingFacultyId: 'f-boss',
    } as never);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ reportingFacultyId: null }),
    );
  });

  it('preserves existing reportingFacultyId on update when omitted', async () => {
    const { tx, values } = makeTx({ reportingFacultyId: 'f-legacy' });
    await persistFacultyTx(tx as never, 'demo', {
      id: 'f1',
      contactId: 'c1',
      status: 'active',
    } as never);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ reportingFacultyId: 'f-legacy' }),
    );
  });
});
