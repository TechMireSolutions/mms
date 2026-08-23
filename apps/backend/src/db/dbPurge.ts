import { WORKSPACES_COLLECTION } from '@mms/shared';
import { like, sql } from 'drizzle-orm';
import { getRequestTenant } from '../lib/tenantContext.js';
import { deleteAuthArtifactsForWorkspace } from '../services/auth/authArtifactService.js';
import { withTenant } from './tenant-context.js';
import {
  getQueryRows,
  saveCollection,
  saveObject,
} from './documentStore.js';
import { initDb } from './dbInit.js';
import { getMinimalCollectionsForSeed, getMinimalObjects } from './minimalSeeds.js';
import * as schema from './schema.js';

async function deleteTenantRowsByColumn(columnName: 'workspace_subdomain' | 'tenant_id', tenant: string): Promise<void> {
  await withTenant(tenant, async (tx) => {
    const result = await tx.execute(sql`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = ${columnName}
    `);
    const rows = getQueryRows<{ table_name: string }>(result);

    for (const row of rows) {
      await tx.execute(sql`
        DELETE FROM ${sql.raw(`"${row.table_name.replaceAll('"', '""')}"`)}
        WHERE ${sql.raw(`"${columnName}"`)} = ${tenant}
      `);
    }
  });
}

/**
 * Deletes all database rows scoped to a workspace subdomain.
 * Does not modify the global workspaces registry; platform deletion removes that separately.
 */
export async function purgeTenantDataBySubdomain(subdomain: string): Promise<void> {
  const tenant = subdomain.trim().toLowerCase();
  if (!tenant) {
    throw new Error('Subdomain is required to purge tenant data');
  }

  const prefix = `t:${tenant}:`;

  await withTenant(tenant, async (tx) => {
    await tx.delete(schema.collections).where(like(schema.collections.name, `${prefix}%`));
    await tx.delete(schema.objects).where(like(schema.objects.key, `${prefix}%`));
  });

  await deleteTenantRowsByColumn('tenant_id', tenant);
  await deleteTenantRowsByColumn('workspace_subdomain', tenant);
  await deleteAuthArtifactsForWorkspace(tenant);
}

/**
 * Resets only the current tenant's data and reseeds minimal defaults.
 */
export async function resetTenantData(): Promise<void> {
  const tenant = getRequestTenant();
  if (!tenant) {
    throw new Error('Tenant context is required to reset workspace data');
  }

  await purgeTenantDataBySubdomain(tenant);

  const collections = await getMinimalCollectionsForSeed();
  for (const [name, collectionItems] of Object.entries(collections)) {
    if (name === WORKSPACES_COLLECTION) continue;
    await saveCollection(name, collectionItems as unknown[]);
  }
  for (const [key, objectValue] of Object.entries(getMinimalObjects())) {
    await saveObject(key, objectValue);
  }
}

/**
 * Resets the entire database schema and reseeds the default data.
 * Tables are dropped in dependency-safe order.
 */
export async function resetDatabase(): Promise<void> {
  try {
    const tenant = getRequestTenant();
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
      `);
      await tx.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
    });
    await initDb();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
