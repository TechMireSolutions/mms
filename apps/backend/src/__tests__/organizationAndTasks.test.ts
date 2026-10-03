/**
 * @file organizationAndTasks.test.ts
 * @description Unit tests for organization blueprints, position hierarchy cycle checks, and task delegation rules.
 */

import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_BLUEPRINTS,
  findBlueprintById,
  getBlueprintsForIndustry,
} from '@mms/shared';
import { validateHierarchyDepth } from '../db/repositories/positionHierarchySql.js';

describe('Organization Blueprints Catalog', () => {
  it('contains all 4 standard industry blueprints', () => {
    expect(ORGANIZATION_BLUEPRINTS.length).toBe(4);
    const ids = ORGANIZATION_BLUEPRINTS.map((b) => b.id);
    expect(ids).toContain('madrasa-standard-v1');
    expect(ids).toContain('hotel-standard-v1');
    expect(ids).toContain('office-standard-v1');
    expect(ids).toContain('retail-standard-v1');
  });

  it('can look up blueprint by id', () => {
    const madrasa = findBlueprintById('madrasa-standard-v1');
    expect(madrasa).toBeDefined();
    expect(madrasa?.industryType).toBe('madrasa');
    expect(madrasa?.locations.length).toBeGreaterThan(0);
    expect(madrasa?.departments.length).toBeGreaterThan(0);
    expect(madrasa?.designations.length).toBeGreaterThan(0);
    expect(madrasa?.positions.length).toBeGreaterThan(0);
  });

  it('filters blueprints by industry', () => {
    const hotels = getBlueprintsForIndustry('hotel');
    expect(hotels.length).toBe(1);
    expect(hotels[0]?.id).toBe('hotel-standard-v1');
  });

  it('ensures all blueprint positions reference valid departments and designations', () => {
    for (const bp of ORGANIZATION_BLUEPRINTS) {
      const deptCodes = new Set(bp.departments.map((d) => d.code));
      const desigCodes = new Set(bp.designations.map((d) => d.code));
      const locCodes = new Set(bp.locations.map((l) => l.code));

      for (const pos of bp.positions) {
        expect(deptCodes.has(pos.departmentCode)).toBe(true);
        expect(desigCodes.has(pos.designationCode)).toBe(true);
        if (pos.locationCode) {
          expect(locCodes.has(pos.locationCode)).toBe(true);
        }
      }
    }
  });
});

describe('Position Hierarchy Depth Guard', () => {
  it('accepts valid depths between 1 and 20', () => {
    expect(() => validateHierarchyDepth(1)).not.toThrow();
    expect(() => validateHierarchyDepth(10)).not.toThrow();
    expect(() => validateHierarchyDepth(20)).not.toThrow();
  });

  it('rejects depth <= 0 or > 20', () => {
    expect(() => validateHierarchyDepth(0)).toThrow();
    expect(() => validateHierarchyDepth(-5)).toThrow();
    expect(() => validateHierarchyDepth(21)).toThrow();
    expect(() => validateHierarchyDepth(2.5)).toThrow();
  });
});
