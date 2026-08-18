import { apiJson } from '@/lib/apiClient';
import type {
  DashboardPreferences,
  DashboardPreferencesPutBody,
  DashboardWidgetDto,
  DashboardWidgetsPutBody,
} from '@mms/shared';

const PREFERENCES_API = '/api/dashboard/preferences';
const WIDGETS_API = '/api/dashboard/widgets';
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export async function fetchDashboardPreferences(
  signal?: AbortSignal,
): Promise<DashboardPreferences | null> {
  const res = await apiJson<{ preferences: DashboardPreferences }>(PREFERENCES_API, { signal });
  return res?.preferences ?? null;
}

export async function saveDashboardPreferencesAsync(
  prefs: DashboardPreferencesPutBody,
  signal?: AbortSignal,
): Promise<DashboardPreferences> {
  const res = await apiJson<{ success: boolean; preferences: DashboardPreferences }>(
    PREFERENCES_API,
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(prefs),
      signal,
    },
  );
  return res.preferences;
}

export async function fetchDashboardWidgets(signal?: AbortSignal): Promise<DashboardWidgetDto[]> {
  const res = await apiJson<{ widgets: DashboardWidgetDto[] }>(WIDGETS_API, { signal });
  return res?.widgets ?? [];
}

export async function saveDashboardWidgetsAsync(
  widgets: DashboardWidgetsPutBody,
  signal?: AbortSignal,
): Promise<DashboardWidgetDto[]> {
  const res = await apiJson<{ success: boolean; widgets: DashboardWidgetDto[] }>(WIDGETS_API, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(widgets),
    signal,
  });
  return res.widgets;
}

export async function deleteDashboardWidgetAsync(id: string, signal?: AbortSignal): Promise<void> {
  await apiJson<{ success: boolean }>(`${WIDGETS_API}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  });
}