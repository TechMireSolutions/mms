import { describe, expect, it } from 'vitest';
import type { Contact } from './contactTypes.js';
import { computeContactsWidgetAggregate } from './contactsWidgetAggregate.js';

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
  rating: 4,
  ...overrides,
});

describe('contactsWidgetAggregate', () => {
  it('counts all active contacts', () => {
    const contacts = [base(), base({ id: 2 }), base({ id: 3, deletedAt: '2026-01-01' })];
    const result = computeContactsWidgetAggregate(contacts, { id: 'total', operation: 'count' });
    expect(result.value).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it('computes lifecycle stage percentage case-insensitively', () => {
    const contacts = [
      base({ lifecycleStage: 'Lead' }),
      base({ id: 2, lifecycleStage: 'Active Student' }),
    ];
    const result = computeContactsWidgetAggregate(contacts, {
      id: 'leads',
      operation: 'percentage',
      filterField: 'lifecycleStage',
      filterOperator: 'equals',
      filterValue: 'lead',
    });
    expect(result.value).toBe(50);
  });

  it('groups chart data by lifecycle stage', () => {
    const contacts = [
      base({ lifecycleStage: 'Lead' }),
      base({ id: 2, lifecycleStage: 'Lead' }),
      base({ id: 3, lifecycleStage: 'Donor' }),
    ];
    const result = computeContactsWidgetAggregate(contacts, {
      id: 'chart',
      operation: 'count',
      xAxisField: 'lifecycleStage',
    });
    expect(result.chartData).toEqual(
      expect.arrayContaining([
        { name: 'Lead', value: 2 },
        { name: 'Donor', value: 1 },
      ]),
    );
  });
});
