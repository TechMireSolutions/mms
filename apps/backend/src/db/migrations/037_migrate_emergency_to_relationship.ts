import {
  migrateEmergencyTabToRelationship,
  parseTenantScopedStorageKey,
  type FieldConfig,
} from '@mms/shared';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

/**
 * Renames contact JSONB `emergencyContacts` → `relationshipContacts` and remaps
 * persisted contact field-config emergency tab keys to relationship.
 */
export async function runMigration037(): Promise<void> {
  const db = getDb();

  await withTenantTransaction(null, async (tx) => {
    await tx.execute(sql`
      UPDATE contacts
      SET
        custom_data = (custom_data - 'emergencyContacts')
          || jsonb_build_object(
            'relationshipContacts',
            COALESCE(custom_data->'relationshipContacts', custom_data->'emergencyContacts')
          ),
        updated_at = NOW()
      WHERE custom_data ? 'emergencyContacts'
    `);
  });

  const objectRows = await db.select().from(schema.objects);
  let configCount = 0;

  for (const row of objectRows) {
    const parsed = parseTenantScopedStorageKey(row.key);
    const logicalKey = parsed?.logicalKey ?? row.key;
    if (logicalKey !== 'contact_field_config') continue;
    if (!row.data || typeof row.data !== 'object' || Array.isArray(row.data)) continue;

    const config = row.data as FieldConfig;
    const migrated = migrateEmergencyTabToRelationship(config);
    if (JSON.stringify(config) === JSON.stringify(migrated)) continue;

    await db.update(schema.objects).set({ data: migrated }).where(eq(schema.objects.key, row.key));
    configCount += 1;
  }

  if (configCount > 0) {
    console.log(`[Migration 037] Remapped contact field config for ${configCount} tenants.`);
  }
}
