import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_COLUMN_REGISTRY,
  DEFAULT_TEACHER_EXPORT_COLUMNS,
  TEACHER_COLUMN_FIELD_MAPPING,
  TEACHER_DIRECTORY_COLUMN_SURFACES,
  TEACHER_SORT_FIELDS,
  TEACHER_SORT_FIELD_SET,
  TEACHER_WORK_COLUMN_KEYS,
  teacherColumnLabelKey,
  teacherFieldLabelKey,
  teacherWorkColumnLabelsFrom,
} from './teacherDirectoryColumns.js';
import { customFieldKeyFromColumnKey } from './moduleColumnCore.js';

describe('TEACHER_DIRECTORY_COLUMN_SURFACES', () => {
  it('derives work keys that are a subset of sort keys', () => {
    for (const workKey of TEACHER_WORK_COLUMN_KEYS) {
      expect(TEACHER_SORT_FIELD_SET.has(workKey)).toBe(true);
    }
    expect(TEACHER_SORT_FIELDS).toContain('name');
    expect(TEACHER_SORT_FIELDS).toContain('employeeId');
    expect(TEACHER_SORT_FIELDS).toContain('updatedAt');
  });

  it('builds default Work registry as name + work keys in workOrder', () => {
    expect(DEFAULT_TEACHER_COLUMN_REGISTRY.map((col) => col.key)).toEqual([
      'name',
      ...TEACHER_WORK_COLUMN_KEYS,
    ]);
  });

  it('maps every work column (except name) for Setup field sync', () => {
    for (const workKey of TEACHER_WORK_COLUMN_KEYS) {
      expect(TEACHER_COLUMN_FIELD_MAPPING[workKey]).toEqual(
        expect.objectContaining({ tabId: expect.any(String), fieldId: expect.any(String) }),
      );
    }
  });

  it('derives export columns from export-flagged surfaces in exportOrder', () => {
    expect(DEFAULT_TEACHER_EXPORT_COLUMNS.map((col) => col.id)).toEqual([
      'name',
      'employeeId',
      'specialization',
      'status',
      'qualification',
      'joinDate',
    ]);
    expect(
      TEACHER_DIRECTORY_COLUMN_SURFACES.filter((surface) => surface.export).map((s) => s.key).sort(),
    ).toEqual([...DEFAULT_TEACHER_EXPORT_COLUMNS.map((col) => col.id)].sort());
  });

  it('resolves a column label key from the surface table', () => {
    expect(teacherColumnLabelKey('name')).toBe('teachers.field.name');
    expect(teacherColumnLabelKey('employeeId')).toBe('teachers.field.employeeId');
    expect(teacherColumnLabelKey('status')).toBe('teachers.field.status');
  });

  it('falls back to teachers.field.<key> for keys without a surface labelKey', () => {
    expect(teacherColumnLabelKey('updatedAt')).toBe('teachers.field.updatedAt');
    expect(teacherColumnLabelKey('unknownColumn')).toBe('teachers.field.unknownColumn');
  });
});

describe('teacherFieldLabelKey / teacherWorkColumnLabelsFrom', () => {
  it('builds teachers.field.<key> for any field key', () => {
    expect(teacherFieldLabelKey('qualification')).toBe('teachers.field.qualification');
    expect(teacherFieldLabelKey('notes')).toBe('teachers.field.notes');
  });

  it('builds the 5-key Work labels map via the resolver', () => {
    const labels = teacherWorkColumnLabelsFrom((key) => `LABEL:${key}`);
    expect(labels).toEqual({
      name: 'LABEL:name',
      specialization: 'LABEL:specialization',
      qualification: 'LABEL:qualification',
      joinDate: 'LABEL:joinDate',
      status: 'LABEL:status',
    });
  });
});

describe('customFieldKeyFromColumnKey', () => {
  it('extracts the custom field key from a custom: column key', () => {
    expect(customFieldKeyFromColumnKey('custom:house')).toBe('house');
    expect(customFieldKeyFromColumnKey('custom:')).toBe('');
  });

  it('returns null for non-custom column keys', () => {
    expect(customFieldKeyFromColumnKey('name')).toBeNull();
    expect(customFieldKeyFromColumnKey('status')).toBeNull();
    expect(customFieldKeyFromColumnKey('')).toBeNull();
  });
});
