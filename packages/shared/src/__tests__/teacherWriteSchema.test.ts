import { describe, expect, it } from 'vitest';
import {
  stripTeacherClientSoftDeleteFields,
  stripTeacherWriteNoise,
} from '../teacherUtils.js';
import {
  isTeacherDeleted,
  filterActiveTeachers,
} from '../teacherTypes.js';
import { buildDynamicTeacherSchema } from '../schemas/teachers.dto.js';
import { DEFAULT_TEACHERS_SETTINGS } from '../teachersModuleSettings.js';

describe('teacherWriteSchema and soft-delete helpers', () => {
  it('stripTeacherClientSoftDeleteFields strips all soft-delete metadata and deleted flag', () => {
    const raw = {
      id: 't-1',
      employeeId: 'EMP-01',
      deletedAt: '2026-01-01T00:00:00.000Z',
      deletedBy: 'u-1',
      deletionReason: 'Left',
      restoredAt: '2026-02-01T00:00:00.000Z',
      restoredBy: 'u-2',
      deletedWithCascade: true,
      deleted: true,
    };

    const stripped = stripTeacherClientSoftDeleteFields(raw);
    expect(stripped.deletedAt).toBeUndefined();
    expect(stripped.deletedBy).toBeUndefined();
    expect(stripped.deletionReason).toBeUndefined();
    expect(stripped.restoredAt).toBeUndefined();
    expect(stripped.restoredBy).toBeUndefined();
    expect(stripped.deletedWithCascade).toBeUndefined();
    expect(stripped.deleted).toBeUndefined();
    expect(stripped.id).toBe('t-1');
    expect(stripped.employeeId).toBe('EMP-01');
  });

  it('stripTeacherWriteNoise removes contact profile keys, avatar, and soft delete keys', () => {
    const raw = {
      contactId: 'c-1',
      name: 'Teacher Name',
      phone: '+923001234567',
      email: 'teacher@test.com',
      gender: 'female',
      avatar: 'https://example.com/avatar.png',
      deletedAt: '2026-01-01T00:00:00.000Z',
      employeeId: 'EMP-02',
    };

    const cleaned = stripTeacherWriteNoise(raw);
    expect(cleaned.name).toBeUndefined();
    expect(cleaned.phone).toBeUndefined();
    expect(cleaned.email).toBeUndefined();
    expect(cleaned.gender).toBeUndefined();
    expect(cleaned.avatar).toBeUndefined();
    expect(cleaned.deletedAt).toBeUndefined();
    expect(cleaned.contactId).toBe('c-1');
    expect(cleaned.employeeId).toBe('EMP-02');
  });

  it('buildDynamicTeacherSchema strips soft-delete metadata and strictly validates fields', () => {
    const schema = buildDynamicTeacherSchema(DEFAULT_TEACHERS_SETTINGS, new Set(['basic']), {
      basic: [
        { key: 'contactId', label: 'Contact', type: 'text', enabled: true, required: true, order: 1 },
        { key: 'employeeId', label: 'Employee ID', type: 'text', enabled: true, required: false, order: 2 },
        { key: 'status', label: 'Status', type: 'text', enabled: true, required: false, order: 3 },
      ],
    });

    const parsed = schema.safeParse({
      contactId: 'c-1',
      employeeId: 'EMP-03',
      status: 'active',
      deletedAt: '2026-01-01T00:00:00.000Z',
      deletedBy: 'u-1',
      deletionReason: 'Archived',
      deleted: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const data = parsed.data as Record<string, unknown>;
      expect(data).not.toHaveProperty('deletedAt');
      expect(data).not.toHaveProperty('deletedBy');
      expect(data).not.toHaveProperty('deletionReason');
      expect(data).not.toHaveProperty('deleted');
      expect(data.contactId).toBe('c-1');
      expect(data.employeeId).toBe('EMP-03');
    }
  });

  it('buildDynamicTeacherSchema rejects unknown properties via strict schema', () => {
    const schema = buildDynamicTeacherSchema(DEFAULT_TEACHERS_SETTINGS, new Set(['basic']), {
      basic: [
        { key: 'contactId', label: 'Contact', type: 'text', enabled: true, required: true, order: 1 },
      ],
    });

    const parsed = schema.safeParse({
      contactId: 'c-1',
      maliciousField: 'exploit',
    });

    expect(parsed.success).toBe(false);
  });

  it('isTeacherDeleted identifies soft-deleted teachers', () => {
    expect(isTeacherDeleted({ deletedAt: '2026-01-01T00:00:00.000Z' })).toBe(true);
    expect(isTeacherDeleted({ deletedAt: null })).toBe(false);
    expect(isTeacherDeleted({})).toBe(false);
  });

  it('filterActiveTeachers excludes archived teachers', () => {
    const list = [
      { id: '1', status: 'active', contactId: 'c1' },
      { id: '2', status: 'active', contactId: 'c2', deletedAt: '2026-01-01T00:00:00.000Z' },
      { id: '3', status: 'on_leave', contactId: 'c3', deletedAt: null },
    ];

    const active = filterActiveTeachers(list);
    expect(active.map((t) => t.id)).toEqual(['1', '3']);
  });
});
