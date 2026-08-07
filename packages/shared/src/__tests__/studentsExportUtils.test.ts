import { describe, expect, it } from 'vitest';
import {
  filterStudentExportColumnsForViewer,
  buildStudentsExportRows,
  type StudentExportColumn,
} from '../studentsExportUtils.js';
import type { Student } from '../studentTypes.js';
import type { StudentsSettings } from '../studentsModuleSettings.js';

describe('studentsExportUtils', () => {
  const columns: StudentExportColumn[] = [
    { id: 'name', label: 'Name' },
    { id: 'grNumber', label: 'GR Number' },
    { id: 'gender', label: 'Gender' },
    { id: 'dob', label: 'Date of Birth' },
    { id: 'parents', label: 'Parents' },
  ];

  const students: Student[] = [
    {
      id: 's-1',
      contactId: 'c-1',
      name: 'Aisha Siddiqui',
      grNumber: '0001-2026',
      gender: 'female',
      dob: '2015-01-01',
      status: 'active',
    },
  ];

  it('returns all columns when settings have no tab-keyed field registry', () => {
    expect(filterStudentExportColumnsForViewer(columns, null, 'teacher')).toEqual(columns);
    expect(
      filterStudentExportColumnsForViewer(
        columns,
        {
          autoGenerateId: true,
          grNumberTemplate: '{seq}',
          grNumberDigits: 4,
          grNumberRestartAnnually: true,
        },
        'teacher',
      ),
    ).toEqual(columns);
  });

  it('filters columns by tab and field permissions', () => {
    const settings: StudentsSettings = {
      autoGenerateId: true,
      grNumberTemplate: '{seq}-{year}',
      grNumberDigits: 4,
      grNumberRestartAnnually: true,
      formTabs: [
        { key: 'basic', label: 'Basic', enabled: true, order: 0, permissions: ['admin', 'teacher'] },
      ],
      fields: {
        basic: [
          {
            key: 'gender',
            label: 'Gender',
            type: 'select',
            enabled: true,
            order: 0,
            permissions: ['admin'],
          },
          {
            key: 'dob',
            label: 'DOB',
            type: 'date',
            enabled: true,
            order: 1,
            permissions: ['admin', 'teacher'],
          },
          {
            key: 'contactRelationships',
            label: 'Relationships',
            type: 'text',
            enabled: true,
            order: 2,
            permissions: ['admin'],
          },
        ],
      },
    };

    const forTeacher = filterStudentExportColumnsForViewer(columns, settings, 'teacher');
    expect(forTeacher.map((column: StudentExportColumn) => column.id)).toEqual([
      'name',
      'grNumber',
      'dob',
    ]);

    const forAdmin = filterStudentExportColumnsForViewer(columns, settings, 'admin');
    expect(forAdmin.map((column: StudentExportColumn) => column.id)).toEqual([
      'name',
      'grNumber',
      'gender',
      'dob',
      'parents',
    ]);
  });

  it('builds CSV header and rows correctly', () => {
    const rows = buildStudentsExportRows(students, columns.slice(0, 3));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['Name', 'GR Number', 'Gender']);
    expect(rows[1]).toEqual(['Aisha Siddiqui', '0001-2026', 'female']);
  });
});
