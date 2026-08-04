import { z } from 'zod';

export interface PlatformSettings {
  id: string;
  syncTlsOnCreate: boolean;
  tlsExtraSans: string;
  certbotEmail: string;
  updatedAt?: string;
}

export const platformSettingsUpdateSchema = z.object({
  syncTlsOnCreate: z.boolean().optional(),
  tlsExtraSans: z.string().optional(),
  certbotEmail: z.string().email('Valid email address required').or(z.literal('')).optional(),
});

export type PlatformSettingsUpdateInput = z.infer<typeof platformSettingsUpdateSchema>;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 'global',
  syncTlsOnCreate: true,
  tlsExtraSans: '',
  certbotEmail: '',
};

export const RESET_DATABASE_CONFIRM = 'RESET_ALL_DATABASE_DATA' as const;

export const resetDatabaseSchema = z.object({
  confirm: z.literal(RESET_DATABASE_CONFIRM, {
    message: `Confirmation string must be "${RESET_DATABASE_CONFIRM}"`,
  }),
  password: z.string().min(1),
});

export type ResetDatabaseInput = z.infer<typeof resetDatabaseSchema>;

/** Confirmation token for platform super-user migrate + process reload. */
export const MIGRATE_AND_RESTART_CONFIRM = 'MIGRATE_AND_RESTART' as const;

/**
 * Body for `POST /api/platform/admin/system/migrate-and-restart`.
 * Requires current platform password step-up (same pattern as database reset).
 */
export const migrateAndRestartSchema = z
  .object({
    confirm: z.literal(MIGRATE_AND_RESTART_CONFIRM, {
      message: `Confirmation string must be "${MIGRATE_AND_RESTART_CONFIRM}"`,
    }),
    password: z.string().min(1),
  })
  .strict();

export type MigrateAndRestartInput = z.infer<typeof migrateAndRestartSchema>;

/** Success body for `POST /api/platform/admin/system/migrate-and-restart`. */
export interface MigrateAndRestartAccepted {
  success: true;
  accepted: true;
  message: string;
  delayMs: number;
}

