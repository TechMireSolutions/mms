import { describe, expect, it } from 'vitest';
import { calculateAgeFromDob, suggestClass, calcFee } from './enrollmentData';
import type { Session, Discount } from './sessionsData';
import type { Student } from './studentsData';

describe('enrollmentData dynamic calculations', () => {
  describe('calculateAgeFromDob', () => {
    it('accurately computes age based on current date', () => {
      const now = new Date();
      const birthYear = now.getFullYear() - 10;
      const dobSameMonthPastDay = `${birthYear}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const age = calculateAgeFromDob(dobSameMonthPastDay);
      expect(age).toBe(10);
    });

    it('returns 0 for invalid or future birth dates', () => {
      expect(calculateAgeFromDob('')).toBe(0);
      expect(calculateAgeFromDob('invalid-date')).toBe(0);
    });
  });

  describe('suggestClass', () => {
    const mockSession: Session = {
      id: 'sess-1',
      name: 'Academic Year 2026',
      classes: [
        {
          id: 'cls-junior',
          name: 'Junior Hifz',
          ageMin: 7,
          ageMax: 11,
          gender: 'any',
          capacity: 20,
          enrolled: 5,
        },
        {
          id: 'cls-senior',
          name: 'Senior Hifz',
          ageMin: 12,
          ageMax: 18,
          gender: 'any',
          capacity: 20,
          enrolled: 10,
        },
      ],
    } as unknown as Session;

    it('suggests junior class for a 9-year old student', () => {
      const now = new Date();
      const student: Partial<Student> = {
        dob: `${now.getFullYear() - 9}-01-01`,
        gender: 'male',
      };
      const suggested = suggestClass(student, mockSession);
      expect(suggested?.id).toBe('cls-junior');
    });

    it('suggests senior class for a 14-year old student', () => {
      const now = new Date();
      const student: Partial<Student> = {
        dob: `${now.getFullYear() - 14}-01-01`,
        gender: 'female',
      };
      const suggested = suggestClass(student, mockSession);
      expect(suggested?.id).toBe('cls-senior');
    });
  });

  describe('calcFee', () => {
    const sessionDiscounts: Discount[] = [
      {
        id: 'early_bird',
        name: 'Early Bird',
        type: 'percentage',
        value: 15,
        conditions: '',
        active: true,
      },
    ];

    it('uses matched session discount when available', () => {
      const student: Partial<Student> = {
        discountType: 'early_bird',
      };
      const result = calcFee(1000, student, [], sessionDiscounts);
      expect(result.pct).toBe(15);
      expect(result.discountAmt).toBe(150);
      expect(result.finalFee).toBe(850);
      expect(result.label).toBe('Early Bird');
    });

    it('respects standard discount fallbacks', () => {
      const student: Partial<Student> = {
        discountType: 'sibling',
      };
      const result = calcFee(1000, student, [], []);
      expect(result.pct).toBe(10);
      expect(result.discountAmt).toBe(100);
      expect(result.finalFee).toBe(900);
    });

    it('respects custom discountPct if provided on student', () => {
      const student: Partial<Student> = {
        discountType: 'custom',
        discountPct: 30,
      };
      const result = calcFee(1000, student, [], []);
      expect(result.pct).toBe(30);
      expect(result.discountAmt).toBe(300);
      expect(result.finalFee).toBe(700);
    });
  });
});
