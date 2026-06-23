import {
  parseTenantScopedStorageKey,
  tenantCollectionKey,
  WORKSPACES_COLLECTION,
  type Workspace,
} from '@mms/shared';
import {
  getCollectionByStorageName,
  listCollectionStorageNames,
  saveCollection,
} from '../database.js';

const OVERDUE_OBLIGATIONS_COLLECTION = 'overdue_obligations';

const DEFAULT_OVERDUE_STUDENTS = [
  { id: 1, name: "Ahmad Raza",       obligationType: "Khums",   dueDate: "2026-04-01", amount: 12000, currency: "PKR", daysOverdue: 48 },
  { id: 2, name: "Fatima Noor",      obligationType: "Zakat",   dueDate: "2026-04-10", amount: 8500,  currency: "PKR", daysOverdue: 39 },
  { id: 3, name: "Hassan Ali",       obligationType: "Khums",   dueDate: "2026-04-15", amount: 30000, currency: "PKR", daysOverdue: 34 },
  { id: 4, name: "Zainab Hussain",   obligationType: "Fidya",   dueDate: "2026-04-22", amount: 3200,  currency: "PKR", daysOverdue: 27 },
  { id: 5, name: "Ibrahim Khalid",   obligationType: "Kaffarah",dueDate: "2026-04-28", amount: 15000, currency: "PKR", daysOverdue: 21 },
  { id: 6, name: "Maryam Tahir",     obligationType: "Zakat",   dueDate: "2026-05-01", amount: 6000,  currency: "PKR", daysOverdue: 18 },
  { id: 7, name: "Ali Mustafa",      obligationType: "Khums",   dueDate: "2026-05-05", amount: 22500, currency: "PKR", daysOverdue: 14 },
  { id: 8, name: "Sara Jaffery",     obligationType: "Fidya",   dueDate: "2026-05-10", amount: 1800,  currency: "PKR", daysOverdue: 9  },
];

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

async function seedOverdueObligationsForPrefix(prefix: string): Promise<boolean> {
  const storageName = prefix ? `${prefix}${OVERDUE_OBLIGATIONS_COLLECTION}` : OVERDUE_OBLIGATIONS_COLLECTION;
  const existing = await getCollectionByStorageName(storageName);
  if (Array.isArray(existing) && existing.length > 0) return false;
  await saveCollection(storageName, DEFAULT_OVERDUE_STUDENTS);
  return true;
}

/**
 * Backfills database-owned Overdue Obligations data for existing SQLite/PostgreSQL tenants.
 */
export async function runMigration018(): Promise<void> {
  const subdomains = await discoverTenantSubdomains();
  let changed = false;

  if (subdomains.size === 0) {
    changed = await seedOverdueObligationsForPrefix('');
  } else {
    for (const subdomain of subdomains) {
      const didChange = await seedOverdueObligationsForPrefix(tenantCollectionKey(subdomain, ''));
      changed = changed || didChange;
    }
  }

  if (changed) {
    console.log('[Migration 018] Seeded database-owned overdue obligations defaults.');
  }
}
