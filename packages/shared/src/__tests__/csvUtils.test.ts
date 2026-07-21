import { describe, expect, it } from 'vitest';
import { escapeCsvCell, buildCsvContent } from '../csvUtils.js';

describe('csvUtils', () => {
  describe('escapeCsvCell', () => {
    it('escapes quotes in strings', () => {
      expect(escapeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
    });

    it('neutralizes formula injection characters (=, +, -, @)', () => {
      expect(escapeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      expect(escapeCsvCell('+12345')).toBe('"\'\+12345"');
      expect(escapeCsvCell('-CMD')).toBe('"\'\-CMD"');
      expect(escapeCsvCell('@ADMIN')).toBe('"\'\@ADMIN"');
    });

    it('handles null and undefined values safely', () => {
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });
  });

  describe('buildCsvContent', () => {
    it('formats multi-row CSV content', () => {
      const rows = [
        ['Name', 'Role'],
        ['Alice', 'Admin'],
        ['Bob', 'Teacher'],
      ];
      const csv = buildCsvContent(rows);
      expect(csv).toBe('"Name","Role"\n"Alice","Admin"\n"Bob","Teacher"');
    });
  });
});
