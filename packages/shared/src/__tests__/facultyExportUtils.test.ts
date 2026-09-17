import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEACHER_EXPORT_COLUMNS,
  DEFAULT_TEACHER_STATUS,
  DEFAULT_TEACHERS_SETTINGS,
  buildTeachersExportRows,
  filterTeacherExportColumnsForViewer,
  type Teacher,
  type TeacherExportColumn,
  type TeachersSettings,
} from '../index.js';

const ALL_COLUMNS: TeacherExportColumn[] = [
  ...DEFAULT_TEACHER_EXPORT_COLUMNS,
  { id: 'custom:extraNote', label: 'Extra' },
];

describe('filterTeacherExportColumnsForViewer', () => {
  it('keeps always-visible employeeId even when the seed field is disabled', () => {
    const settings: TeachersSettings = {
      ...DEFAULT_TEACHERS_SETTINGS,
      fields: {
        basic: [
          { key: 'specialization', label: 'Specialization', type: 'select', enabled: true, order: 0 },
          { key: 'qualification', label: 'Qualification', type: 'text', enabled: true, order: 1 },
        ],
        employment: [
          { key: 'employeeId', label: 'Employee ID', type: 'text', enabled: false, order: 0 },
          { key: 'status', label: 'Status', type: 'select', enabled: true, order: 1 },
          { key: 'joinDate', label: 'Join', type: 'date', enabled: true, order: 2 },
        ],
      },
      enabledTabs: ['basic', 'employment'],
    };

    const filtered = filterTeacherExportColumnsForViewer(ALL_COLUMNS, settings, 'admin');
    expect(filtered.some((col) => col.id === 'employeeId')).toBe(true);
    expect(filtered.some((col) => col.id === 'name')).toBe(true);
  });

  it('drops specialization when the Setup field is disabled', () => {
    const settings: TeachersSettings = {
      ...DEFAULT_TEACHERS_SETTINGS,
      fields: {
        basic: [
          { key: 'specialization', label: 'Specialization', type: 'select', enabled: false, order: 0 },
          { key: 'qualification', label: 'Qualification', type: 'text', enabled: true, order: 1 },
        ],
        employment: [
          { key: 'status', label: 'Status', type: 'select', enabled: true, order: 0 },
          { key: 'joinDate', label: 'Join', type: 'date', enabled: true, order: 1 },
        ],
      },
      enabledTabs: ['basic', 'employment'],
    };

    const filtered = filterTeacherExportColumnsForViewer(ALL_COLUMNS, settings);
    expect(filtered.some((col) => col.id === 'specialization')).toBe(false);
    expect(filtered.some((col) => col.id === 'qualification')).toBe(true);
  });

  it('drops custom columns when the draft field is disabled', () => {
    const settings: TeachersSettings = {
      ...DEFAULT_TEACHERS_SETTINGS,
      fields: {
        employment: [
          { key: 'extraNote', label: 'Extra', type: 'text', enabled: false, order: 0 },
          { key: 'status', label: 'Status', type: 'select', enabled: true, order: 1 },
        ],
      },
      enabledTabs: ['basic', 'employment'],
    };

    const filtered = filterTeacherExportColumnsForViewer(ALL_COLUMNS, settings);
    expect(filtered.some((col) => col.id === 'custom:extraNote')).toBe(false);
  });

  it('returns defaults when columns are empty and settings are absent', () => {
    const filtered = filterTeacherExportColumnsForViewer([]);
    expect(filtered.map((col) => col.id)).toEqual(
      DEFAULT_TEACHER_EXPORT_COLUMNS.map((col) => col.id),
    );
  });
});

describe('buildTeachersExportRows', () => {
  it('resolves system and custom cells via directory column keys', () => {
    const teacher = {
      id: 't1',
      contactId: 'c1',
      name: 'Ada',
      employeeId: 'TCH-1',
      specialization: 'Hifz',
      qualification: 'Ijazah',
      joinDate: '2024-01-01',
      status: '',
      extraNote: 'Hello',
    } as Teacher & { extraNote: string };

    const table = buildTeachersExportRows([teacher], [
      { id: 'name', label: 'Name' },
      { id: 'status', label: 'Status' },
      { id: 'custom:extraNote', label: 'Extra' },
    ]);
    expect(table[0]).toEqual(['Name', 'Status', 'Extra']);
    expect(table[1]).toEqual(['Ada', DEFAULT_TEACHER_STATUS, 'Hello']);
  });
});
