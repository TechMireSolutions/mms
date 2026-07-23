import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  WORKSPACES_COLLECTION,
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  tenantObjectKey,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  getObjectByStorageKey,
  listCollectionStorageNames,
  saveCollection,
  saveObject,
} from '../database.js';

const STUDENTS_COLLECTION = 'students';
const TEACHERS_COLLECTION = 'teachers';
const CONTACTS_COLLECTION = 'contacts';
const STUDENTS_SETTINGS_KEY = 'students_settings';
const TEACHERS_SETTINGS_KEY = 'teachers_settings';

async function discoverTenantSubdomains(): Promise<Set<string>> {
  const subdomains = new Set<string>();
  const names = await listCollectionStorageNames();
  for (const name of names) {
    const parsed = parseTenantScopedStorageKey(name);
    if (parsed) subdomains.add(parsed.subdomain);
  }

  const workspaces = await getCollectionByStorageName(WORKSPACES_COLLECTION);
  if (Array.isArray(workspaces)) {
    for (const entry of workspaces) {
      const subdomain = (entry as Workspace).subdomain;
      if (subdomain) subdomains.add(subdomain);
    }
  }

  return subdomains;
}

async function expandTenantRoster(
  studentsKey: string,
  teachersKey: string,
  contactsKey: string,
  studentsSettingsKey: string,
  teachersSettingsKey: string,
): Promise<boolean> {
  let changed = false;

  const existingStudents = await getCollectionByStorageName(studentsKey);
  if (!Array.isArray(existingStudents)) {
    await saveCollection(studentsKey, []);
    changed = true;
  }

  const existingTeachers = await getCollectionByStorageName(teachersKey);
  if (!Array.isArray(existingTeachers)) {
    await saveCollection(teachersKey, []);
    changed = true;
  }

  const existingContacts = await getCollectionByStorageName(contactsKey);
  if (!Array.isArray(existingContacts)) {
    await saveCollection(contactsKey, []);
    changed = true;
  }

  if ((await getObjectByStorageKey(studentsSettingsKey)) === null) {
    await saveObject(studentsSettingsKey, DEFAULT_STUDENTS_SETTINGS);
    changed = true;
  }

  if ((await getObjectByStorageKey(teachersSettingsKey)) === null) {
    await saveObject(teachersSettingsKey, DEFAULT_TEACHERS_SETTINGS);
    changed = true;
  }

  return changed;
}

/**
 * Expands minimal demo rosters to {@link DEMO_STUDENT_COUNT} students and
 * {@link DEMO_TEACHER_COUNT} teachers (with linked contacts).
 */
export async function runMigration011(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  if (subdomains.size === 0) {
    if (
      await expandTenantRoster(
        STUDENTS_COLLECTION,
        TEACHERS_COLLECTION,
        CONTACTS_COLLECTION,
        STUDENTS_SETTINGS_KEY,
        TEACHERS_SETTINGS_KEY,
      )
    ) {
      console.log('[Migration 011] Expanded demo roster (legacy storage)');
      changed = true;
    }
  } else {
    for (const subdomain of subdomains) {
      if (
        await expandTenantRoster(
          tenantCollectionKey(subdomain, STUDENTS_COLLECTION),
          tenantCollectionKey(subdomain, TEACHERS_COLLECTION),
          tenantCollectionKey(subdomain, CONTACTS_COLLECTION),
          tenantObjectKey(subdomain, STUDENTS_SETTINGS_KEY),
          tenantObjectKey(subdomain, TEACHERS_SETTINGS_KEY),
        )
      ) {
        console.log(`[Migration 011] Expanded demo roster for tenant "${subdomain}"`);
        changed = true;
      }
    }
  }

  if (changed) {
    console.log('[Migration 011] Demo roster expansion completed.');
  }
}
