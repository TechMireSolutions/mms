import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_STATUS,
  formatTeacherFieldCellValue,
  registerSettingsProvider,
} from '../index.js';

describe('formatTeacherFieldCellValue', () => {
  it('returns undefined for empty values unless status default applies', () => {
    expect(formatTeacherFieldCellValue(undefined)).toBeUndefined();
    expect(formatTeacherFieldCellValue(null)).toBeUndefined();
    expect(formatTeacherFieldCellValue('')).toBeUndefined();
    expect(formatTeacherFieldCellValue('  ')).toBeUndefined();
    expect(formatTeacherFieldCellValue('', { propKey: 'status' })).toBe(DEFAULT_TEACHER_STATUS);
    expect(formatTeacherFieldCellValue(undefined, { statusDefault: true })).toBe(DEFAULT_TEACHER_STATUS);
  });

  it('formats dates and datetimes by Setup field type', () => {
    // Pin global display format so assertions are locale/timezone independent.
    registerSettingsProvider(() => ({
      dateFormat: 'YYYY-MM-DD',
      timezone: 'UTC',
      language: 'en',
    }));
    try {
      expect(formatTeacherFieldCellValue('2024-01-05', { fieldType: 'date' })).toBe('2024-01-05');
      expect(formatTeacherFieldCellValue('2024-01-05T09:30:00Z', { fieldType: 'datetime' })).toBe(
        '2024-01-05 9:30',
      );
      expect(formatTeacherFieldCellValue('2024-01-05', {})).toBe('2024-01-05');
      expect(formatTeacherFieldCellValue('2024-01-05T09:30:00Z', {})).toBe('2024-01-05 9:30');
    } finally {
      registerSettingsProvider(null);
    }
  });

  it('renders booleans with optional localized labels', () => {
    expect(formatTeacherFieldCellValue(true)).toBe('true');
    expect(formatTeacherFieldCellValue(false)).toBe('false');
    expect(formatTeacherFieldCellValue(true, { booleanLabels: { yes: 'Yes', no: 'No' } })).toBe('Yes');
    expect(formatTeacherFieldCellValue(false, { booleanLabels: { yes: 'Yes', no: 'No' } })).toBe('No');
  });

  it('joins arrays with the requested separator', () => {
    expect(formatTeacherFieldCellValue(['Hifz', 'Tajweed'], {})).toBe('Hifz, Tajweed');
    expect(formatTeacherFieldCellValue(['Hifz', 'Tajweed'], { arraySeparator: '; ' })).toBe('Hifz; Tajweed');
    expect(formatTeacherFieldCellValue([], {})).toBeUndefined();
  });

  it('stringifies scalars and drops objects', () => {
    expect(formatTeacherFieldCellValue(42)).toBe('42');
    expect(formatTeacherFieldCellValue('Hifz')).toBe('Hifz');
    expect(formatTeacherFieldCellValue({ nested: true })).toBeUndefined();
  });
});
