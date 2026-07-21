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

export const resetDatabaseSchema = z.object({
  confirm: z.literal('RESET_ALL_DATABASE_DATA', {
    message: 'Confirmation string must be "RESET_ALL_DATABASE_DATA"',
  }),
});

export type ResetDatabaseInput = z.infer<typeof resetDatabaseSchema>;

