import { describe, expect, it } from 'vitest';
import {
  prepareTeacherRecord,
  resolveTeacherRowId,
} from '../teachers/use-cases/teacherNormalizeUseCases.js';

describe('teacherNormalizeUseCases', () => {
  describe('resolveTeacherRowId', () => {
    it('passes through a supplied id', () => {
      expect(resolveTeacherRowId('t1')).toBe('t1');
      expect(resolveTeacherRowId(42)).toBe('42');
    });

    it('generates a tch-<uuid> prefixed id when absent', () => {
      const id = resolveTeacherRowId(undefined);
      expect(id).toMatch(/^tch-[0-9a-f-]{36}$/);
    });

    it('generates a fresh id each call', () => {
      expect(resolveTeacherRowId(undefined)).not.toBe(resolveTeacherRowId(undefined));
    });
  });

  describe('prepareTeacherRecord', () => {
    it('parses a minimal record and assigns a generated id', () => {
      const parsed = prepareTeacherRecord({ status: 'active' });
      expect(parsed.status).toBe('active');
      expect(parsed.id).toMatch(/^tch-[0-9a-f-]{36}$/);
    });

    it('keeps an explicit id', () => {
      const parsed = prepareTeacherRecord({ id: 't-9', status: 'active' });
      expect(parsed.id).toBe('t-9');
    });

    it('strips client soft-delete metadata', () => {
      const parsed = prepareTeacherRecord({
        status: 'active',
        deleted: true,
        deletedAt: '2026-01-01T00:00:00.000Z',
        deletedBy: 'u1',
        deletionReason: 'duplicate',
      } as never);
      expect(parsed).not.toHaveProperty('deleted');
      expect(parsed).not.toHaveProperty('deletedAt');
      expect(parsed).not.toHaveProperty('deletedBy');
      expect(parsed).not.toHaveProperty('deletionReason');
    });

    it('strips contact-owned profile keys (SSOT on contacts)', () => {
      const parsed = prepareTeacherRecord({
        status: 'active',
        contactId: 'c-1',
        name: 'Ustadh',
        phone: '+923001234567',
        email: 'a@b.com',
        gender: 'male',
        dob: '2000-01-01',
      } as never);
      expect(parsed).not.toHaveProperty('name');
      expect(parsed).not.toHaveProperty('phone');
      expect(parsed).not.toHaveProperty('email');
      expect(parsed).not.toHaveProperty('gender');
      expect(parsed).not.toHaveProperty('dob');
    });

    it('drops an absent contactId but keeps employee-only fields', () => {
      const parsed = prepareTeacherRecord({ employeeId: 'T-1', status: 'active' });
      expect(parsed).not.toHaveProperty('contactId');
      expect(parsed.employeeId).toBe('T-1');
    });
  });
});
