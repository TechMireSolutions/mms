import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_SPECIALIZATION,
  DEFAULT_TEACHER_STATUS,
  resolveTeacherSpecializations,
  resolveTeacherStatus,
  resolveTeacherStatusRoles,
  resolveTeacherStatuses,
  TEACHER_SPECIALIZATION_VALUES,
  TEACHER_STATUS_VALUES,
} from './teacherTypes.js';

describe('resolveTeacherStatuses / resolveTeacherSpecializations', () => {
  it('DEFAULT_TEACHER_STATUS matches the first status value', () => {
    expect(DEFAULT_TEACHER_STATUS).toBe(TEACHER_STATUS_VALUES[0]);
  });

  it('DEFAULT_TEACHER_SPECIALIZATION is in TEACHER_SPECIALIZATION_VALUES', () => {
    expect(TEACHER_SPECIALIZATION_VALUES).toContain(DEFAULT_TEACHER_SPECIALIZATION);
    expect(DEFAULT_TEACHER_SPECIALIZATION).toBe('General');
  });

  it('falls back to shared defaults when empty', () => {
    expect(resolveTeacherStatuses()).toEqual(TEACHER_STATUS_VALUES);
    expect(resolveTeacherStatuses([])).toEqual(TEACHER_STATUS_VALUES);
    expect(resolveTeacherSpecializations(null)).toEqual(TEACHER_SPECIALIZATION_VALUES);
  });

  it('prefers configured lists when non-empty', () => {
    expect(resolveTeacherStatuses(['active', 'inactive'])).toEqual(['active', 'inactive']);
    expect(resolveTeacherSpecializations(['Hifz'])).toEqual(['Hifz']);
  });
});

describe('resolveTeacherStatus', () => {
  it('returns the provided status when present', () => {
    expect(resolveTeacherStatus('on_leave')).toBe('on_leave');
    expect(resolveTeacherStatus('custom')).toBe('custom');
  });

  it('falls back to DEFAULT_TEACHER_STATUS when unset', () => {
    expect(resolveTeacherStatus()).toBe(DEFAULT_TEACHER_STATUS);
    expect(resolveTeacherStatus(undefined)).toBe(DEFAULT_TEACHER_STATUS);
    expect(resolveTeacherStatus('')).toBe(DEFAULT_TEACHER_STATUS);
    expect(resolveTeacherStatus(null)).toBe(DEFAULT_TEACHER_STATUS);
  });
});

describe('resolveTeacherStatusRoles', () => {
  it('maps TEACHER_STATUS_VALUES to named roles in order', () => {
    const [active, inactive, onLeave] = TEACHER_STATUS_VALUES;
    expect(resolveTeacherStatusRoles()).toEqual({ active, inactive, onLeave });
  });
});
