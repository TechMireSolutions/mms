import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetRequestTenant = vi.fn(() => 'demo');
const mockSave = vi.fn();
const mockFindById = vi.fn();
const mockListByWorkspace = vi.fn();
const mockBroadcast = vi.fn();

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../db/repositories/studentRepository.js', () => ({
  listStudentsByWorkspace: (...args: unknown[]) => mockListByWorkspace(...args),
  findStudentById: (...args: unknown[]) => mockFindById(...args),
  saveStudent: (...args: unknown[]) => mockSave(...args),
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
  findStudentRegistrationConflictSql: vi.fn(),
}));

vi.mock('../services/websocketService.js', () => ({
  broadcastTenantUpdate: (...args: unknown[]) => mockBroadcast(...args),
}));

vi.mock('../services/contactService.js', () => ({
  loadContactsByIds: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/studentPreferencesService.js', () => ({
  loadStudentModulePreferences: vi.fn().mockResolvedValue({}),
}));

describe('createStudent GR unique violation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRequestTenant.mockReturnValue('demo');
  });

  it('maps Postgres unique_violation to statusCode 409', async () => {
    mockSave.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));
    const { createStudent } = await import('../services/studentService.js');
    await expect(
      createStudent({
        contactId: 'c-1',
        status: 'active',
        grNumber: 'GR-1',
      } as never),
    ).rejects.toMatchObject({ statusCode: 409, type: 'conflict' });
  });
});
