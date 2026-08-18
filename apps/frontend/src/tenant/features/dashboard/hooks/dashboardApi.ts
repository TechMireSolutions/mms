import { apiJson } from '@/lib/apiClient';
import type {
  DashboardPreferences,
  DashboardPreferencesPutBody,
  DashboardWidgetDto,
  DashboardWidgetsPutBody,
} from '@mms/shared';

export async function fetchDashboardPreferences(): Promise<DashboardPreferences | null> {
  const res = await apiJson<{ preferences: DashboardPreferences }>('/api/dashboard/preferences');
  return res?.preferences ?? null;
}

export async function saveDashboardPreferencesAsync(
  prefs: DashboardPreferencesPutBody,
): Promise<DashboardPreferences> {
  const res = await apiJson<{ success: boolean; preferences: DashboardPreferences }>(
    '/api/dashboard/preferences',
    {
      method: 'PUT',
      body: JSON.stringify(prefs),
    },
  );
  return res.preferences;
}

export async function fetchDashboardWidgets(): Promise<DashboardWidgetDto[]> {
  const res = await apiJson<{ widgets: DashboardWidgetDto[] }>('/api/dashboard/widgets');
  return res?.widgets ?? [];
}

export async function saveDashboardWidgetsAsync(
  widgets: DashboardWidgetsPutBody,
): Promise<DashboardWidgetDto[]> {
  const res = await apiJson<{ success: boolean; widgets: DashboardWidgetDto[] }>(
    '/api/dashboard/widgets',
    {
      method: 'PUT',
      body: JSON.stringify(widgets),
    },
  );
  return res.widgets;
}

export async function deleteDashboardWidgetAsync(id: string): Promise<void> {
  await apiJson<{ success: boolean }>(`/api/dashboard/widgets/${id}`, {
    method: 'DELETE',
  });
}
