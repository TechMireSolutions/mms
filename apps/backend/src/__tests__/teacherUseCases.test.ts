import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Teacher, TeachersListQuery } from '@mms/shared';
import type { TeachersRepository } from '../teachers/repository/teachersRepository.js';

const mockGetRequestTenant = vi.fn();
const mockBroadcastCollection = vi.fn();
const mockLoadTeacherFieldConfig = vi.fn();
const mockLoadTeacherModulePreferences = vi.fn();

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../db/database.js', () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

vi.mock('../lib/livePush.js', () => ({
  broadcastCollection: (...args: unknown[]) => mockBroadcastCollection(...args),
}));

vi.mock('../teachers/use-cases/teacherHydrateUseCases.js', () => ({
  hydrateTeachersFromContacts: async (_tenant: unknown, rows: unknown) => rows,
}));

vi.mock('../teachers/use-cases/teacherConfigService.js', () => ({
  loadTeacherFieldConfig: (...args: unknown[]) => mockLoadTeacherFieldConfig(...args),
}));

vi.mock('../teachers/use-cases/teacherPreferencesService.js', () => ({
  loadTeacherModulePreferences: (...args: unknown[]) => mockLoadTeacherModulePreferences(...args),
}));

import { createTeachersUseCases } from '../teachers/use-cases/teacherUseCases.js';

function fakeTeacher(id: string, overrides: Partial<Teacher> = {}): Teacher {
  return {
    id,
    contactId: `c-${id}`,
    name: `Teacher ${id}`,
    status: 'active',
    ...overrides,
  };
}

/** In-memory fake repository — the DI seam the use cases are designed against. */
function createFakeRepo() {
  const store = new Map<string, Teacher>();
  return {
    store,
    repo: {
      countByWorkspace: vi.fn(async (tenant: string, options?: { includeDeleted?: boolean }) => {
        void tenant;
        return [...store.values()].filter((s) =>
          options?.includeDeleted ? true : s.deletedAt === undefined,
        ).length;
      }),
      listPage: vi.fn(async (tenant: string, query: TeachersListQuery) => {
        void tenant;
        const rows = query.includeDeleted
          ? [...store.values()].filter((s) => s.deletedAt !== undefined)
          : [...store.values()].filter((s) => s.deletedAt === undefined);
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const start = (page - 1) * limit;
        return {
          teachers: rows.slice(start, start + limit),
          total: rows.length,
          page,
          limit,
          hasMore: start + limit < rows.length,
        };
      }),
      findById: vi.fn(async (tenant: string, id: string) => {
        void tenant;
        return store.get(id) ?? null;
      }),
      findByIds: vi.fn(async (tenant: string, ids: string[]) => {
        void tenant;
        return ids.map((id) => store.get(id)).filter((s): s is Teacher => Boolean(s));
      }),
      findSoftDeletedByContactId: vi.fn(async () => null),
      save: vi.fn(async (tenant: string, teacher: Teacher) => {
        void tenant;
        store.set(String(teacher.id), teacher);
      }),
      bulkSave: vi.fn(async (tenant: string, teachers: Teacher[]) => {
        void tenant;
        teachers.forEach((teacher) => store.set(String(teacher.id), teacher));
      }),      aggregateCommandMetrics: vi.fn(async () => ({
        total: 0,
        active: 0,
        inactive: 0,
        onLeave: 0,
        other: 0,
        newThisPeriod: 0,
      })),
      aggregateWidgetQueries: vi.fn(async () => ({})),
      listLinkedContactIds: vi.fn(async () => []),
      countNextEmployeeId: vi.fn(async () => 0),
      listActiveMissingEmployeeId: vi.fn(async () => []),
      findRegistrationConflict: vi.fn(async () => null),
      bulkUpdateStatusSql: vi.fn(async () => 0),
    } as unknown as TeachersRepository,
  };
}

describe('createTeachersUseCases (DI composition root)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
    mockBroadcastCollection.mockResolvedValue(undefined);
    mockLoadTeacherFieldConfig.mockResolvedValue(null);
    mockLoadTeacherModulePreferences.mockResolvedValue({});
  });

  it('loadTeachersPage returns paged rows from the injected repo', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('b', fakeTeacher('b'));
    store.set('c', fakeTeacher('c'));
    const useCases = createTeachersUseCases(repo);

    const page = await useCases.loadTeachersPage({ page: 2, limit: 2 });
    expect(page.teachers.map((t) => t.id)).toEqual(['c']);
    expect(page.total).toBe(3);
    expect(page.hasMore).toBe(false);
  });

  it('createTeacher saves a normalized record through the injected repo and broadcasts once', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    const { record, restored } = await useCases.createTeacher({
      contactId: 'c-new',
      status: 'active',
      specialization: 'Qaidah',
    });

    expect(restored).toBe(false);
    expect(record.id).toBeDefined();
    expect(repo.save).toHaveBeenCalledWith('demo', expect.objectContaining({ specialization: 'Qaidah' }));
    expect(mockBroadcastCollection).toHaveBeenCalledTimes(1);
    expect(mockBroadcastCollection).toHaveBeenCalledWith('teachers');
  });

  it('createTeacher strips contact-owned profile keys (Contacts SSOT)', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    const { record } = await useCases.createTeacher({
      contactId: 'c-new',
      status: 'active',
      name: 'Should Strip',
      phone: '+923001234567',
      email: 'a@b.com',
      gender: 'male',
      dob: '2000-01-01',
    } as never);

    expect(record).not.toHaveProperty('name');
    expect(record).not.toHaveProperty('phone');
    expect(record).not.toHaveProperty('email');
    expect(record).not.toHaveProperty('gender');
    expect(repo.save).toHaveBeenCalledWith('demo', expect.not.objectContaining({ name: 'Should Strip' }));
  });

  it('createTeacher restores an archived row with the same contactId and preserves its id', async () => {
    const { repo, store } = createFakeRepo();
    const archived = fakeTeacher('archived', {
      deletedAt: '2026-07-27T00:00:00.000Z',
      deletedBy: 'u-admin',
      specialization: 'Hifz',
    });
    store.set('archived', archived);
    vi.mocked(repo.findSoftDeletedByContactId).mockResolvedValue(archived);
    const useCases = createTeachersUseCases(repo);

    const { record, restored } = await useCases.createTeacher({
      contactId: 'c-archived',
      status: 'active',
      specialization: 'Tajweed',
    });

    expect(restored).toBe(true);
    expect(record.id).toBe('archived');
    expect(record.specialization).toBe('Tajweed');
    expect(record.deletedAt).toBeUndefined();
    expect(repo.save).toHaveBeenCalledWith('demo', expect.objectContaining({ id: 'archived' }));
  });

  it('updateTeacherById returns null for a missing or soft-deleted id', async () => {
    const { repo, store } = createFakeRepo();
    store.set('gone', fakeTeacher('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.updateTeacherById('missing', { id: 'missing', contactId: 'c-x' })).toBeNull();
    expect(await useCases.updateTeacherById('gone', { id: 'gone', contactId: 'c-gone' })).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('updateTeacherById saves the merged record for an active row', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    const useCases = createTeachersUseCases(repo);

    const updated = await useCases.updateTeacherById('a', {
      id: 'a',
      contactId: 'c-a',
      qualification: 'MA',
    });

    expect(updated?.id).toBe('a');
    expect(updated?.deletedAt).toBeUndefined();
    expect(repo.save).toHaveBeenCalledWith('demo', expect.objectContaining({ id: 'a', qualification: 'MA' }));
    expect(mockBroadcastCollection).toHaveBeenCalledWith('teachers');
  });

  it('softDeleteTeacherById marks only active rows and records who deleted them', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('gone', fakeTeacher('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.softDeleteTeacherById('a', 'u-admin', 'Left faculty')).toBe(true);
    expect(await useCases.softDeleteTeacherById('gone', 'u-admin')).toBe(false);

    const saved = store.get('a');
    expect(saved?.deletedAt).toBeDefined();
    expect(saved?.deletedBy).toBe('u-admin');
    expect(saved?.deletionReason).toBe('Left faculty');
  });

  it('bulkSoftDeleteTeachers splits succeeded/failed rows and broadcasts once', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('gone', fakeTeacher('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.bulkSoftDeleteTeachers(['a', 'gone'], 'u-admin', '  Left faculty  ');

    expect(result).toEqual({ succeeded: 1, failed: 1 });
    expect(store.get('a')?.deletedBy).toBe('u-admin');
    expect(store.get('a')?.deletionReason).toBe('Left faculty');
    expect(repo.bulkSave).toHaveBeenCalledWith('demo', [expect.objectContaining({ id: 'a' })]);
    expect(mockBroadcastCollection).toHaveBeenCalledTimes(1);
  });

  it('restoreTeacherById clears soft-delete fields and bumps updatedAt', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a', { deletedAt: '2026-07-27T00:00:00.000Z', deletedBy: 'u-admin' }));
    const useCases = createTeachersUseCases(repo);

    const restored = await useCases.restoreTeacherById('a');

    expect(restored?.deletedAt).toBeUndefined();
    expect(restored?.deletedBy).toBeUndefined();
    expect(restored?.deletionReason).toBeUndefined();
    expect(restored?.updatedAt).toBeDefined();
    expect(store.get('a')?.deletedAt).toBeUndefined();
    expect(store.get('a')?.updatedAt).toBeDefined();
  });

  it('restoreTeacherById returns an active record unchanged without saving', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    const useCases = createTeachersUseCases(repo);

    const restored = await useCases.restoreTeacherById('a');

    expect(restored?.id).toBe('a');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('bulkRestoreTeachers restores deleted rows and reports active rows as failed', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a', { deletedAt: '2026-07-27T00:00:00.000Z', deletedBy: 'u-admin' }));
    store.set('active', fakeTeacher('active'));
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.bulkRestoreTeachers(['a', 'active']);

    expect(result).toEqual({ succeeded: 1, failed: 1 });
    expect(store.get('a')?.deletedAt).toBeUndefined();
    expect(store.get('a')?.updatedAt).toBeDefined();
    expect(repo.bulkSave).toHaveBeenCalledWith('demo', [expect.objectContaining({ id: 'a' })]);
    expect(mockBroadcastCollection).toHaveBeenCalledTimes(1);
  });

  it('countTeachers counts only active rows via the injected repo', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('b', fakeTeacher('b'));
    store.set('gone', fakeTeacher('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.countTeachers()).toBe(2);
    expect(repo.countByWorkspace).toHaveBeenCalledWith('demo', { includeDeleted: undefined });
  });

  it('countTeachers includes deleted rows when includeDeleted is set', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('gone', fakeTeacher('gone', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.countTeachers({ includeDeleted: true })).toBe(2);
    expect(repo.countByWorkspace).toHaveBeenCalledWith('demo', { includeDeleted: true });
  });

  it('loadTeacherById hides deleted rows unless includeDeleted is set', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a', { deletedAt: '2026-07-27T00:00:00.000Z' }));
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.loadTeacherById('a')).toBeNull();
    expect((await useCases.loadTeacherById('a', true))?.id).toBe('a');
  });

  it('loadTeachersCommandMetrics delegates to the injected repo', async () => {
    const { repo } = createFakeRepo();
    vi.mocked(repo.aggregateCommandMetrics).mockResolvedValue({
      total: 5,
      active: 3,
      inactive: 1,
      onLeave: 1,
      other: 0,
      newThisPeriod: 2,
    });
    const useCases = createTeachersUseCases(repo);

    const metrics = await useCases.loadTeachersCommandMetrics();

    expect(metrics.total).toBe(5);
    expect(repo.aggregateCommandMetrics).toHaveBeenCalledWith('demo');
  });

  it('loadTeachersWidgetAggregates passes queries to the injected repo', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    await useCases.loadTeachersWidgetAggregates([{ id: 'w1', operation: 'count' }]);

    expect(repo.aggregateWidgetQueries).toHaveBeenCalledWith('demo', [{ id: 'w1', operation: 'count' }]);
  });

  it('bulkUpdateTeacherStatus delegates to the SQL bulk update and broadcasts', async () => {
    const { repo } = createFakeRepo();
    vi.mocked(repo.bulkUpdateStatusSql).mockResolvedValue(2);
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.bulkUpdateTeacherStatus(['t-1', 't-2'], 'inactive');

    expect(result).toEqual({ succeeded: 2, failed: 0 });
    expect(repo.bulkUpdateStatusSql).toHaveBeenCalledWith('demo', ['t-1', 't-2'], 'inactive');
    expect(mockBroadcastCollection).toHaveBeenCalledWith('teachers');
  });

  it('computeNextTeacherEmployeeIdForSettings formats the next employee id from the injected repo', async () => {
    const { repo } = createFakeRepo();
    vi.mocked(repo.countNextEmployeeId).mockResolvedValue(5);
    const useCases = createTeachersUseCases(repo);

    const employeeId = await useCases.computeNextTeacherEmployeeIdForSettings({
      idPrefix: 'T',
    });

    expect(employeeId).toBe('T-0006');
    expect(repo.countNextEmployeeId).toHaveBeenCalledWith('demo');
  });

  it('loadTeachersByIds returns matched rows from the injected repo', async () => {
    const { repo, store } = createFakeRepo();
    store.set('a', fakeTeacher('a'));
    store.set('b', fakeTeacher('b'));
    const useCases = createTeachersUseCases(repo);

    const rows = await useCases.loadTeachersByIds(['a', 'missing', 'b']);

    expect(rows.map((t) => t.id)).toEqual(['a', 'b']);
    expect(repo.findByIds).toHaveBeenCalledWith('demo', ['a', 'missing', 'b']);
  });

  it('loadTeachersByIds returns an empty array for empty input without hitting the repo', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    expect(await useCases.loadTeachersByIds([])).toEqual([]);
    expect(repo.findByIds).not.toHaveBeenCalled();
  });

  it('loadTeacherLinkedContactIds delegates to the injected repo', async () => {
    const { repo } = createFakeRepo();
    vi.mocked(repo.listLinkedContactIds).mockResolvedValue(['c-1', 'c-2']);
    const useCases = createTeachersUseCases(repo);

    const ids = await useCases.loadTeacherLinkedContactIds('t-exclude');

    expect(ids).toEqual(['c-1', 'c-2']);
    expect(repo.listLinkedContactIds).toHaveBeenCalledWith('demo', 't-exclude');
  });



  it('checkTeacherRegistrationDuplicate returns the conflict reason from the repo', async () => {
    const { repo } = createFakeRepo();
    vi.mocked(repo.findRegistrationConflict).mockResolvedValue('employeeId');
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.checkTeacherRegistrationDuplicate({ employeeId: 'T-0001' });

    expect(result).toEqual({ reason: 'employeeId' });
    expect(repo.findRegistrationConflict).toHaveBeenCalledWith('demo', { employeeId: 'T-0001' });
  });

  it('checkTeacherRegistrationDuplicate returns no conflict when the repo finds none', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.checkTeacherRegistrationDuplicate({ contactId: 'c-new' });

    expect(result).toEqual({ reason: null });
    expect(repo.findRegistrationConflict).toHaveBeenCalledWith('demo', { contactId: 'c-new' });
  });

  it('migrateTeachersMissingEmployeeIds backfills monotonic employee ids and broadcasts once', async () => {
    const { repo, store } = createFakeRepo();
    store.set('m1', fakeTeacher('m1'));
    store.set('m2', fakeTeacher('m2'));
    vi.mocked(repo.listActiveMissingEmployeeId).mockResolvedValue([
      fakeTeacher('m1'),
      fakeTeacher('m2'),
    ]);
    const countNextEmployeeIdMock = vi.mocked(repo.countNextEmployeeId);
    countNextEmployeeIdMock.mockImplementation(async () => {
      // countNextEmployeeId is called once per persisted row; return a growing count.
      return countNextEmployeeIdMock.mock.calls.length - 1;
    });
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.migrateTeachersMissingEmployeeIds();

    expect(result).toEqual({ updated: 2 });
    expect(store.get('m1')?.employeeId).toBeDefined();
    expect(store.get('m2')?.employeeId).toBeDefined();
    expect(store.get('m2')?.employeeId).not.toBe(store.get('m1')?.employeeId);
    expect(mockBroadcastCollection).toHaveBeenCalledWith('teachers');
  });

  it('migrateTeachersMissingEmployeeIds is a no-op when no rows are missing', async () => {
    const { repo } = createFakeRepo();
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.migrateTeachersMissingEmployeeIds();

    expect(result).toEqual({ updated: 0 });
    expect(repo.countNextEmployeeId).not.toHaveBeenCalled();
    expect(mockBroadcastCollection).not.toHaveBeenCalled();
  });

  it('migrateTeachersMissingEmployeeIds returns early without a tenant', async () => {
    const { repo } = createFakeRepo();
    mockGetRequestTenant.mockReturnValue(null);
    const useCases = createTeachersUseCases(repo);

    const result = await useCases.migrateTeachersMissingEmployeeIds();

    expect(result).toEqual({ updated: 0 });
    expect(repo.listActiveMissingEmployeeId).not.toHaveBeenCalled();
    expect(mockBroadcastCollection).not.toHaveBeenCalled();
  });

  it('sanitizeTeacherForViewer passes the record through when no field config is registered', async () => {
    const { repo } = createFakeRepo();
    mockLoadTeacherFieldConfig.mockResolvedValue(null);
    const useCases = createTeachersUseCases(repo);

    const teacher = fakeTeacher('a', { phone: '+923001234567' });
    expect(await useCases.sanitizeTeacherForViewer(teacher, 'teacher')).toEqual(teacher);
  });

  it('sanitizeTeacherForViewer hides disabled fields per the field config', async () => {
    const { repo } = createFakeRepo();
    mockLoadTeacherFieldConfig.mockResolvedValue({
      fields: {
        employment: [
          { key: 'qualification', label: 'Qualification', type: 'text', enabled: false, order: 0 },
          { key: 'specialization', label: 'Specialization', type: 'text', enabled: true, order: 1 },
        ],
      },
      formTabs: [{ key: 'employment', label: 'Employment', enabled: true, order: 0 }],
    });
    const useCases = createTeachersUseCases(repo);

    const teacher = fakeTeacher('a', { qualification: 'MA', specialization: 'Qaidah' });
    const sanitized = await useCases.sanitizeTeacherForViewer(teacher, 'teacher');

    expect(sanitized.qualification).toBeUndefined();
    expect(sanitized.specialization).toBe('Qaidah');
  });

  it('sanitizeTeachersForViewer strips disabled fields from every row', async () => {
    const { repo } = createFakeRepo();
    mockLoadTeacherFieldConfig.mockResolvedValue({
      fields: {
        employment: [
          { key: 'qualification', label: 'Qualification', type: 'text', enabled: false, order: 0 },
        ],
      },
      formTabs: [{ key: 'employment', label: 'Employment', enabled: true, order: 0 }],
    });
    const useCases = createTeachersUseCases(repo);

    const rows = [
      fakeTeacher('a', { qualification: 'MA' }),
      fakeTeacher('b', { qualification: 'BA' }),
    ];
    const sanitized = await useCases.sanitizeTeachersForViewer(rows, 'teacher');

    expect(sanitized.every((t) => t.qualification === undefined)).toBe(true);
  });
});
