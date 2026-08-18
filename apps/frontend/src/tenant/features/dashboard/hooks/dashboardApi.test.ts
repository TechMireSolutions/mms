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

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

describe('dashboardApi', () => {
  beforeEach(() => {
    mockApiJson.mockReset();
  });

  it('fetchDashboardPreferences calls GET /api/dashboard/preferences', async () => {
    mockApiJson.mockResolvedValueOnce({
      preferences: { disabledCardIds: [], gridMode: 'comfortable' },
    });

    const res = await fetchDashboardPreferences();
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/preferences', { signal: undefined });
    expect(res?.gridMode).toBe('comfortable');
  });

  it('saveDashboardPreferencesAsync calls PUT /api/dashboard/preferences', async () => {
    mockApiJson.mockResolvedValueOnce({
      preferences: { disabledCardIds: ['c1'], gridMode: 'compact' },
    });

    const res = await saveDashboardPreferencesAsync({ gridMode: 'compact' });
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/preferences', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ gridMode: 'compact' }),
      signal: undefined,
    });
    expect(res.gridMode).toBe('compact');
  });

  it('fetchDashboardWidgets calls GET /api/dashboard/widgets', async () => {
    mockApiJson.mockResolvedValueOnce({ widgets: [{ id: 'w1' }] });

    const res = await fetchDashboardWidgets();
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets', { signal: undefined });
    expect(res).toEqual([{ id: 'w1' }]);
  });

  it('saveDashboardWidgetsAsync calls PUT /api/dashboard/widgets', async () => {
    const sampleWidget = {
      id: 'w1',
      title: 'Total Students',
      category: 'students',
      collection: 'students',
      operation: 'count' as const,
      color: 'emerald',
      isPinnedToDashboard: true,
    };
    mockApiJson.mockResolvedValueOnce({ widgets: [sampleWidget] });

    const res = await saveDashboardWidgetsAsync([sampleWidget]);
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets', {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify([sampleWidget]),
      signal: undefined,
    });
    expect(res).toEqual([sampleWidget]);
  });

  it('deleteDashboardWidgetAsync calls DELETE /api/dashboard/widgets/:id', async () => {
    mockApiJson.mockResolvedValueOnce({ success: true });

    await deleteDashboardWidgetAsync('w1');
    expect(mockApiJson).toHaveBeenCalledWith('/api/dashboard/widgets/w1', {
      method: 'DELETE',
      signal: undefined,
    });
  });
});