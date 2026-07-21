import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';

vi.mock('../db/database.js', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  pingDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock('../services/auth/authArtifactService.js', () => ({
  purgeExpiredAuthArtifacts: vi.fn().mockResolvedValue(undefined),
  putAuthArtifact: vi.fn(),
  takeAuthArtifact: vi.fn(),
}));

vi.mock('../services/workspaceService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/workspaceService.js')>();
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? { id: 'ws-demo', subdomain: 'demo', madrasaName: 'Demo Madrasa', enabled: true } : null,
    ),
  };
});

const mockLoadInvoices = vi.fn();

vi.mock('../services/financeService.js', () => ({
  loadInvoices: (...args: unknown[]) => mockLoadInvoices(...args),
  createInvoice: vi.fn(),
  updateInvoiceById: vi.fn(),
  deleteInvoiceById: vi.fn(),
  restoreInvoiceById: vi.fn(),
  loadPayments: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn(),
  updatePaymentById: vi.fn(),
  deletePaymentById: vi.fn(),
  restorePaymentById: vi.fn(),
}));

function accountantToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-accountant',
    email: 'finance@test.com',
    name: 'Finance User',
    role: 'accountant',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('finance REST routes integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    mockLoadInvoices.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/finance/invoices requires auth header', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/finance/invoices',
      headers: { host: 'demo.localhost' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('GET /api/finance/invoices returns invoices for accountant', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/finance/invoices',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${accountantToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ invoices: [] });
    await app.close();
  });
});
