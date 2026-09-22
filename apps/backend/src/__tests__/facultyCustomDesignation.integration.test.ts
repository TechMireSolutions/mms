import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeacherRecord } from '@mms/shared';

const mockGetRequestTenant = vi.fn();
const mockBroadcastCollection = vi.fn();
const mockInvalidateCache = vi.fn();

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
  requireTenant: () => mockGetRequestTenant() ?? 'demo',
}));

vi.mock('../db/database.js', () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

vi.mock('../lib/livePush.js', () => ({
  broadcastCollection: (...args: unknown[]) => mockBroadcastCollection(...args),
}));

vi.mock('../lib/cache/index.js', () => ({
  invalidateMultiTierCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

import { ensureFacultyDesignationLookup } from '../faculty/use-cases/facultyLookupsService.js';
import { createTeacher, updateTeacherById } from '../faculty/use-cases/facultyWriteUseCases.js';
import { prepareTeacherRecord } from '../faculty/use-cases/facultyNormalizeUseCases.js';

interface MockLookupRow {
  id: string;
  workspaceSubdomain: string;
  kind: string;
  label: string;
  sortOrder: number;
  meta: unknown;
}

describe('facultyCustomDesignation - Case-insensitive lookup and persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
  });

  it('ensureFacultyDesignationLookup ignores empty or whitespace-only values', async () => {
    const mockTx = {
      select: vi.fn(),
      insert: vi.fn(),
    };

    await ensureFacultyDesignationLookup('demo', '   ', mockTx as never);
    expect(mockTx.select).not.toHaveBeenCalled();
    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  it('ensureFacultyDesignationLookup performs case-insensitive matching and skips duplicates', async () => {
    const existingLookups: MockLookupRow[] = [
      {
        id: 'des-1',
        workspaceSubdomain: 'demo',
        kind: 'designations',
        label: 'Senior Lecturer',
        sortOrder: 0,
        meta: null,
      },
    ];

    const mockTx = {
      select: () => ({
        from: () => ({
          where: async () => existingLookups,
        }),
      }),
      insert: vi.fn(),
    };

    // Attempt to add with different casing and leading/trailing whitespace
    await ensureFacultyDesignationLookup('demo', '  senior lecturer  ', mockTx as never);

    expect(mockTx.insert).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  it('ensureFacultyDesignationLookup inserts new designation and invalidates cache', async () => {
    const existingLookups: MockLookupRow[] = [
      {
        id: 'des-1',
        workspaceSubdomain: 'demo',
        kind: 'designations',
        label: 'Assistant Professor',
        sortOrder: 1,
        meta: null,
      },
    ];

    let insertedValues: unknown = null;
    const mockTx = {
      select: () => ({
        from: () => ({
          where: async () => existingLookups,
        }),
      }),
      insert: () => ({
        values: async (vals: unknown) => {
          insertedValues = vals;
          return [vals];
        },
      }),
    };

    await ensureFacultyDesignationLookup('demo', 'Dean of Academics', mockTx as never);

    expect(insertedValues).not.toBeNull();
    const inserted = insertedValues as MockLookupRow;
    expect(inserted.label).toBe('Dean of Academics');
    expect(inserted.kind).toBe('designations');
    expect(inserted.workspaceSubdomain).toBe('demo');
    expect(inserted.sortOrder).toBe(2); // Max sort (1) + 1

    expect(mockInvalidateCache).toHaveBeenCalledWith({
      tenantId: 'demo',
      domain: 'faculty_lookups',
    });
  });

  it('prepareTeacherRecord maps customDesignation to designation and deletes customDesignation', () => {
    const input = {
      name: 'Dr. Ahmad',
      contactId: 'c-100',
      customDesignation: 'Visiting Scholar',
    };

    const prepared = prepareTeacherRecord(input as never);

    expect(prepared.designation).toBe('Visiting Scholar');
    expect((prepared as Record<string, unknown>).customDesignation).toBeUndefined();
  });

  it('createTeacher normalizes custom designation and persists to repository', async () => {
    const store = new Map<string, TeacherRecord>();
    const fakeRepo = {
      findSoftDeletedByContactId: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (_tenant: string, record: TeacherRecord) => {
        store.set(String(record.id), record);
      }),
      findById: vi.fn(async (_tenant: string, id: string) => store.get(id) ?? null),
    };

    const result = await createTeacher(
      {
        contactId: 'c-200',
        name: 'Ustadh Bilal',
        customDesignation: 'Head of Arabic Department',
        employeeId: 'FAC20250005',
      },
      fakeRepo as never,
    );

    expect(result.restored).toBe(false);
    expect(result.record.designation).toBe('Head of Arabic Department');
    expect((result.record as Record<string, unknown>).customDesignation).toBeUndefined();
    expect(fakeRepo.save).toHaveBeenCalled();
  });

  it('updateTeacherById handles custom designation and updates repository', async () => {
    const existingTeacher: TeacherRecord = {
      id: 'tch-1',
      contactId: 'c-300',
      name: 'Sheikh Khalid',
      status: 'active',
      designation: 'Instructor',
      hierarchyRank: 4,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const store = new Map<string, TeacherRecord>([['tch-1', existingTeacher]]);
    const fakeRepo = {
      findById: vi.fn(async (_tenant: string, id: string) => store.get(id) ?? null),
      save: vi.fn(async (_tenant: string, record: TeacherRecord) => {
        store.set(String(record.id), record);
      }),
    };

    const updated = await updateTeacherById(
      'tch-1',
      {
        customDesignation: 'Principal Researcher',
      },
      fakeRepo as never,
    );

    expect(updated).not.toBeNull();
    expect(updated?.designation).toBe('Principal Researcher');
    expect((updated as Record<string, unknown>)?.customDesignation).toBeUndefined();
    expect(fakeRepo.save).toHaveBeenCalled();
  });
});
