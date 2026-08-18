import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  fetchDashboardPreferences,
  saveDashboardPreferencesAsync,
  fetchDashboardWidgets,
  saveDashboardWidgetsAsync,
  deleteDashboardWidgetAsync,
} from './dashboardApi';

const mockApiJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/apiClient', () => ({
  apiJson: (...args: unknown[]) => mockApiJson(...args),
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    mockApiJson.mockReset();
  });

  it('fetchDashboardPreferences calls GET /api/dashboard/preferences', async () => {
    mockApiJson.mockResolvedValueOnce({
      preferences: { disabledCardIds: [], gridMode: 'comfortable' },
    });

    const res = await fetchDashboardPreferences();
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/preferences');
    expect(res?.gridMode).toBe('comfortable');
  });

  it('saveDashboardPreferencesAsync calls PUT /api/dashboard/preferences', async () => {
    mockApiJson.mockResolvedValueOnce({
      preferences: { disabledCardIds: ['c1'], gridMode: 'compact' },
    });

    const res = await saveDashboardPreferencesAsync({ gridMode: 'compact' });
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/preferences', {
      method: 'PUT',
      body: JSON.stringify({ gridMode: 'compact' }),
    });
    expect(res.gridMode).toBe('compact');
  });

  it('fetchDashboardWidgets calls GET /api/dashboard/widgets', async () => {
    mockApiJson.mockResolvedValueOnce({ widgets: [{ id: 'w1' }] });

    const res = await fetchDashboardWidgets();
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets');
    expect(res).toEqual([{ id: 'w1' }]);
  });

  it('saveDashboardWidgetsAsync calls PUT /api/dashboard/widgets', async () => {
    mockApiJson.mockResolvedValueOnce({ widgets: [{ id: 'w1' }] });

    const res = await saveDashboardWidgetsAsync([{ id: 'w1' } as any]);
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets', {
      method: 'PUT',
      body: JSON.stringify([{ id: 'w1' }]),
    });
    expect(res).toEqual([{ id: 'w1' }]);
  });

  it('deleteDashboardWidgetAsync calls DELETE /api/dashboard/widgets/:id', async () => {
    mockApiJson.mockResolvedValueOnce({ success: true });

    await deleteDashboardWidgetAsync('w1');
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets/w1', {
      method: 'DELETE',
    });
  });
});
