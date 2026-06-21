import { describe, expect, it } from 'vitest';
import { computeTeachersWidgetAggregate } from './teachersWidgetAggregate.js';

describe('teachersWidgetAggregate', () => {
  it('counts all teachers', () => {
    const teachers = [
      { id: 1, status: 'active' },
      { id: 2, status: 'inactive' },
    ];
    const result = computeTeachersWidgetAggregate(teachers, { id: 'total', operation: 'count' });
    expect(result.value).toBe(2);
    expect(result.totalCount).toBe(2);
  });

  it('filters by status for percentage', () => {
    const teachers = [
      { id: 1, status: 'active' },
      { id: 2, status: 'active' },
      { id: 3, status: 'on_leave' },
    ];
    const result = computeTeachersWidgetAggregate(teachers, {
      id: 'active-pct',
      operation: 'percentage',
      filterField: 'status',
      filterOperator: 'equals',
      filterValue: 'active',
    });
    expect(result.value).toBe(67);
  });
});
