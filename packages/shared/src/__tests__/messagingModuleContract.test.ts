import { describe, expect, it } from 'vitest';
import {
  MESSAGING_MODULE_CONTRACT,
  MESSAGING_ROLE_OPTIONS,
  MESSAGING_GENDER_OPTIONS,
  MESSAGING_STATUS_OPTIONS,
  getChannelBadgeStyle,
  getChannelLabelKey,
  toMessagingRecipient,
} from '../messagingModuleContract.js';

describe('messagingModuleContract', () => {
  it('defines the correct module contract metadata and tiers', () => {
    expect(MESSAGING_MODULE_CONTRACT.moduleId).toBe('messaging');
    expect(MESSAGING_MODULE_CONTRACT.entityType).toBe('Message');
    expect(MESSAGING_MODULE_CONTRACT.restBasePath).toBe('/api/messaging');
    expect(MESSAGING_MODULE_CONTRACT.tiers).toEqual(['work', 'reports', 'setup']);
  });

  it('contains expected contract options mapping to i18n keys', () => {
    expect(MESSAGING_ROLE_OPTIONS).toEqual(
      expect.arrayContaining([
        { value: 'all', labelKey: 'messaging.role.all' },
        { value: 'students', labelKey: 'messaging.role.students' },
        { value: 'teachers', labelKey: 'messaging.role.teachers' },
      ])
    );

    expect(MESSAGING_GENDER_OPTIONS).toEqual(
      expect.arrayContaining([
        { value: 'all', labelKey: 'messaging.gender.all' },
        { value: 'male', labelKey: 'messaging.gender.male' },
      ])
    );

    expect(MESSAGING_STATUS_OPTIONS).toEqual(
      expect.arrayContaining([
        { value: 'all', labelKey: 'messaging.status.all' },
        { value: 'sent', labelKey: 'messaging.status.sent' },
        { value: 'delivered', labelKey: 'messaging.status.delivered' },
      ])
    );
  });

  it('resolves correct badge style for channel types', () => {
    expect(getChannelBadgeStyle('email')).toContain('text-warning');
    expect(getChannelBadgeStyle('sms')).toContain('text-info');
    expect(getChannelBadgeStyle('whatsapp')).toContain('text-success');
    expect(getChannelBadgeStyle('unknown')).toContain('text-success');
  });

  it('returns appropriate i18n label keys for channels', () => {
    expect(getChannelLabelKey('sms')).toBe('messaging.channel.sms');
    expect(getChannelLabelKey('whatsapp')).toBe('messaging.channel.whatsapp');
  });

  it('converts objects into standardized messaging recipients via toMessagingRecipient', () => {
    const rawContact = { id: 101, name: 'Aisha Ahmed', phone: '+923001234567', email: 'aisha@example.com' };
    const converted = toMessagingRecipient(rawContact, {
      getDisplayName: (c) => c.name,
      getPrimaryPhone: (c) => c.phone,
      getPrimaryEmail: (c) => c.email,
    });

    expect(converted).toEqual({
      id: 101,
      name: 'Aisha Ahmed',
      phone: '+923001234567',
      email: 'aisha@example.com',
    });
  });
});

