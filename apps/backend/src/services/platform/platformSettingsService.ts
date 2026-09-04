import type { PlatformSettings, PlatformSettingsUpdateInput } from '@mms/shared';
import { DEFAULT_PLATFORM_SETTINGS } from '@mms/shared';
import {
  findPlatformSettingsRow,
  insertPlatformSettingsDefaultRow,
  upsertPlatformSettingsRow,
} from '../../db/repositories/platformSettingsRepository.js';
import { logger } from '../../lib/logger.js';

let cachedPlatformSettings: PlatformSettings = { ...DEFAULT_PLATFORM_SETTINGS };

/**
 * Initializes the in-memory platform settings cache from PostgreSQL on server startup.
 * Creates the single 'global' row if it does not exist yet.
 */
export async function initPlatformSettings(): Promise<PlatformSettings> {
  try {
    const existing = await findPlatformSettingsRow();
    if (existing) {
      cachedPlatformSettings = existing;
    } else {
      const defaultSyncTls = process.env.MMS_SYNC_TLS_ON_CREATE !== 'false';
      const defaultTlsExtraSans = process.env.MMS_TLS_EXTRA_SANS?.trim() || '';
      const defaultCertbotEmail = process.env.MMS_CERTBOT_EMAIL?.trim() || '';

      const inserted = await insertPlatformSettingsDefaultRow({
        syncTlsOnCreate: defaultSyncTls,
        tlsExtraSans: defaultTlsExtraSans,
        certbotEmail: defaultCertbotEmail,
      });

      if (inserted) {
        cachedPlatformSettings = inserted;
      }
    }
  } catch (error) {
    logger.warn({ err: error }, 'Failed to initialize platform settings from database; using defaults');
  }

  return cachedPlatformSettings;
}

/**
 * Returns in-memory cached platform settings for fast access without DB lookups.
 * Returns a copy so callers cannot mutate the shared cache.
 */
export function getPlatformSettings(): PlatformSettings {
  return { ...cachedPlatformSettings };
}

/**
 * Updates platform settings in PostgreSQL and updates the in-memory cache instantly.
 */
export async function updatePlatformSettings(
  input: PlatformSettingsUpdateInput,
): Promise<PlatformSettings> {
  const current = getPlatformSettings();
  const next = await upsertPlatformSettingsRow(input, current);
  cachedPlatformSettings = next;
  return { ...cachedPlatformSettings };
}
