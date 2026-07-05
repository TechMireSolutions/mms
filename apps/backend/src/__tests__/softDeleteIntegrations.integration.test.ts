import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  const demoWorkspace = {
    id: 'ws-demo',
    subdomain: 'demo',
    madrasaName: 'Demo Madrasa',
    createdAt: '2026-01-01T00:00:00.000Z',
    enabled: true,
  };
  return {
    ...actual,
    getWorkspaceBySubdomain: vi.fn().mockImplementation(async (subdomain: string) =>
      subdomain === 'demo' ? demoWorkspace : null,
    ),
  };
});

const mockDeleteEnrollmentById = vi.fn();
const mockRestoreEnrollmentById = vi.fn();
const mockDeleteAttendanceRecordById = vi.fn();
const mockRestoreAttendanceRecordById = vi.fn();
const mockDeleteInvoiceById = vi.fn();
const mockRestoreInvoiceById = vi.fn();
const mockDeletePaymentById = vi.fn();
const mockRestorePaymentById = vi.fn();

vi.mock('../services/enrollmentService.js', () => ({
  loadEnrollments: vi.fn().mockResolvedValue([]),
  createEnrollment: vi.fn(),
  updateEnrollmentById: vi.fn(),
  deleteEnrollmentById: (...args: unknown[]) => mockDeleteEnrollmentById(...args),
  restoreEnrollmentById: (...args: unknown[]) => mockRestoreEnrollmentById(...args),
}));

vi.mock('../services/attendanceService.js', () => ({
  loadAttendanceRecords: vi.fn().mockResolvedValue([]),
  createAttendanceRecord: vi.fn(),
  updateAttendanceRecordById: vi.fn(),
  replaceAttendanceRecords: vi.fn(),
  deleteAttendanceRecordById: (...args: unknown[]) => mockDeleteAttendanceRecordById(...args),
  restoreAttendanceRecordById: (...args: unknown[]) => mockRestoreAttendanceRecordById(...args),
}));

vi.mock('../services/financeService.js', () => ({
  loadInvoices: vi.fn().mockResolvedValue([]),
  createInvoice: vi.fn(),
  updateInvoiceById: vi.fn(),
  deleteInvoiceById: (...args: unknown[]) => mockDeleteInvoiceById(...args),
  restoreInvoiceById: (...args: unknown[]) => mockRestoreInvoiceById(...args),
  loadPayments: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn(),
  updatePaymentById: vi.fn(),
  deletePaymentById: (...args: unknown[]) => mockDeletePaymentById(...args),
  restorePaymentById: (...args: unknown[]) => mockRestorePaymentById(...args),
}));

function adminToken(app: Awaited<ReturnType<typeof buildApp>>): string {
  return app.jwt.sign({
    id: 'u-admin',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
    workspaceSubdomain: 'demo',
    twoFactorVerified: true,
    tokenType: 'access',
  });
}

describe('soft deletion and restore integrations', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  // --- Enrollments ---
  it('DELETE /api/enrollments/:id soft-deletes enrollment', async () => {
    mockDeleteEnrollmentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/enrollments/e1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Dropped class' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteEnrollmentById).toHaveBeenCalledWith('e1', 'u-admin', 'Dropped class');
    await app.close();
  });

  it('POST /api/enrollments/:id/restore restores enrollment', async () => {
    mockRestoreEnrollmentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/enrollments/e1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreEnrollmentById).toHaveBeenCalledWith('e1');
    await app.close();
  });

  // --- Attendance ---
  it('DELETE /api/attendance/:id soft-deletes attendance record', async () => {
    mockDeleteAttendanceRecordById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/attendance/a1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Error input' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteAttendanceRecordById).toHaveBeenCalledWith('a1', 'u-admin', 'Error input');
    await app.close();
  });

  it('POST /api/attendance/:id/restore restores attendance record', async () => {
    mockRestoreAttendanceRecordById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/attendance/a1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreAttendanceRecordById).toHaveBeenCalledWith('a1');
    await app.close();
  });

  // --- Finance Invoices ---
  it('DELETE /api/finance/invoices/:id soft-deletes invoice', async () => {
    mockDeleteInvoiceById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/finance/invoices/i1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Billing error' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeleteInvoiceById).toHaveBeenCalledWith('i1', 'u-admin', 'Billing error');
    await app.close();
  });

  it('POST /api/finance/invoices/:id/restore restores invoice', async () => {
    mockRestoreInvoiceById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/finance/invoices/i1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestoreInvoiceById).toHaveBeenCalledWith('i1');
    await app.close();
  });

  // --- Finance Payments ---
  it('DELETE /api/finance/payments/:id soft-deletes payment', async () => {
    mockDeletePaymentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/finance/payments/p1',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
      payload: { deletionReason: 'Refunded' },
    });
    expect(res.statusCode).toBe(200);
    expect(mockDeletePaymentById).toHaveBeenCalledWith('p1', 'u-admin', 'Refunded');
    await app.close();
  });

  it('POST /api/finance/payments/:id/restore restores payment', async () => {
    mockRestorePaymentById.mockResolvedValue(true);
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/finance/payments/p1/restore',
      headers: {
        host: 'demo.localhost',
        authorization: `Bearer ${adminToken(app)}`,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(mockRestorePaymentById).toHaveBeenCalledWith('p1');
    await app.close();
  });
});
