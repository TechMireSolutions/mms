import { describe, expect, it } from 'vitest';
import { parseFacultyMembersCsv } from './facultyCsvParser.js';
import { parseFacultyDepartmentsCsv } from './facultyDepartmentCsvParser.js';
import { parseFacultyDesignationsCsv } from './facultyDesignationCsvParser.js';
import { facultyDepartmentsToCsv } from './facultyCatalogCsv.js';

describe('faculty CSV parsers', () => {
  it('parses faculty member rows', () => {
    const rows = parseFacultyMembersCsv(
      'employeeId,contactId,department,designation\nE1,c1,HIFZ,INST\n',
    );
    expect(rows).toEqual([
      { employeeId: 'E1', contactId: 'c1', department: 'HIFZ', designation: 'INST' },
    ]);
  });

  it('parses department and designation catalogs', () => {
    const depts = parseFacultyDepartmentsCsv(
      'code,name,parentCode,isActive\nHIFZ,Hifz,,true\nNAZ,Nazira,HIFZ,false\n',
    );
    expect(depts).toHaveLength(2);
    expect(depts[1]).toMatchObject({ code: 'NAZ', parentCode: 'HIFZ', isActive: false });

    const desigs = parseFacultyDesignationsCsv(
      'code,name,hierarchyRank,isActive,assignableRoles\nINST,Instructor,10,true,teacher;admin\n',
    );
    expect(desigs[0]?.assignableRoles).toEqual(['teacher', 'admin']);
  });

  it('round-trips department export headers', () => {
    const csv = facultyDepartmentsToCsv([
      {
        id: '1',
        code: 'HIFZ',
        name: 'Hifz',
        isActive: true,
        parentId: null,
      },
    ]);
    expect(csv.split('\n')[0]).toContain('code');
    expect(parseFacultyDepartmentsCsv(csv)[0]?.code).toBe('HIFZ');
  });
});
