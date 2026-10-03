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
  it('contains standard industry blueprints including hotel v2', () => {
    expect(ORGANIZATION_BLUEPRINTS.length).toBe(5);
    const ids = ORGANIZATION_BLUEPRINTS.map((b) => b.id);
    expect(ids).toContain('madrasa-standard-v1');
    expect(ids).toContain('hotel-standard-v1');
    expect(ids).toContain('hotel-standard-v2');
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
    expect(hotels.map((b) => b.id).sort()).toEqual(['hotel-standard-v1', 'hotel-standard-v2']);
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

describe('Task Settings & Preferences Schema', () => {
  it('validates default task settings', async () => {
    const { DEFAULT_TASK_SETTINGS, taskSettingsSchema } = await import('@mms/shared');
    expect(DEFAULT_TASK_SETTINGS.delegationScope).toBe('descendants');
    expect(DEFAULT_TASK_SETTINGS.allowSelfAssignment).toBe(true);

    const parsed = taskSettingsSchema.safeParse(DEFAULT_TASK_SETTINGS);
    expect(parsed.success).toBe(true);
  });

  it('accepts direct_reports delegation scope', async () => {
    const { taskSettingsSchema } = await import('@mms/shared');
    const parsed = taskSettingsSchema.safeParse({
      delegationScope: 'direct_reports',
      allowSelfAssignment: false,
      notifyOnAssignment: true,
      notifyOnStatusChange: false,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.delegationScope).toBe('direct_reports');
      expect(parsed.data.allowSelfAssignment).toBe(false);
    }
  });

  it('rejects invalid delegation scope', async () => {
    const { taskSettingsSchema } = await import('@mms/shared');
    const parsed = taskSettingsSchema.safeParse({
      delegationScope: 'all_users',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts non-uuid faculty and user ids on task assignee input', async () => {
    const { taskAssigneeInputSchema, TASKS_MODULE_MANIFEST } = await import('@mms/shared');
    const parsed = taskAssigneeInputSchema.safeParse({
      facultyId: 'fac-legacy-1',
      userId: 'user-legacy-1',
      positionId: 'pos-legacy-1',
    });
    expect(parsed.success).toBe(true);
    expect(TASKS_MODULE_MANIFEST.softDelete.workExcludesDeleted).toBe(true);
    expect(TASKS_MODULE_MANIFEST.work.directoryViews).toEqual(['table', 'cards']);
  });
});

