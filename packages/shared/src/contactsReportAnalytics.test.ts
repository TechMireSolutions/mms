import { describe, expect, it } from 'vitest';
import type { Contact } from './contactTypes.js';
import {
  computeContactsMonthlyCreatedCounts,
  computeContactsReportAnalytics,
} from './contactsReportAnalytics.js';

const base = (overrides: Partial<Contact> = {}): Contact => ({
  id: 1,
  name: 'Test',
  firstName: 'Test',
  lastName: '',
  phones: [],
  emails: [],
  addresses: [],
  socials: [],
  relationshipContacts: [],
  createdAt: '2026-06-01',
  ...overrides,
});

describe('contactsReportAnalytics', () => {
  it('computeContactsMonthlyCreatedCounts groups by year/month', () => {
    const contacts = [
      base({ createdAt: '2025-03-15' }),
      base({ id: 2, createdAt: '2025-03-20' }),
      base({ id: 3, createdAt: '2025-04-01' }),
    ];
    const months = computeContactsMonthlyCreatedCounts(contacts, 2025, 6);
    expect(months[2]?.count).toBe(2);
    expect(months[3]?.count).toBe(1);
  });

  it('computeContactsMonthlyCreatedCounts localizes month labels', () => {
    const en = computeContactsMonthlyCreatedCounts([], 2025, 1, 'en');
    const ar = computeContactsMonthlyCreatedCounts([], 2025, 1, 'ar');
    expect(en[0]?.month).toBeTruthy();
    expect(ar[0]?.month).toBeTruthy();
    expect(ar[0]?.month).not.toBe(en[0]?.month);
  });

  it('activeCount equals soft-delete-filtered total', () => {
    const contacts = [
      base({ id: 1 }),
      base({ id: 2 }),
      base({ id: 3, deletedAt: '2026-01-01' }),
    ];
    const analytics = computeContactsReportAnalytics(contacts);
    expect(analytics.total).toBe(2);
    expect(analytics.activeCount).toBe(2);
  });

  it('counts missing phone or email as missingInfo', () => {
    const contacts = [
      base({
        id: 1,
        phones: [{ label: 'Mobile', number: '+15551234567', isPrimary: true }],
        emails: [{ label: 'Work', address: 'a@example.com', isPrimary: true }],
      }),
      base({
        id: 2,
        phones: [{ label: 'Mobile', number: '+15557654321', isPrimary: true }],
        emails: [],
      }),
      base({
        id: 3,
        phones: [],
        emails: [{ label: 'Work', address: 'b@example.com', isPrimary: true }],
      }),
    ];
    expect(computeContactsReportAnalytics(contacts).missingInfoCount).toBe(2);
  });
});
