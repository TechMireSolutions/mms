import {
  CONTACTS_SAVED_REPORT_CATEGORY,
  LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS,
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  deriveRelationshipOptionsFromPairs,
  normalizeContactPreferences,
  type ContactColumnPreference,
  type ContactPreferences,
  type ContactsSavedReport,
  type ContactsSavedReportViewer,
  type ContactsWorkDrillDown,
  type FieldConfig,
  type FieldDefinition,
  type GenericSavedReport,
  type ModuleColumnPreference,
  type RelationshipPair,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getContactModulePreferencesByWorkspace,
  upsertContactModulePreferences,
} from '../db/repositories/contactModulePreferencesRepository.js';
import {
  getContactUserColumnPrefs,
  setContactUserColumnPrefs,
} from '../db/repositories/contactUserColumnPrefsRepository.js';
import {
  createPersistedSavedReport,
  deleteSavedReportById,
  findSavedReportById,
  listSavedReportsByCategory,
  touchSavedReportRunById,
} from '../db/repositories/savedReportsRepository.js';
import { loadContactFieldConfig, saveContactFieldConfig } from './contactConfigService.js';
import { loadContactLookupKind, replaceContactLookupKind } from './contactLookupsService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

function filterColumnPreferences(preferences: unknown[]): ModuleColumnPreference[] {
  return preferences.filter(
    (preference): preference is ModuleColumnPreference =>
      preference != null &&
      typeof preference === 'object' &&
      typeof (preference as ModuleColumnPreference).key === 'string' &&
      typeof (preference as ModuleColumnPreference).enabled === 'boolean' &&
      typeof (preference as ModuleColumnPreference).order === 'number',
  );
}

function rawHadLegacyRelationshipPairs(raw: Record<string, unknown>): boolean {
  const pairs = raw.relationshipPairs;
  if (!Array.isArray(pairs)) return false;
  return pairs.some(
    (pair) =>
      pair != null &&
      typeof pair === 'object' &&
      typeof (pair as RelationshipPair).id === 'string' &&
      LEGACY_BUILTIN_RELATIONSHIP_PAIR_IDS.has((pair as RelationshipPair).id as string),
  );
}

function relationshipLabelListsMatch(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const rightKeys = new Set(right.map((label) => label.trim().toLowerCase()));
  if (rightKeys.size !== left.length) return false;
  return left.every((label) => rightKeys.has(label.trim().toLowerCase()));
}

function syncRelationshipOptionsInFieldConfig(
  config: FieldConfig,
  options: string[],
): FieldConfig {
  const tabFields = config.fields?.relationship;
  if (!Array.isArray(tabFields)) return config;
  let changed = false;
  const nextFields: FieldDefinition[] = tabFields.map((field) => {
    if (field.key !== 'relationship') return field;
    const current = Array.isArray(field.options) ? field.options : [];
    if (relationshipLabelListsMatch(current, options)) return field;
    changed = true;
    return { ...field, options };
  });
  if (!changed) return config;
  return {
    ...config,
    fields: {
      ...config.fields,
      relationship: nextFields,
    },
  };
}

/** Align lookups + field-config options with pair-derived relationship labels. */
async function syncRelationshipMirrorsFromPairs(
  pairs: RelationshipPair[] | undefined,
): Promise<void> {
  const labels = deriveRelationshipOptionsFromPairs(pairs ?? []);
  const currentLookups = await loadContactLookupKind('relationships');
  const lookupLabels = Array.isArray(currentLookups)
    ? currentLookups.filter((entry): entry is string => typeof entry === 'string')
    : [];
  if (!relationshipLabelListsMatch(lookupLabels, labels)) {
    await replaceContactLookupKind('relationships', labels);
  }

  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) return;
  const synced = syncRelationshipOptionsInFieldConfig(fieldConfig, labels);
  if (synced !== fieldConfig) {
    await saveContactFieldConfig(synced);
  }
}

export async function getUserColumnPreferences(userId: string): Promise<ContactColumnPreference[]> {
  const prefs = await getContactUserColumnPrefs(requireTenant(), userId);
  return filterColumnPreferences(prefs) as ContactColumnPreference[];
}

export async function loadContactPreferences(): Promise<ContactPreferences | null> {
  const raw = await getContactModulePreferencesByWorkspace(requireTenant());
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const normalized = normalizeContactPreferences(record as Partial<ContactPreferences>);
  // One-shot: drop former built-in pairs from stored prefs.
  if (rawHadLegacyRelationshipPairs(record)) {
    await upsertContactModulePreferences(
      requireTenant(),
      normalized as unknown as Record<string, unknown>,
    );
  }
  // Align lookups + field-config options with pair-derived labels (purges stale seeds).
  await syncRelationshipMirrorsFromPairs(normalized.relationshipPairs);
  return normalized;
}

export async function saveContactPreferences(
  preferences: ContactPreferences,
): Promise<ContactPreferences> {
  const normalized = normalizeContactPreferences(preferences);
  await upsertContactModulePreferences(requireTenant(), normalized as unknown as Record<string, unknown>);
  await syncRelationshipMirrorsFromPairs(normalized.relationshipPairs);
  return normalized;
}

export async function setUserColumnPreferences(
  userId: string,
  preferences: ContactColumnPreference[],
): Promise<void> {
  await setContactUserColumnPrefs(requireTenant(), userId, preferences);
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
