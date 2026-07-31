import { describe, it, expect } from 'vitest';
import { platformSettingsUpdateSchema, resetDatabaseSchema, RESET_DATABASE_CONFIRM } from '../platformSettingsTypes.js';

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
    it('accepts exact confirmation string with password', () => {
      const valid = { confirm: RESET_DATABASE_CONFIRM, password: 'secret' };
      const result = resetDatabaseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing password', () => {
      const invalid = { confirm: RESET_DATABASE_CONFIRM };
      const result = resetDatabaseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid confirmation string', () => {
      const invalid = { confirm: 'RESET', password: 'secret' };
      const result = resetDatabaseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
