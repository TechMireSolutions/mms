import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FACULTY_COLUMN_REGISTRY,
  DEFAULT_FACULTY_EXPORT_COLUMNS,
  FACULTY_COLUMN_FIELD_MAPPING,
  FACULTY_DIRECTORY_COLUMN_SURFACES,
  FACULTY_SORT_FIELDS,
  FACULTY_SORT_FIELD_SET,
  FACULTY_WORK_COLUMN_KEYS,
  facultyColumnLabelKey,
  facultyFieldLabelKey,
  facultyWorkColumnLabelsFrom,
} from './facultyDirectoryColumns.js';
import { customFieldKeyFromColumnKey } from './moduleColumnCore.js';

describe('FACULTY_DIRECTORY_COLUMN_SURFACES', () => {
  it('derives work keys that are a subset of sort keys', () => {
    for (const workKey of FACULTY_WORK_COLUMN_KEYS) {
      expect(FACULTY_SORT_FIELD_SET.has(workKey)).toBe(true);
    }
    expect(FACULTY_SORT_FIELDS).toContain('name');
    expect(FACULTY_SORT_FIELDS).toContain('employeeId');
    expect(FACULTY_SORT_FIELDS).toContain('updatedAt');
  });

  it('builds default Work registry as name + work keys in workOrder', () => {
    expect(DEFAULT_FACULTY_COLUMN_REGISTRY.map((col) => col.key)).toEqual([
      'name',
      ...FACULTY_WORK_COLUMN_KEYS,
    ]);
  });

  it('maps every work column (except name) for Setup field sync', () => {
    for (const workKey of FACULTY_WORK_COLUMN_KEYS) {
      expect(FACULTY_COLUMN_FIELD_MAPPING[workKey]).toEqual(
        expect.objectContaining({ tabId: expect.any(String), fieldId: expect.any(String) }),
      );
    }
  });

  it('derives export columns from export-flagged surfaces in exportOrder', () => {
    expect(DEFAULT_FACULTY_EXPORT_COLUMNS.map((col) => col.id)).toEqual([
      'name',
      'employeeId',
      'designation',
      'department',
      'reportingFacultyName',
      'specialization',
      'status',
      'employDesignationStatus',
      'profileStatus',
      'qualification',
      'employmentStartDate',
      'designationStartDate',
      'employmentEndDate',
      'performanceRating',
    ]);
    expect(
      FACULTY_DIRECTORY_COLUMN_SURFACES.filter((surface) => surface.export).map((s) => s.key).sort(),
    ).toEqual([...DEFAULT_FACULTY_EXPORT_COLUMNS.map((col) => col.id)].sort());
  });

  it('resolves a column label key from the surface table', () => {
    expect(facultyColumnLabelKey('name')).toBe('faculty.field.name');
    expect(facultyColumnLabelKey('employeeId')).toBe('faculty.field.employeeId');
    expect(facultyColumnLabelKey('designation')).toBe('faculty.field.designation');
    expect(facultyColumnLabelKey('status')).toBe('faculty.field.status');
    expect(facultyColumnLabelKey('specialization')).toBe('faculty.field.specialization');
    expect(facultyColumnLabelKey('qualification')).toBe('faculty.field.qualification');
    expect(facultyColumnLabelKey('joinDate')).toBe('faculty.field.joinDate');
    expect(facultyColumnLabelKey('updatedAt')).toBe('faculty.field.updatedAt');
  });

  it('falls back to facultyFieldLabelKey when column key is not in surface table', () => {
    expect(facultyColumnLabelKey('notes')).toBe('faculty.field.notes');
    expect(facultyColumnLabelKey('custom:cert')).toBe('faculty.field.custom:cert');
  });

  it('formats custom field keys via customFieldKeyFromColumnKey', () => {
    expect(customFieldKeyFromColumnKey('custom:licenseNumber')).toBe('licenseNumber');
    expect(customFieldKeyFromColumnKey('name')).toBeNull();
    expect(customFieldKeyFromColumnKey('employeeId')).toBeNull();
  });

  it('builds translated Work column labels from resolver', () => {
    const labels = facultyWorkColumnLabelsFrom((key) => `LABEL_${key.toUpperCase()}`);
    expect(labels).toEqual({
      name: 'LABEL_NAME',
      designation: 'LABEL_DESIGNATION',
      department: 'LABEL_DEPARTMENT',
      employmentStartDate: 'LABEL_EMPLOYMENTSTARTDATE',
      performanceRating: 'LABEL_PERFORMANCERATING',
      status: 'LABEL_STATUS',
    });
  });

  it('formats fallback field label keys', () => {
    expect(facultyFieldLabelKey('customField')).toBe('faculty.field.customField');
  });
});
