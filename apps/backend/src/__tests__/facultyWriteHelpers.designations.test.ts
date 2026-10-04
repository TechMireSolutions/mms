import { describe, expect, it } from 'vitest';
import { parseDesignationHoldings } from '../faculty/use-cases/facultyWriteHelpers.js';

describe('parseDesignationHoldings', () => {
  it('prefers designations[] over legacy designationId', () => {
    const holdings = parseDesignationHoldings({
      designationId: 'legacy',
      designations: [
        {
          designationId: 'des-1',
          departmentId: 'dept-1',
          status: 'active',
          startsOn: '2026-01-01',
        },
        {
          designationId: 'des-2',
          departmentId: 'dept-2',
          status: 'inactive',
          startsOn: '2026-02-01',
        },
      ],
    });
    expect(holdings.map((h) => h.designationId)).toEqual(['des-1', 'des-2']);
    expect(holdings.map((h) => h.departmentId)).toEqual(['dept-1', 'dept-2']);
    expect(holdings[1]?.status).toBe('inactive');
  });

  it('synthesizes a single active holding from legacy designationId', () => {
    expect(parseDesignationHoldings({
      designationId: 'des-only',
      departmentId: 'dept-1',
    })).toEqual([
      { designationId: 'des-only', status: 'active', departmentId: 'dept-1' },
    ]);
  });

  it('returns empty when neither designations nor designationId are present', () => {
    expect(parseDesignationHoldings({})).toEqual([]);
  });
});
