import {
  CONTACTS_MODULE_CONTRACT,
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  type ContactColumnPref,
  type ContactPreferences,
  type ContactsSavedReport,
  type ContactsSavedReportViewer,
} from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';
import {
  getUserColumnPrefsForModule,
  setUserColumnPrefsForModule,
} from './userColumnPrefsService.js';

const COLUMN_PREFS_KEY = CONTACTS_MODULE_CONTRACT.columnPrefsObjectKey;

export async function getUserColumnPrefs(userId: string): Promise<ContactColumnPref[]> {
  return getUserColumnPrefsForModule(COLUMN_PREFS_KEY, userId);
}

const SAVED_REPORTS_KEY = CONTACTS_MODULE_CONTRACT.savedReportsObjectKey;
const PREFS_KEY = CONTACTS_MODULE_CONTRACT.prefsObjectKey;

export async function loadContactPrefs(): Promise<ContactPreferences | null> {
  const raw = await fetchObject(PREFS_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ContactPreferences;
}

export async function setUserColumnPrefs(userId: string, prefs: ContactColumnPref[]): Promise<void> {
  await setUserColumnPrefsForModule(COLUMN_PREFS_KEY, userId, prefs);
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
  const idx = reports.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  if (viewer && !canViewContactsSavedReport(reports[idx], viewer)) return null;
  reports[idx] = { ...reports[idx], lastRunAt: new Date().toISOString() };
  await saveSavedReportsList(reports);
  return reports[idx];
}
