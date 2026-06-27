import {
  CONTACTS_MODULE_CONTRACT,
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  type ContactColumnPreference,
  type ContactPreferences,
  type ContactsSavedReport,
  type ContactsSavedReportViewer,
  type UserModuleColumnPreferencesMap,
} from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

const COLUMN_PREFERENCES_KEY = CONTACTS_MODULE_CONTRACT.columnPreferencesObjectKey;
const LEGACY_COLUMN_PREFERENCES_KEY = 'contact_user_column_prefs';

export async function getUserColumnPreferences(userId: string): Promise<ContactColumnPreference[]> {
  const map = await loadColumnPreferencesMap();
  const preferences = map[userId];
  if (!Array.isArray(preferences)) return [];
  return preferences.filter(
    (preference): preference is ContactColumnPreference =>
      preference != null &&
      typeof preference === 'object' &&
      typeof preference.key === 'string' &&
      typeof preference.enabled === 'boolean' &&
      typeof preference.order === 'number',
  );
}

const SAVED_REPORTS_KEY = CONTACTS_MODULE_CONTRACT.savedReportsObjectKey;
const PREFERENCES_KEY = CONTACTS_MODULE_CONTRACT.preferencesObjectKey;
const LEGACY_PREFERENCES_KEY = 'contact_prefs';

export async function loadContactPreferences(): Promise<ContactPreferences | null> {
  const raw = await fetchMigratedObject(PREFERENCES_KEY, LEGACY_PREFERENCES_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ContactPreferences;
}

export async function setUserColumnPreferences(userId: string, preferences: ContactColumnPreference[]): Promise<void> {
  const map = await loadColumnPreferencesMap();
  map[userId] = preferences;
  await persistObject(COLUMN_PREFERENCES_KEY, map);
}

async function fetchMigratedObject(key: string, legacyKey: string): Promise<unknown | null> {
  const current = await fetchObject(key);
  if (current != null) return current;
  const legacy = await fetchObject(legacyKey);
  if (legacy != null) {
    await persistObject(key, legacy);
  }
  return legacy;
}

async function loadColumnPreferencesMap(): Promise<UserModuleColumnPreferencesMap> {
  const raw = await fetchMigratedObject(COLUMN_PREFERENCES_KEY, LEGACY_COLUMN_PREFERENCES_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserModuleColumnPreferencesMap;
  }
  return {};
}

async function loadSavedReportsList(): Promise<ContactsSavedReport[]> {
  const raw = await fetchObject(SAVED_REPORTS_KEY);
  return Array.isArray(raw) ? (raw as ContactsSavedReport[]) : [];
}

async function saveSavedReportsList(reports: ContactsSavedReport[]): Promise<void> {
  await persistObject(SAVED_REPORTS_KEY, reports);
}

export async function listContactsSavedReports(viewer?: ContactsSavedReportViewer): Promise<ContactsSavedReport[]> {
  const all = await loadSavedReportsList();
  if (!viewer) return all;
  return all.filter((report) => canViewContactsSavedReport(report, viewer));
}

export async function createContactsSavedReport(
  input: Pick<
    ContactsSavedReport,
    'name' | 'drillDown' | 'createdBy' | 'createdByName' | 'shareScope' | 'sharedWithRoles' | 'sharedWithUserIds'
  >,
): Promise<ContactsSavedReport> {
  const reports = await loadSavedReportsList();
  const created: ContactsSavedReport = {
    ...input,
    shareScope: input.shareScope ?? 'private',
    id: `csr_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  reports.push(created);
  await saveSavedReportsList(reports);
  return created;
}

export async function deleteContactsSavedReport(id: string, viewer?: ContactsSavedReportViewer): Promise<boolean> {
  const reports = await loadSavedReportsList();
  const target = reports.find((r) => r.id === id);
  if (!target) return false;
  if (viewer && !canDeleteContactsSavedReport(target, viewer)) return false;
  const next = reports.filter((r) => r.id !== id);
  if (next.length === reports.length) return false;
  await saveSavedReportsList(next);
  return true;
}

export async function getContactsSavedReportById(id: string): Promise<ContactsSavedReport | null> {
  const reports = await loadSavedReportsList();
  return reports.find((r) => r.id === id) ?? null;
}

export async function touchContactsSavedReportRun(
  id: string,
  viewer?: ContactsSavedReportViewer,
): Promise<ContactsSavedReport | null> {
  const reports = await loadSavedReportsList();
  const index = reports.findIndex((report) => report.id === id);
  if (index < 0) return null;
  if (viewer && !canViewContactsSavedReport(reports[index], viewer)) return null;
  reports[index] = { ...reports[index], lastRunAt: new Date().toISOString() };
  await saveSavedReportsList(reports);
  return reports[index];
}
