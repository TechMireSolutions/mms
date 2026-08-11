import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetRequestTenant = vi.fn(() => 'demo');
const mockSave = vi.fn();
const mockFindSoftDeletedByContactId = vi.fn();

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../db/database.js', () => ({
  runInTransaction: (cb: () => unknown) => cb(),
}));

vi.mock('../db/repositories/studentRepository.js', () => ({
  listStudentsByWorkspace: vi.fn(),
  findStudentById: vi.fn(),
  findStudentsByIds: vi.fn().mockResolvedValue([]),
  countStudentsByWorkspace: vi.fn().mockResolvedValue(0),
  saveStudent: (...args: unknown[]) => mockSave(...args),
  bulkSaveStudents: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../db/repositories/studentRepositoryList.js', () => ({
  listStudentsPage: vi.fn(),
  countStudentsActive: vi.fn(),
  aggregateStudentsCommandMetrics: vi.fn(),
  listActiveStudentsMissingGrNumber: vi.fn(),
  bulkUpdateStudentsStatusSql: vi.fn(),
}));

vi.mock('../db/repositories/studentRepositoryWidgets.js', () => ({
  aggregateStudentsWidgetQueries: vi.fn(),
  listStudentLinkedContactIdsSql: vi.fn(),
  countStudentsForNextGrNumber: vi.fn(),
  findStudentRegistrationConflictSql: vi.fn().mockResolvedValue(null),
  findSoftDeletedStudentByContactIdSql: (...args: unknown[]) => mockFindSoftDeletedByContactId(...args),
}));

vi.mock('../services/websocketService.js', () => ({
  broadcastCollection: vi.fn(),
  broadcastTenantUpdate: vi.fn(),
}));

vi.mock('../services/contactService.js', () => ({
  loadContactsByIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/studentPreferencesService.js', () => ({
  loadStudentModulePreferences: vi.fn().mockResolvedValue({}),
}));

describe('createStudent restore-on-create permission gate', () => {
  const admin = { id: 'u-admin', role: 'admin' };
  const teacher = { id: 'u-teacher', role: 'teacher' };
  const archived = {
    id: 's-archived',
    contactId: 'c-1',
    status: 'active',
    deletedAt: '2026-01-01T00:00:00.000Z',
    deletedBy: 'u-admin',
    deletionReason: 'archived',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
    mockFindSoftDeletedByContactId.mockResolvedValue(archived);
  });

  it('throws StudentPermissionError when a write-only user re-registers an archived student', async () => {
    const { createStudent } = await import('../students/use-cases/studentUseCases.js');
    const { StudentPermissionError } = await import('../students/use-cases/studentNormalizeUseCases.js');
    await expect(
      createStudent({ contactId: 'c-1', status: 'active' } as never, { user: teacher } as never),
    ).rejects.toBeInstanceOf(StudentPermissionError);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('restores the archived student when the user has delete permission', async () => {
    const { createStudent } = await import('../students/use-cases/studentUseCases.js');
    const result = await createStudent(
      { contactId: 'c-1', status: 'active', grNumber: 'GR-1' } as never,
      { user: admin } as never,
    );
    expect(result.restored).toBe(true);
    expect(result.record.id).toBe('s-archived');
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
