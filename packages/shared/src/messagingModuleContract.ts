import type { Permission } from './permissions.js';
import { MESSAGE_CATEGORIES, MESSAGE_CHANNELS, MESSAGE_CATEGORY_OPTIONS, MESSAGE_CHANNEL_OPTIONS } from './messagingSchemas.js';

export const MESSAGING_ROLE_FILTERS = ['all', 'students', 'teachers', 'staff', 'contacts'] as const;
export const MESSAGING_GENDER_FILTERS = ['all', 'male', 'female', 'unspecified'] as const;
export const MESSAGING_STATUS_FILTERS = ['all', 'sent', 'delivered', 'failed', 'skipped'] as const;

export type MessagingRoleFilter = (typeof MESSAGING_ROLE_FILTERS)[number];
export type MessagingGenderFilter = (typeof MESSAGING_GENDER_FILTERS)[number];
export type MessagingStatusFilter = (typeof MESSAGING_STATUS_FILTERS)[number];

export const MESSAGING_ROLE_OPTIONS = MESSAGING_ROLE_FILTERS.map((role) => ({
  value: role,
  labelKey: `messaging.role.${role}` as const,
}));

export const MESSAGING_GENDER_OPTIONS = MESSAGING_GENDER_FILTERS.map((gender) => ({
  value: gender,
  labelKey: `messaging.gender.${gender}` as const,
}));

export const MESSAGING_STATUS_OPTIONS = MESSAGING_STATUS_FILTERS.map((status) => ({
  value: status,
  labelKey: `messaging.status.${status}` as const,
}));

/** Messaging module contract — aligns with universal module architecture. */
export const MESSAGING_MODULE_CONTRACT = {
  moduleId: 'messaging',
  entityType: 'Message',
  collectionKey: 'messages',
  restBasePath: '/api/messaging',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'contacts.read',
    write: 'contacts.write',
    clearLogs: 'contacts.write',
    setupView: 'configuration.view',
  } satisfies Record<string, Permission>,
  categories: MESSAGE_CATEGORIES,
  channels: MESSAGE_CHANNELS,
  categoryOptions: MESSAGE_CATEGORY_OPTIONS,
  channelOptions: MESSAGE_CHANNEL_OPTIONS,
  roleOptions: MESSAGING_ROLE_OPTIONS,
  genderOptions: MESSAGING_GENDER_OPTIONS,
  statusOptions: MESSAGING_STATUS_OPTIONS,
} as const;

export type MessagingModuleTier = (typeof MESSAGING_MODULE_CONTRACT.tiers)[number];

/**
 * Resolves the visual badge styling for message channels.
 */
export function getChannelBadgeStyle(channel: 'sms' | 'whatsapp' | 'email' | string): string {
  if (channel === 'email') {
    return 'bg-warning/10 text-warning border border-warning/20';
  }
  if (channel === 'sms') {
    return 'bg-info/10 text-info border border-info/20';
  }
  return 'bg-success/10 text-success border border-success/20';
}

/**
 * Helper to get the i18n label key for a message channel.
 */
export function getChannelLabelKey(channel: string): string {
  return `messaging.channel.${channel}`;
}
