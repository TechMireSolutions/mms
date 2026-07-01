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
  emergencyContacts: [],
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
});
