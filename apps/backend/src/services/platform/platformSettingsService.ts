import { eq } from 'drizzle-orm';
import type { PlatformSettings, PlatformSettingsUpdateInput } from '@mms/shared';
import { DEFAULT_PLATFORM_SETTINGS } from '@mms/shared';
import { getDb } from '../../db/dbClient.js';
import { platformSettings } from '../../db/schema.js';

const GLOBAL_SETTINGS_ID = 'global';

let cachedPlatformSettings: PlatformSettings = { ...DEFAULT_PLATFORM_SETTINGS };

/**
 * Initializes the in-memory platform settings cache from PostgreSQL on server startup.
 * Creates the single 'global' row if it does not exist yet.
 */
export async function initPlatformSettings(): Promise<PlatformSettings> {
  const db = getDb();
  try {
    const rows = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, GLOBAL_SETTINGS_ID))
      .limit(1);

    if (rows.length > 0 && rows[0]) {
      const row = rows[0];
      cachedPlatformSettings = {
        id: row.id,
        syncTlsOnCreate: row.syncTlsOnCreate,
        tlsExtraSans: row.tlsExtraSans,
        certbotEmail: row.certbotEmail,
        updatedAt: row.updatedAt?.toISOString(),
      };
    } else {
      const defaultSyncTls = process.env.MMS_SYNC_TLS_ON_CREATE !== 'false';
      const defaultTlsExtraSans = process.env.MMS_TLS_EXTRA_SANS?.trim() || '';
      const defaultCertbotEmail = process.env.MMS_CERTBOT_EMAIL?.trim() || '';

      const inserted = await db
        .insert(platformSettings)
        .values({
          id: GLOBAL_SETTINGS_ID,
          syncTlsOnCreate: defaultSyncTls,
          tlsExtraSans: defaultTlsExtraSans,
          certbotEmail: defaultCertbotEmail,
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (inserted.length > 0 && inserted[0]) {
        const row = inserted[0];
        cachedPlatformSettings = {
          id: row.id,
          syncTlsOnCreate: row.syncTlsOnCreate,
          tlsExtraSans: row.tlsExtraSans,
          certbotEmail: row.certbotEmail,
          updatedAt: row.updatedAt?.toISOString(),
        };
      }
    }
  } catch (error) {
    console.warn('Failed to initialize platform settings from database; using defaults:', error);
  }

  return cachedPlatformSettings;
}

/**
 * Returns in-memory cached platform settings for fast access without DB lookups.
 */
export function getPlatformSettings(): PlatformSettings {
  return cachedPlatformSettings;
}

/**
 * Updates platform settings in PostgreSQL and updates the in-memory cache instantly.
 */
export async function updatePlatformSettings(
  input: PlatformSettingsUpdateInput,
): Promise<PlatformSettings> {
  const db = getDb();
  const current = getPlatformSettings();

  const syncTlsOnCreate = input.syncTlsOnCreate ?? current.syncTlsOnCreate;
  const tlsExtraSans = input.tlsExtraSans !== undefined ? input.tlsExtraSans.trim() : current.tlsExtraSans;
  const certbotEmail = input.certbotEmail !== undefined ? input.certbotEmail.trim() : current.certbotEmail;
  const updatedAt = new Date();

  await db
    .insert(platformSettings)
    .values({
      id: GLOBAL_SETTINGS_ID,
      syncTlsOnCreate,
      tlsExtraSans,
      certbotEmail,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        syncTlsOnCreate,
        tlsExtraSans,
        certbotEmail,
        updatedAt,
      },
    });

  cachedPlatformSettings = {
    id: GLOBAL_SETTINGS_ID,
    syncTlsOnCreate,
    tlsExtraSans,
    certbotEmail,
    updatedAt: updatedAt.toISOString(),
  };

  return cachedPlatformSettings;
}
