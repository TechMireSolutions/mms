import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FastifyReply, FastifyRequest } from 'fastify';

const mockGetRequestTenant = vi.fn();
const mockGetWorkspaceGlobalSettings = vi.fn();
const mockGetWorkspaceGrantedModulesRepo = vi.fn();
const mockSendForbidden = vi.fn();

vi.mock('../lib/tenantContext.js', () => ({
  getRequestTenant: () => mockGetRequestTenant(),
}));

vi.mock('../db/repositories/workspaceRepository.js', () => ({
  getWorkspaceGlobalSettings: (...args: unknown[]) => mockGetWorkspaceGlobalSettings(...args),
  getWorkspaceGrantedModulesRepo: (...args: unknown[]) => mockGetWorkspaceGrantedModulesRepo(...args),
}));

vi.mock('../lib/httpErrors.js', () => ({
  sendForbidden: (...args: unknown[]) => mockSendForbidden(...args),
}));

import { requireTenantModule } from '../middleware/requireTenantModule.js';

describe('requireTenantModule middleware', () => {
  const dummyRequest = {
    log: { error: vi.fn() },
  } as unknown as FastifyRequest;

  const dummyReply = {} as FastifyReply;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no-ops when there is no tenant in request context', async () => {
    mockGetRequestTenant.mockReturnValue(null);
    const middleware = requireTenantModule('students');
    await middleware(dummyRequest, dummyReply);

    expect(mockSendForbidden).not.toHaveBeenCalled();
  });

  it('proceeds gracefully when workspace settings fetch throws', async () => {
    mockGetRequestTenant.mockReturnValue('sub1');
    mockGetWorkspaceGlobalSettings.mockRejectedValue(new Error('DB uninitialized'));

    const middleware = requireTenantModule('students');
    await middleware(dummyRequest, dummyReply);

    expect(mockSendForbidden).not.toHaveBeenCalled();
  });

  it('blocks request when module is not in grantedModules', async () => {
    mockGetRequestTenant.mockReturnValue('sub1');
    mockGetWorkspaceGlobalSettings.mockResolvedValue({ enabledModules: {} });
    mockGetWorkspaceGrantedModulesRepo.mockResolvedValue(['finance', 'accounting']);

    const middleware = requireTenantModule('students');
    await middleware(dummyRequest, dummyReply);

    expect(mockSendForbidden).toHaveBeenCalledWith(
      dummyReply,
      'The students module is not permitted by the platform.',
    );
  });

  it('blocks request when module is explicitly disabled in workspace settings', async () => {
    mockGetRequestTenant.mockReturnValue('sub1');
    mockGetWorkspaceGlobalSettings.mockResolvedValue({
      enabledModules: { accounting: false },
    });
    mockGetWorkspaceGrantedModulesRepo.mockResolvedValue([]);

    const middleware = requireTenantModule('accounting');
    await middleware(dummyRequest, dummyReply);

    expect(mockSendForbidden).toHaveBeenCalledWith(
      dummyReply,
      'The accounting module is disabled for this workspace.',
    );
  });

  it('allows request when module is granted and enabled', async () => {
    mockGetRequestTenant.mockReturnValue('sub1');
    mockGetWorkspaceGlobalSettings.mockResolvedValue({
      enabledModules: { students: true },
    });
    mockGetWorkspaceGrantedModulesRepo.mockResolvedValue(['students', 'teachers']);

    const middleware = requireTenantModule('students');
    await middleware(dummyRequest, dummyReply);

    expect(mockSendForbidden).not.toHaveBeenCalled();
  });
});
