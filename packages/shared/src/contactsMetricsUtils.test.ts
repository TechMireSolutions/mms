import { describe, expect, it } from 'vitest';
import type { Contact, FieldConfig } from './contactTypes.js';
import {
  CONTACT_METRICS_DEFAULT_PERIOD_DAYS,
  computeContactsCommandMetrics,
  countActionableDuplicatePairs,
  countActiveContacts,
  countContactsCreatedSince,
} from './contactsMetricsUtils.js';

const fieldConfig: FieldConfig = {
  version: 1,
  enabledTabs: ['basic'],
  requiredTabs: [],
  formTabs: [{ key: 'basic', label: 'Basic', enabled: true, order: 1 }],
  fields: {
    basic: [
      { key: 'firstName', type: 'text', label: 'First Name', required: true, enabled: true, order: 1 },
      { key: 'notes', type: 'text', label: 'Notes', required: false, enabled: true, order: 2 },
    ],
  },
};

const base = (overrides: Partial<Contact> = {}): Contact => ({
  id: 1,
  name: 'Test',
  firstName: 'Test',
  lastName: '',
  phones: [{ label: 'mobile', number: '+923001234567', isPrimary: true }],
  emails: [],
  addresses: [],
  socials: [],
  relationshipContacts: [],
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
    const olderThanWindowDate = new Date();
    olderThanWindowDate.setDate(olderThanWindowDate.getDate() - 60);
    const contacts = [
      base({ createdAt: recent.toISOString().slice(0, 10) }),
      base({ id: 2, createdAt: olderThanWindowDate.toISOString().slice(0, 10) }),
      base({ id: 3, deletedAt: '2026-06-01', createdAt: recent.toISOString().slice(0, 10) }),
    ];
    expect(countContactsCreatedSince(contacts, CONTACT_METRICS_DEFAULT_PERIOD_DAYS)).toBe(1);
  });

  it('countActionableDuplicatePairs ignores name-only collisions', () => {
    const contacts = [
      base({
        id: 1,
        name: 'Ahmed Khan',
        firstName: 'Ahmed',
        lastName: 'Khan',
        phones: [{ label: 'mobile', number: '+923001111111', isPrimary: true }],
        emails: [{ label: 'home', address: 'a@example.com' }],
      }),
      base({
        id: 2,
        name: 'Ahmed Khan',
        firstName: 'Ahmed',
        lastName: 'Khan',
        phones: [{ label: 'mobile', number: '+923009999999', isPrimary: true }],
        emails: [{ label: 'home', address: 'b@example.com' }],
      }),
      base({
        id: 3,
        name: 'Other Person',
        firstName: 'Other',
        lastName: 'Person',
        phones: [{ label: 'mobile', number: '+923007777777', isPrimary: true }],
        emails: [{ label: 'home', address: 'shared@example.com' }],
      }),
      base({
        id: 4,
        name: 'Fourth',
        firstName: 'Fourth',
        lastName: 'Person',
        phones: [{ label: 'mobile', number: '+923008888888', isPrimary: true }],
        emails: [{ label: 'home', address: 'shared@example.com' }],
      }),
    ];
    expect(countActionableDuplicatePairs(contacts)).toBe(1);
  });

  it('computeContactsCommandMetrics uses required-field incompleteness', () => {
    const contacts = [
      base({ id: 1, firstName: 'Complete', notes: '' }),
      base({ id: 2, firstName: '', name: '', notes: 'only notes' }),
    ];
    const metrics = computeContactsCommandMetrics(contacts, { fieldConfig });
    expect(metrics.total).toBe(2);
    expect(metrics.incompleteCount).toBe(1);
    expect(metrics.whatsappCount).toBe(2);
  });
});
