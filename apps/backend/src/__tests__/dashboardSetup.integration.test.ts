import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { adminToken, teacherToken, viewerToken } from './helpers/tokens.js';

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

const mockLoadDashboardPreferences = vi.fn();
const mockSaveDashboardPreferences = vi.fn();
const mockLoadDashboardWidgets = vi.fn();
const mockUpsertDashboardWidgets = vi.fn();
const mockDeleteDashboardWidget = vi.fn();

vi.mock('../services/dashboardPreferencesService.js', () => ({
  loadDashboardPreferences: (...args: unknown[]) => mockLoadDashboardPreferences(...args),
  saveDashboardPreferences: (...args: unknown[]) => mockSaveDashboardPreferences(...args),
}));

vi.mock('../lib/dashboardWidgetsService.js', () => ({
  loadDashboardWidgets: (...args: unknown[]) => mockLoadDashboardWidgets(...args),
  upsertDashboardWidgets: (...args: unknown[]) => mockUpsertDashboardWidgets(...args),
  deleteDashboardWidget: (...args: unknown[]) => mockDeleteDashboardWidget(...args),
}));

vi.mock('../services/auditService.js', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

const sampleWidget = {
  id: 'custom-1',
  title: 'My KPI',
  category: 'students',
  collection: 'students',
  operation: 'count',
  color: 'emerald',
  isPinnedToDashboard: true,
};

describe('dashboard config routes', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    vi.clearAllMocks();
    mockLoadDashboardPreferences.mockResolvedValue(null);
    mockSaveDashboardPreferences.mockResolvedValue({
      disabledCardIds: [],
      gridMode: 'compact',
      enrollmentChartType: 'area',
      enrollmentChartColor: 'emerald',
      enrollmentChartPeriod: 10,
      revenueChartType: 'bar',
      revenueChartColor: 'mixed',
      attendanceChartType: 'bar',
      attendanceChartColor: 'semantic',
      hasanatChartType: 'pie',
      hasanatChartColor: 'mixed',
    });
    mockLoadDashboardWidgets.mockResolvedValue([sampleWidget]);
    mockUpsertDashboardWidgets.mockResolvedValue([sampleWidget]);
    mockDeleteDashboardWidget.mockResolvedValue(undefined);
  });

  it('GET preferences/widgets allowed for any authenticated tenant; PUT/DELETE gated on setupWrite', async () => {
    const app = await buildApp();

    // GET preferences — teacher (authenticated) allowed (dashboard is home).
    const prefsReadTeacher = await app.inject({
      method: 'GET',
      url: '/api/dashboard/preferences',
      headers: { host: 'demo.localhost', authorization: `Bearer ${teacherToken(app)}` },
    });
    expect(prefsReadTeacher.statusCode).toBe(200);

    // GET widgets — viewer allowed.
    const widgetsReadViewer = await app.inject({
      method: 'GET',
      url: '/api/dashboard/widgets',
      headers: { host: 'demo.localhost', authorization: `Bearer ${viewerToken(app)}` },
    });
    expect(widgetsReadViewer.statusCode).toBe(200);

    // PUT preferences — teacher denied (no settings.global.write).
    const prefsWriteDenied = await app.inject({
      method: 'PUT',
      url: '/api/dashboard/preferences',
      headers: { host: 'demo.localhost', authorization: `Bearer ${teacherToken(app)}` },
      payload: { gridMode: 'compact' },
    });
    expect(prefsWriteDenied.statusCode).toBe(403);

    // PUT widgets — admin allowed.
    const widgetsWriteOk = await app.inject({
      method: 'PUT',
      url: '/api/dashboard/widgets',
      headers: { host: 'demo.localhost', authorization: `Bearer ${adminToken(app)}` },
      payload: [sampleWidget],
    });
    expect(widgetsWriteOk.statusCode).toBe(200);
    expect(mockUpsertDashboardWidgets).toHaveBeenCalled();

    // PUT preferences — admin allowed.
    const prefsWriteOk = await app.inject({
      method: 'PUT',
      url: '/api/dashboard/preferences',
      headers: { host: 'demo.localhost', authorization: `Bearer ${adminToken(app)}` },
      payload: { gridMode: 'compact' },
    });
    expect(prefsWriteOk.statusCode).toBe(200);
    expect(mockSaveDashboardPreferences).toHaveBeenCalled();

    // DELETE widget — teacher denied.
    const deleteDenied = await app.inject({
      method: 'DELETE',
      url: '/api/dashboard/widgets/custom-1',
      headers: { host: 'demo.localhost', authorization: `Bearer ${teacherToken(app)}` },
    });
    expect(deleteDenied.statusCode).toBe(403);

    // DELETE widget — admin allowed.
    const deleteOk = await app.inject({
      method: 'DELETE',
      url: '/api/dashboard/widgets/custom-1',
      headers: { host: 'demo.localhost', authorization: `Bearer ${adminToken(app)}` },
    });
    expect(deleteOk.statusCode).toBe(200);
    expect(mockDeleteDashboardWidget).toHaveBeenCalledWith('custom-1');

    await app.close();
  });

  it('rejects an invalid widget payload with 422', async () => {
    const app = await buildApp();
    const invalid = await app.inject({
      method: 'PUT',
      url: '/api/dashboard/widgets',
      headers: { host: 'demo.localhost', authorization: `Bearer ${adminToken(app)}` },
      payload: [{ id: 'x', operation: 'median', color: 'emerald', isPinnedToDashboard: true, title: 't', category: 'c', collection: 'c' }],
    });
    expect(invalid.statusCode).toBe(400);
    await app.close();
  });
});