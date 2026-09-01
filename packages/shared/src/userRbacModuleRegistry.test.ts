import { describe, expect, it } from 'vitest';
import {
  filterRbacModulesForSettings,
  getRbacModuleDef,
  isRbacModuleEnabled,
  isValidRbacModuleId,
  RBAC_MODULE_IDS,
  RBAC_MODULE_REGISTRY,
  RBAC_MODULES_BY_ID,
  rbacModuleSystemId,
} from './userRbacModuleRegistry.js';

describe('userRbacModuleRegistry', () => {
  it('contains all 16 canonical RBAC modules', () => {
    expect(RBAC_MODULE_IDS.length).toBe(16);
    expect(RBAC_MODULE_REGISTRY.length).toBe(16);
    for (const id of RBAC_MODULE_IDS) {
      expect(RBAC_MODULES_BY_ID[id]).toBeDefined();
      expect(RBAC_MODULES_BY_ID[id].id).toBe(id);
    }
  });

  it('resolves system module IDs correctly', () => {
    expect(rbacModuleSystemId('enrollments')).toBe('enrollment');
    expect(rbacModuleSystemId('examinations')).toBe('examination');
    expect(rbacModuleSystemId('obligations')).toBe('finance');
    expect(rbacModuleSystemId('students')).toBe('students');
    expect(rbacModuleSystemId('finance')).toBe('finance');
    expect(rbacModuleSystemId('unknown_mod')).toBe('unknown_mod');
  });

  it('getRbacModuleDef returns module definition or undefined', () => {
    expect(getRbacModuleDef('students')?.labelKey).toBe('nav.students');
    expect(getRbacModuleDef('nonexistent')).toBeUndefined();
  });

  it('isValidRbacModuleId correctly identifies valid RBAC modules', () => {
    expect(isValidRbacModuleId('students')).toBe(true);
    expect(isValidRbacModuleId('dashboard')).toBe(true);
    expect(isValidRbacModuleId('accounting')).toBe(true);
    expect(isValidRbacModuleId('fake_module')).toBe(false);
    expect(isValidRbacModuleId(null)).toBe(false);
    expect(isValidRbacModuleId(123)).toBe(false);
  });

  it('always enables settings module regardless of settings toggles', () => {
    expect(isRbacModuleEnabled('settings', { settings: false })).toBe(true);
  });

  it('filters modules according to enabled settings', () => {
    const enabledModules = {
      teachers: false,
      enrollment: false,
    };
    const visible = filterRbacModulesForSettings(enabledModules);
    expect(visible.some((m) => m.id === 'teachers')).toBe(false);
    expect(visible.some((m) => m.id === 'enrollments')).toBe(false);
    expect(visible.some((m) => m.id === 'students')).toBe(true);
    expect(visible.some((m) => m.id === 'settings')).toBe(true);
  });

  it('defaults to all modules enabled when null/undefined settings provided', () => {
    const visible = filterRbacModulesForSettings(null);
    expect(visible.length).toBe(16);
  });
});
