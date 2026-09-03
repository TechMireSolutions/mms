import { eq } from 'drizzle-orm';
import type { PlatformSettings, PlatformSettingsUpdateInput } from '@mms/shared';
import { activeDb } from '../dbConnection.js';
import { platformSettings } from '../schema.js';

export const GLOBAL_SETTINGS_ID = 'global';

function rowToPlatformSettings(row: typeof platformSettings.$inferSelect): PlatformSettings {
  return {
    id: row.id,
    syncTlsOnCreate: row.syncTlsOnCreate,
    tlsExtraSans: row.tlsExtraSans,
    certbotEmail: row.certbotEmail,
    updatedAt: row.updatedAt?.toISOString(),
  };
}

export async function findPlatformSettingsRow(id = GLOBAL_SETTINGS_ID): Promise<PlatformSettings | null> {
  const rows = await activeDb()
    .select({
      id: platformSettings.id,
      syncTlsOnCreate: platformSettings.syncTlsOnCreate,
      tlsExtraSans: platformSettings.tlsExtraSans,
      certbotEmail: platformSettings.certbotEmail,
      updatedAt: platformSettings.updatedAt,
    })
    .from(platformSettings)
    .where(eq(platformSettings.id, id))
    .limit(1);

  return rows[0] ? rowToPlatformSettings(rows[0]) : null;
}

export async function insertPlatformSettingsDefaultRow(defaults: {
  id?: string;
  syncTlsOnCreate: boolean;
  tlsExtraSans: string;
  certbotEmail: string;
}): Promise<PlatformSettings | null> {
  const inserted = await activeDb()
    .insert(platformSettings)
    .values({
      id: defaults.id || GLOBAL_SETTINGS_ID,
      syncTlsOnCreate: defaults.syncTlsOnCreate,
      tlsExtraSans: defaults.tlsExtraSans,
      certbotEmail: defaults.certbotEmail,
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  return inserted[0] ? rowToPlatformSettings(inserted[0]) : null;
}

export async function upsertPlatformSettingsRow(
  input: PlatformSettingsUpdateInput,
  current: PlatformSettings,
  id = GLOBAL_SETTINGS_ID,
): Promise<PlatformSettings> {
  const syncTlsOnCreate = input.syncTlsOnCreate ?? current.syncTlsOnCreate;
  const tlsExtraSans = input.tlsExtraSans !== undefined ? input.tlsExtraSans.trim() : current.tlsExtraSans;
  const certbotEmail = input.certbotEmail !== undefined ? input.certbotEmail.trim() : current.certbotEmail;
  const updatedAt = new Date();

  await activeDb()
    .insert(platformSettings)
    .values({
      id,
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

  return {
    id,
    syncTlsOnCreate,
    tlsExtraSans,
    certbotEmail,
    updatedAt: updatedAt.toISOString(),
  };
}
