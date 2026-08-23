import { apiContract } from '@/lib/api';
import {
  normalizeDashboardWidgets,
  type DashboardPreferences,
  type DashboardPreferencesPutBody,
  type DashboardWidgetDto,
  type DashboardWidgetsPutBody,
} from '@mms/shared';

export async function fetchDashboardPreferences(
  signal?: AbortSignal,
): Promise<DashboardPreferences | null> {
  const res = await apiContract.dashboard.getPreferences({
    query: {},
  });
  if (res.status === 200) {
    return (res.body as any).preferences;
  }
  return null;
}

export async function saveDashboardPreferencesAsync(
  prefs: DashboardPreferencesPutBody,
  signal?: AbortSignal,
): Promise<DashboardPreferences> {
  const res = await apiContract.dashboard.putPreferences({
    body: prefs,
  });
  if (res.status === 200) {
    return (res.body as any).preferences;
  }
  throw new Error('Failed to save dashboard preferences');
}

export async function fetchDashboardWidgets(signal?: AbortSignal): Promise<DashboardWidgetDto[]> {
  const res = await apiContract.dashboard.getWidgets({ query: {} });
  if (res.status === 200) {
    return (res.body as any).widgets;
  }
  return [];
}

export async function saveDashboardWidgetsAsync(
  widgets: DashboardWidgetsPutBody,
  signal?: AbortSignal,
): Promise<DashboardWidgetDto[]> {
  const sanitizedWidgets = normalizeDashboardWidgets(widgets);
  const res = await apiContract.dashboard.putWidgets({
    body: sanitizedWidgets,
  });
  if (res.status === 200) {
    return (res.body as any).widgets;
  }
  throw new Error('Failed to save dashboard widgets');
}

export async function deleteDashboardWidgetAsync(id: string, signal?: AbortSignal): Promise<void> {
  await apiContract.dashboard.deleteWidget({
    params: { id },
    body: {},
  });
}