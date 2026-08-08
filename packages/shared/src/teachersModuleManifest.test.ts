import { describe, expect, it } from 'vitest';
import {
  teacherCoreSchema,
  teacherRecordSchema,
  TEACHER_STATUS_WRITE_MAX,
} from './teachersModuleManifest.js';

describe('teacherCoreSchema status (lookup SSOT)', () => {
  it('accepts default and custom lookup statuses', () => {
    expect(teacherCoreSchema.parse({ contactId: 'c1', status: 'active' }).status).toBe('active');
    expect(teacherCoreSchema.parse({ contactId: 'c1', status: 'sabbatical' }).status).toBe('sabbatical');
  });

  it('rejects empty or oversized status', () => {
    expect(() => teacherCoreSchema.parse({ contactId: 'c1', status: '' })).toThrow();
    expect(() =>
      teacherCoreSchema.parse({ contactId: 'c1', status: 'x'.repeat(TEACHER_STATUS_WRITE_MAX + 1) }),
    ).toThrow();
  });

  it('allows omitting contactId on the wire (requireContactLink enforced dynamically)', () => {
    const parsed = teacherCoreSchema.parse({ status: 'active', specialization: 'Hifz' });
    expect(parsed.contactId).toBeUndefined();
  });

  it('rejects empty-string contactId', () => {
    expect(() => teacherCoreSchema.parse({ contactId: '', status: 'active' })).toThrow();
  });

  it('allows custom keys via catchall and does not declare contact profile dual-write keys', () => {
    const parsed = teacherCoreSchema.parse({
      contactId: 'c1',
      status: 'active',
      customNote: 'hello',
    });
    expect(parsed.customNote).toBe('hello');
    expect('name' in teacherCoreSchema.shape).toBe(false);
    expect('phone' in teacherCoreSchema.shape).toBe(false);
    expect('email' in teacherCoreSchema.shape).toBe(false);
    expect('gender' in teacherCoreSchema.shape).toBe(false);
  });
});

describe('teacherRecordSchema', () => {
  it('strips contact profile keys even when contactId is omitted', () => {
    const parsed = teacherRecordSchema.parse({
      specialization: 'Hifz',
      status: 'active',
      name: 'Should Strip',
      phone: '+100',
    });
    expect((parsed as Record<string, unknown>).name).toBeUndefined();
    expect((parsed as Record<string, unknown>).phone).toBeUndefined();
    expect(parsed.specialization).toBe('Hifz');
  });
});
