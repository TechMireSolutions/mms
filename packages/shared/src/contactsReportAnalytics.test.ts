import { describe, expect, it } from 'vitest';
import type { Contact } from './contactTypes.js';
import {
  computeContactsMonthlyCreatedCounts,
  computeContactsReportAnalytics,
  computeContactsStageComparison,
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
  lifecycleStage: 'Lead',
  createdAt: '2026-06-01',
  ...overrides,
});

describe('contactsReportAnalytics', () => {
  it('computes stage distribution and conversion', () => {
    const contacts = [
      base({ id: 1, lifecycleStage: 'Lead' }),
      base({ id: 2, lifecycleStage: 'Active Student' }),
      base({ id: 3, lifecycleStage: 'Active Student', deletedAt: '2026-06-10' }),
    ];
    const analytics = computeContactsReportAnalytics(contacts, { defaultStage: 'Lead' });
    expect(analytics.total).toBe(2);
    expect(analytics.leadsCount).toBe(1);
    expect(analytics.conversionRate).toBe(50);
    expect(analytics.stageDistribution).toEqual(
      expect.arrayContaining([
        { stage: 'Lead', count: 1 },
        { stage: 'Active Student', count: 1 },
      ]),
    );
  });

  it('computeContactsStageComparison matches lifecycle filters', () => {
    const contacts = [
      base({ id: 1, lifecycleStage: 'Lead', rating: 3 }),
      base({ id: 2, lifecycleStage: 'Active Student', rating: 5, isActive: true }),
    ];
    const analytics = computeContactsReportAnalytics(contacts, { defaultStage: 'Lead' });
    const comparison = computeContactsStageComparison(analytics, 'Lead', 'Active Student');
    expect(comparison[0]).toEqual({ metric: 'Total Volume', a: 1, b: 1 });
    expect(comparison[1]).toEqual({ metric: 'Conversion%', a: 0, b: 100 });
  });

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
