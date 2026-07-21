import { describe, expect, it } from 'vitest';
import { platformSettingsUpdateSchema, resetDatabaseSchema } from '../platformSettingsTypes.js';

describe('platformSettingsValidation', () => {
  describe('platformSettingsUpdateSchema', () => {
    it('validates correct update payloads', () => {
      const valid = {
        syncTlsOnCreate: true,
        tlsExtraSans: '*.madrasa.com',
        certbotEmail: 'admin@madrasa.com',
      };
      const result = platformSettingsUpdateSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(valid);
      }
    });

    it('accepts empty certbot email or empty payload', () => {
      const emptyEmail = { certbotEmail: '' };
      const emptyPayload = {};

      expect(platformSettingsUpdateSchema.safeParse(emptyEmail).success).toBe(true);
      expect(platformSettingsUpdateSchema.safeParse(emptyPayload).success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const invalid = { certbotEmail: 'not-an-email' };
      const result = platformSettingsUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('resetDatabaseSchema', () => {
    it('accepts exact confirmation string RESET_ALL_DATABASE_DATA', () => {
      const valid = { confirm: 'RESET_ALL_DATABASE_DATA' };
      const result = resetDatabaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid confirmation string', () => {
      const invalid = { confirm: 'RESET' };
      const result = resetDatabaseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
