import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_SPECIALIZATION,
  DEFAULT_TEACHER_STATUS,
  resolveTeacherSpecializations,
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
