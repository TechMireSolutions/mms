import { applyTitleCaseRecursive, parseTenantScopedStorageKey } from '@mms/shared';
import { eq, sql } from 'drizzle-orm';
import { getRequestTenant } from '../lib/tenantContext.js';
import { activeDb } from './dbConnection.js';
import { RELATIONAL_REPLACE_MAPPING } from './relationalReplaceMapping.js';
import * as schema from './schema.js';
import { getQueryRows, resolveCollectionStorageName } from './documentStoreKeys.js';

export async function getCollection(name: string): Promise<unknown[] | null> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const rows = await activeDb().select().from(schema.collections).where(eq(schema.collections.name, storageName));
    const row = rows[0];
    if (!row) return null;
    return row.data;
  } catch (error) {
    console.error(`Error getting collection "${name}":`, error);
    throw error;
  }
}

export async function getCollectionForUpdate(name: string): Promise<unknown[] | null> {
  try {
    const storageName = resolveCollectionStorageName(name);
    await activeDb().insert(schema.collections)
      .values({ name: storageName, data: [] })
      .onConflictDoNothing();
    const result = await activeDb().execute(sql`
      SELECT data
      FROM collections
      WHERE name = ${storageName}
      FOR UPDATE
    `);
    const row = getQueryRows<{ data: unknown[] }>(result)[0];
    return row?.data ?? null;
  } catch (error) {
    console.error(`Error locking collection "${name}":`, error);
    throw error;
  }
}

export type SaveCollectionOptions = {
  /**
   * Admin sync/restore only. When true, wipe+replace mirrored relational tables
   * for REST-migrated collection keys. Ordinary JSON document writes must leave
   * this unset so client collection POSTs cannot wipe table-backed rows.
   */
  mirrorRelationalReplace?: boolean;
};

export async function saveCollection(
  name: string,
  data: unknown[],
  options: SaveCollectionOptions = {},
): Promise<void> {
  try {
    const storageName = resolveCollectionStorageName(name);
    const processedData = applyTitleCaseRecursive(data) as unknown[];
    await activeDb().insert(schema.collections)
      .values({ name: storageName, data: processedData })
      .onConflictDoUpdate({
        target: schema.collections.name,
        set: { data: processedData },
      });

    if (options.mirrorRelationalReplace) {
      const parsed = parseTenantScopedStorageKey(storageName);
      if (parsed) {
        const mapping = RELATIONAL_REPLACE_MAPPING[parsed.logicalKey];
        if (mapping) {
          const repoModule = await import(mapping.importPath);
          const replaceFn = repoModule[mapping.fnName];
          if (typeof replaceFn !== 'function') {
            throw new Error(
              `Relational replace helper "${mapping.fnName}" missing for collection "${parsed.logicalKey}"`,
            );
          }
          await replaceFn(parsed.subdomain, processedData);
        }
      }
    }

    const tenant = getRequestTenant();
    if (tenant) {
      const { broadcastTenantUpdate } = await import('../services/websocketService.js');
      broadcastTenantUpdate(tenant, 'collection', name);
    }
  } catch (error) {
    console.error(`Error saving collection "${name}":`, error);
    throw error;
  }
}
