import { describe, expect, it } from 'vitest';
import type { Contact } from './contactTypes.js';
import {
  CONTACT_METRICS_DEFAULT_PERIOD_DAYS,
  countActiveContacts,
  countContactsCreatedSince,
} from './contactsMetricsUtils.js';

const base = (overrides: Partial<Contact> = {}): Contact => ({
  id: 1,
  name: 'Test',
  firstName: 'Test',
  lastName: '',
  phones: [],
  emails: [],
  addresses: [],
  socials: [],
  emergencyContacts: [],
  createdAt: '2026-06-01',
  ...overrides,
});

describe('contactsMetricsUtils', () => {
  it('countActiveContacts excludes soft-deleted rows', () => {
    const contacts = [base(), base({ id: 2, deletedAt: '2026-06-10' })];
    expect(countActiveContacts(contacts)).toBe(1);
  });

  it('countContactsCreatedSince respects rolling window', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 5);
    const old = new Date();
    old.setDate(old.getDate() - 60);
    const contacts = [
      base({ createdAt: recent.toISOString().slice(0, 10) }),
      base({ id: 2, createdAt: old.toISOString().slice(0, 10) }),
      base({ id: 3, deletedAt: '2026-06-01', createdAt: recent.toISOString().slice(0, 10) }),
    ];
    expect(countContactsCreatedSince(contacts, CONTACT_METRICS_DEFAULT_PERIOD_DAYS)).toBe(1);
  });
});
