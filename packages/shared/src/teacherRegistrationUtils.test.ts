import { describe, expect, it } from 'vitest';
import { computeNextTeacherEmployeeIdFromCount } from './teacherRegistrationUtils.js';

describe('teacherRegistrationUtils', () => {
  it('computeNextTeacherEmployeeIdFromCount pads sequence from count', () => {
    expect(computeNextTeacherEmployeeIdFromCount(0, { idPrefix: 'TCH' })).toBe('TCH-0001');
    expect(computeNextTeacherEmployeeIdFromCount(3, { idPrefix: 'FAC' })).toBe('FAC-0004');
  });
});
