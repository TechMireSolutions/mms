import { describe, expect, it } from 'vitest';
import { buildDeviceSmsUri } from '../smsUtils.js';

describe('smsUtils', () => {
  describe('buildDeviceSmsUri', () => {
    it('returns null for empty or invalid phone numbers', () => {
      expect(buildDeviceSmsUri('')).toBeNull();
      expect(buildDeviceSmsUri('   ')).toBeNull();
      expect(buildDeviceSmsUri('123')).toBeNull(); // Less than 8 digits
    });

    it('builds a clean sms URI without message body', () => {
      expect(buildDeviceSmsUri('+92 300 1234567')).toBe('sms:+923001234567');
      expect(buildDeviceSmsUri('0300 1234567')).toBe('sms:03001234567');
    });

    it('builds a sms URI with URL encoded message body', () => {
      const uri = buildDeviceSmsUri('+923001234567', 'Assalamu Alaikum! Your fee is due.');
      expect(uri).toBe('sms:+923001234567?body=Assalamu%20Alaikum!%20Your%20fee%20is%20due.');
    });
  });
});
