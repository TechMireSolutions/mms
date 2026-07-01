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
  gender: 'male',
  ...overrides,
});

describe('contactsWidgetAggregate', () => {
  it('counts all active contacts', () => {
    const contacts = [base(), base({ id: 2 }), base({ id: 3, deletedAt: '2026-01-01' })];
    const result = computeContactsWidgetAggregate(contacts, { id: 'total', operation: 'count' });
    expect(result.value).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it('computes gender percentage case-insensitively', () => {
    const contacts = [
      base({ gender: 'male' }),
      base({ id: 2, gender: 'female' }),
    ];
    const result = computeContactsWidgetAggregate(contacts, {
      id: 'males',
      operation: 'percentage',
      filterField: 'gender',
      filterOperator: 'equals',
      filterValue: 'male',
    });
    expect(result.value).toBe(50);
  });

  it('groups chart data by gender', () => {
    const contacts = [
      base({ gender: 'male' }),
      base({ id: 2, gender: 'male' }),
      base({ id: 3, gender: 'female' }),
    ];
    const result = computeContactsWidgetAggregate(contacts, {
      id: 'chart',
      operation: 'count',
      xAxisField: 'gender',
    });
    expect(result.chartData).toEqual(
      expect.arrayContaining([
        { name: 'male', value: 2 },
        { name: 'female', value: 1 },
      ]),
    );
  });
});
