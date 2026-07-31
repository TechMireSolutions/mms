import {
  CONTACTS_MODULE_MANIFEST,
  CONTACTS_SAVED_REPORT_CATEGORY,
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  type ContactColumnPreference,
  type ContactPreferences,
  type ContactsSavedReport,
  type ContactsSavedReportViewer,
  type ContactsWorkDrillDown,
  type GenericSavedReport,
} from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';
import {
  getUserColumnPreferencesForModule,
  setUserColumnPreferencesForModule,
} from './userColumnPreferencesService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  createPersistedSavedReport,
  deleteSavedReportById,
  findSavedReportById,
  listSavedReportsByCategory,
  touchSavedReportRunById,
} from '../db/repositories/savedReportsRepository.js';

const COLUMN_PREFERENCES_KEY = CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey;
const LEGACY_COLUMN_PREFERENCES_KEY = 'contact_user_column_prefs';

export async function getUserColumnPreferences(userId: string): Promise<ContactColumnPreference[]> {
  await fetchMigratedObject(COLUMN_PREFERENCES_KEY, LEGACY_COLUMN_PREFERENCES_KEY);
  return getUserColumnPreferencesForModule(COLUMN_PREFERENCES_KEY, userId) as Promise<ContactColumnPreference[]>;
}

const PREFERENCES_KEY = CONTACTS_MODULE_MANIFEST.preferencesObjectKey;
const LEGACY_PREFERENCES_KEY = 'contact_prefs';

export async function loadContactPreferences(): Promise<ContactPreferences | null> {
  const raw = await fetchMigratedObject(PREFERENCES_KEY, LEGACY_PREFERENCES_KEY);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ContactPreferences;
}

export async function setUserColumnPreferences(userId: string, preferences: ContactColumnPreference[]): Promise<void> {
  await fetchMigratedObject(COLUMN_PREFERENCES_KEY, LEGACY_COLUMN_PREFERENCES_KEY);
  await setUserColumnPreferencesForModule(COLUMN_PREFERENCES_KEY, userId, preferences);
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

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((entry): entry is string => typeof entry === 'string');
  return items.length > 0 ? items : undefined;
}

function toContactsSavedReport(row: GenericSavedReport): ContactsSavedReport {
  const filters = row.filters ?? {};
  const drillDown =
    filters.drillDown && typeof filters.drillDown === 'object' && !Array.isArray(filters.drillDown)
      ? (filters.drillDown as ContactsWorkDrillDown)
      : {};
  const shareScope = filters.shareScope;
  return {
    id: row.id,
    name: row.name,
    drillDown,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    lastRunAt: row.lastRun,
    shareScope:
      shareScope === 'private' || shareScope === 'roles' || shareScope === 'users' || shareScope === 'global'
        ? shareScope
        : 'private',
    sharedWithRoles: asStringArray(filters.sharedWithRoles),
    sharedWithUserIds: asStringArray(filters.sharedWithUserIds),
  };
}

function toFilters(report: Pick<
  ContactsSavedReport,
  'drillDown' | 'shareScope' | 'sharedWithRoles' | 'sharedWithUserIds'
>): Record<string, unknown> {
  return {
    drillDown: report.drillDown ?? {},
    shareScope: report.shareScope ?? 'private',
    sharedWithRoles: report.sharedWithRoles ?? [],
    sharedWithUserIds: report.sharedWithUserIds ?? [],
  };
}

export async function listContactsSavedReports(viewer?: ContactsSavedReportViewer): Promise<ContactsSavedReport[]> {
  const all = (await listSavedReportsByCategory(requireTenant(), CONTACTS_SAVED_REPORT_CATEGORY)).map(
    toContactsSavedReport,
  );
  if (!viewer) return all;
  return all.filter((report) => canViewContactsSavedReport(report, viewer));
}

export async function createContactsSavedReport(
  input: Pick<
    ContactsSavedReport,
    'name' | 'drillDown' | 'createdBy' | 'createdByName' | 'shareScope' | 'sharedWithRoles' | 'sharedWithUserIds'
  >,
): Promise<ContactsSavedReport> {
  const created = await createPersistedSavedReport(requireTenant(), {
    id: `csr_${crypto.randomUUID()}`,
    name: input.name,
    category: CONTACTS_SAVED_REPORT_CATEGORY,
    filters: toFilters(input),
    createdBy: input.createdBy,
    createdByName: input.createdByName ?? '',
  });
  return toContactsSavedReport(created);
}

export async function deleteContactsSavedReport(id: string, viewer?: ContactsSavedReportViewer): Promise<boolean> {
  const tenant = requireTenant();
  const existing = await findSavedReportById(tenant, id, CONTACTS_SAVED_REPORT_CATEGORY);
  if (!existing) return false;
  const report = toContactsSavedReport(existing);
  if (viewer && !canDeleteContactsSavedReport(report, viewer)) return false;
  return deleteSavedReportById(tenant, id, CONTACTS_SAVED_REPORT_CATEGORY);
}

export async function getContactsSavedReportById(id: string): Promise<ContactsSavedReport | null> {
  const existing = await findSavedReportById(requireTenant(), id, CONTACTS_SAVED_REPORT_CATEGORY);
  return existing ? toContactsSavedReport(existing) : null;
}

export async function touchContactsSavedReportRun(
  id: string,
  viewer?: ContactsSavedReportViewer,
): Promise<ContactsSavedReport | null> {
  const tenant = requireTenant();
  const existing = await findSavedReportById(tenant, id, CONTACTS_SAVED_REPORT_CATEGORY);
  if (!existing) return null;
  const report = toContactsSavedReport(existing);
  if (viewer && !canViewContactsSavedReport(report, viewer)) return null;
  const updated = await touchSavedReportRunById(tenant, id, CONTACTS_SAVED_REPORT_CATEGORY);
  return updated ? toContactsSavedReport(updated) : null;
}
