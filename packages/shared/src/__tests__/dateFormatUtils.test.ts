import { describe, expect, it } from 'vitest';
import {
  normalizeDateFormat,
  formatDateParts,
  formatDatePartsWithMonthName,
  formatIsoDateToDisplay,
  parseDisplayDateToIso,
  parseIsoDate,
  isDateWithinIsoBounds,
  resolveDatePickerMonthBounds,
  DATE_FORMAT_PRESET_IDS,
  DATE_PICKER_YEAR_PAST,
  DATE_PICKER_YEAR_FUTURE,
} from '../dateFormatUtils.js';

describe('dateFormatUtils', () => {
  describe('normalizeDateFormat', () => {
    it('returns default fallback DD/MM/YYYY for undefined or unknown input', () => {
      expect(normalizeDateFormat(undefined)).toBe('DD/MM/YYYY');
      expect(normalizeDateFormat('INVALID_FORMAT')).toBe('DD/MM/YYYY');
    });

    it('preserves valid preset IDs', () => {
      for (const preset of DATE_FORMAT_PRESET_IDS) {
        expect(normalizeDateFormat(preset)).toBe(preset);
      }
    });
  });

  describe('formatDateParts', () => {
    it('formats parts correctly per preset', () => {
      expect(formatDateParts(5, 3, 2026, 'DD/MM/YYYY')).toBe('05/03/2026');
      expect(formatDateParts(5, 3, 2026, 'MM/DD/YYYY')).toBe('03/05/2026');
      expect(formatDateParts(5, 3, 2026, 'YYYY-MM-DD')).toBe('2026-03-05');
      expect(formatDateParts(5, 3, 2026, 'DD-MM-YYYY')).toBe('05-03-2026');
      expect(formatDateParts(5, 3, 2026, 'DD.MM.YYYY')).toBe('05.03.2026');
      expect(formatDateParts(5, 3, 2026, 'YYYY/MM/DD')).toBe('2026/03/05');
    });
  });

  describe('formatDatePartsWithMonthName', () => {
    it('formats with month names correctly', () => {
      expect(formatDatePartsWithMonthName(15, 'Mar', 3, 2026, 'MM/DD/YYYY')).toBe('Mar 15, 2026');
      expect(formatDatePartsWithMonthName(15, 'Mar', 3, 2026, 'DD/MM/YYYY')).toBe('15 Mar 2026');
      expect(formatDatePartsWithMonthName(15, 'Mar', 3, 2026, 'YYYY-MM-DD')).toBe('2026-03-15');
    });
  });

  describe('formatIsoDateToDisplay and parseDisplayDateToIso', () => {
    it('converts ISO dates to display format and parses back accurately', () => {
      const iso = '2026-07-21';

      const displayUK = formatIsoDateToDisplay(iso, 'DD/MM/YYYY');
      expect(displayUK).toBe('21/07/2026');
      expect(parseDisplayDateToIso(displayUK, 'DD/MM/YYYY')).toBe('2026-07-21');

      const displayUS = formatIsoDateToDisplay(iso, 'MM/DD/YYYY');
      expect(displayUS).toBe('07/21/2026');
      expect(parseDisplayDateToIso(displayUS, 'MM/DD/YYYY')).toBe('2026-07-21');
    });

    it('handles empty or malformed strings gracefully', () => {
      expect(formatIsoDateToDisplay('', 'DD/MM/YYYY')).toBe('');
      expect(formatIsoDateToDisplay('invalid', 'DD/MM/YYYY')).toBe('invalid');
      expect(parseDisplayDateToIso('  ', 'DD/MM/YYYY')).toBe('');
      expect(parseDisplayDateToIso('not-a-date', 'DD/MM/YYYY')).toBe('');
    });
  });

  describe('isDateWithinIsoBounds / resolveDatePickerMonthBounds', () => {
    it('enforces optional min and max ISO bounds', () => {
      const mid = parseIsoDate('2026-06-15')!;
      expect(isDateWithinIsoBounds(mid)).toBe(true);
      expect(isDateWithinIsoBounds(mid, '2026-06-15', '2026-06-15')).toBe(true);
      expect(isDateWithinIsoBounds(mid, '2026-06-16')).toBe(false);
      expect(isDateWithinIsoBounds(mid, undefined, '2026-06-14')).toBe(false);
    });

    it('resolves caption month window from ISO bounds or defaults', () => {
      const bounded = resolveDatePickerMonthBounds('2020-03-01', '2030-08-01');
      expect(bounded.startMonth.getFullYear()).toBe(2020);
      expect(bounded.startMonth.getMonth()).toBe(0);
      expect(bounded.endMonth.getFullYear()).toBe(2030);
      expect(bounded.endMonth.getMonth()).toBe(11);

      const open = resolveDatePickerMonthBounds();
      const year = new Date().getFullYear();
      expect(open.startMonth.getFullYear()).toBe(year - DATE_PICKER_YEAR_PAST);
      expect(open.endMonth.getFullYear()).toBe(year + DATE_PICKER_YEAR_FUTURE);
    });
  });
});
