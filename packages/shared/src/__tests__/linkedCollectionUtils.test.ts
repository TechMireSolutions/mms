import { describe, expect, it } from 'vitest';
import {
  normalizeSessionClasses,
  hydrateSessionClasses,
  normalizeStudentLinkedRows,
  hydrateStudentLinkedRows,
  normalizeActivityLog,
  hydrateActivityLog,
} from '../linkedCollectionUtils.js';

describe('linkedCollectionUtils', () => {
  describe('Session classes normalization & hydration', () => {
    it('normalizes session classes by stripping redundant teacherName when teacherId is set', () => {
      const classes = [{ id: 'c1', teacherId: 't1', teacherName: 'Ustadh Ali' }];
      const normalized = normalizeSessionClasses(classes);
      expect(normalized[0].teacherId).toBe('t1');
      expect(normalized[0].teacherName).toBeUndefined();
    });

    it('hydrates session classes with teacher names from entity lookup', () => {
      const classes = [{ id: 'c1', teacherId: 't1' }];
      const teachers = [{ id: 't1', name: 'Ustadh Ali' }];
      const hydrated = hydrateSessionClasses(classes, teachers);
      expect(hydrated[0].teacherName).toBe('Ustadh Ali');
    });
  });

  describe('Student linked rows normalization & hydration', () => {
    it('normalizes student linked rows', () => {
      const rows: Record<string, unknown>[] = [{ id: 'e1', studentId: 's1', studentName: 'Jane' }];
      const normalized = normalizeStudentLinkedRows(rows);
      expect(normalized[0].studentName).toBeUndefined();
    });

    it('hydrates student linked rows from student entities', () => {
      const rows: Record<string, unknown>[] = [{ id: 'e1', studentId: 's1' }];
      const students = [{ id: 's1', name: 'Jane Doe' }];
      const hydrated = hydrateStudentLinkedRows(rows, students);
      expect(hydrated[0].studentName).toBe('Jane Doe');
    });
  });

  describe('Activity log normalization & hydration', () => {
    it('normalizes activity log user link', () => {
      const log: Record<string, unknown> = { id: 'l1', userId: 'u1', userName: 'Admin' };
      const normalized = normalizeActivityLog(log);
      expect(normalized.userName).toBeUndefined();
    });

    it('hydrates activity log user link', () => {
      const log: Record<string, unknown> = { id: 'l1', userId: 'u1' };
      const users = [{ id: 'u1', name: 'Super Admin' }];
      const hydrated = hydrateActivityLog(log, users);
      expect(hydrated.userName).toBe('Super Admin');
    });
  });
});
