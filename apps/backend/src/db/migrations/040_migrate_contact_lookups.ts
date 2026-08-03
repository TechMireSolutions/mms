import { and, eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { parseTenantScopedStorageKey } from '@mms/shared';
import {
  CONTACT_LOOKUP_KINDS,
  isContactLookupKind,
  type ContactLookupKind,
} from '@mms/shared';

function slugifyLabel(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'item'}-${index}`;
}

function normalizeStringItems(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string' && entry.trim()) {
      out.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const candidate =
        (typeof record.label === 'string' && record.label) ||
        (typeof record.name === 'string' && record.name) ||
        (typeof record.id === 'string' && record.id) ||
        '';
      if (candidate.trim()) out.push(candidate.trim());
    }
  }
  return out;
}

function normalizeCountryItems(raw: unknown): Array<{ country: string; code: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ country: string; code: string }> = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const country = typeof record.country === 'string' ? record.country.trim() : '';
    const code = typeof record.code === 'string' ? record.code.trim() : '';
    if (country && code) out.push({ country, code });
  }
  return out;
}

/** One-shot backfill: tenant `collections` lookup keys → typed `contact_lookups`. */
export async function runMigration040(): Promise<void> {
  const db = getDb();
  const rows = await db.select().from(schema.collections);
  let migratedTenants = 0;
  let insertedRows = 0;

  for (const row of rows) {
    const parsed = parseTenantScopedStorageKey(row.name);
    if (!parsed) continue;
    const kind = parsed.logicalKey;
    if (!isContactLookupKind(kind)) continue;
    const tenant = parsed.subdomain.trim().toLowerCase();
    if (!tenant) continue;

    const values =
      kind === 'countryCodes'
        ? normalizeCountryItems(row.data).map((entry, index) => ({
            id: `${tenant}:${kind}:${slugifyLabel(entry.country, index)}`,
            workspaceSubdomain: tenant,
            kind: kind as ContactLookupKind,
            label: entry.country,
            meta: { code: entry.code } as Record<string, unknown>,
            sortOrder: index,
            updatedAt: new Date(),
          }))
        : normalizeStringItems(row.data).map((label, index) => ({
            id: `${tenant}:${kind}:${slugifyLabel(label, index)}`,
            workspaceSubdomain: tenant,
            kind: kind as ContactLookupKind,
            label,
            meta: null as Record<string, unknown> | null,
            sortOrder: index,
            updatedAt: new Date(),
          }));

    if (values.length === 0) continue;

    const inserted = await withTenantTransaction(null, async (tx) => {
      const existing = await tx
        .select({ id: schema.contactLookups.id })
        .from(schema.contactLookups)
        .where(
          and(
            eq(schema.contactLookups.workspaceSubdomain, tenant),
            eq(schema.contactLookups.kind, kind),
          ),
        )
        .limit(1);
      if (existing.length > 0) return 0;

      await tx.insert(schema.contactLookups).values(values);
      return values.length;
    });

    if (inserted === 0) continue;

    insertedRows += inserted;
    migratedTenants += 1;
    console.log(
      `[Migration 040] Migrated ${inserted} "${kind}" lookup rows for tenant "${tenant}".`,
    );
  }

  if (migratedTenants === 0) {
    console.log(
      `[Migration 040] No contact lookup collections to migrate (kinds: ${CONTACT_LOOKUP_KINDS.join(', ')}).`,
    );
  } else {
    console.log(
      `[Migration 040] Done — ${insertedRows} rows across ${migratedTenants} tenant/kind batches.`,
    );
  }
}
