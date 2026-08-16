import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listQuerySrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryListQuery.ts'),
  'utf8',
);
const listOpsSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryListOps.ts'),
  'utf8',
);
const listBarrelSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryList.ts'),
  'utf8',
);

describe('teacherRepositoryList Contacts SSOT', () => {
  it('sorts and searches display name from linked contacts via typed contactId', () => {
    expect(listQuerySrc).toContain('linkedContactNameSortExpr');
    expect(listQuerySrc).toContain('buildSearchSql');
    expect(listQuerySrc).toContain('FROM ${contacts} c');
    expect(listQuerySrc).toContain('teachers.contactId');
    expect(listQuerySrc).toContain('c.name');
    expect(listQuerySrc).not.toMatch(/teachers\.(name|gender)/);
  });

  it('filters employeeId and specialization from typed teacher columns', () => {
    expect(listQuerySrc).toContain('COALESCE(${teachers.employeeId}');
    expect(listQuerySrc).toContain('specializationExpr');
    expect(listOpsSrc).toContain('aggregateTeachersCommandMetrics');
    expect(listBarrelSrc).toContain('aggregateTeachersCommandMetrics');
  });

  it('filters gender from the linked contact and supports quickFilter presets', () => {
    expect(listQuerySrc).toContain('linkedContactGenderExpr');
    expect(listQuerySrc).toContain('FROM ${contacts} c');
    expect(listQuerySrc).toContain('c.gender');
    expect(listQuerySrc).toContain('missingEmployeeId');
    expect(listQuerySrc).toContain('teacherStatusExpr()');
    expect(listQuerySrc).toContain('teachersQuickFilterStatusValue');
    expect(listQuerySrc).toContain('query.gender');
  });

  it('lists active teachers missing an employee id for backfill', () => {
    expect(listQuerySrc).toContain('listActiveTeachersMissingEmployeeId');
    expect(listQuerySrc).toContain('NULLIF(trim(COALESCE(${teachers.employeeId}, \'\')), \'\') IS NULL');
    expect(listBarrelSrc).toContain('listActiveTeachersMissingEmployeeId');
  });
});
