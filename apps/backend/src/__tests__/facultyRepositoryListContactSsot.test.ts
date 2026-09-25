import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listQuerySqlSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/facultyRepositoryListQuerySql.ts'),
  'utf8',
);
const listQueryOpsSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/facultyRepositoryListQueryOps.ts'),
  'utf8',
);
const listOpsSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/facultyRepositoryListOps.ts'),
  'utf8',
);
const listBarrelSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/facultyRepositoryList.ts'),
  'utf8',
);

describe('facultyRepositoryList Contacts SSOT', () => {
  it('sorts and searches display name from linked contacts via typed contactId', () => {
    expect(listQuerySqlSrc).toContain('linkedContactNameSortExpr');
    expect(listQuerySqlSrc).toContain('buildSearchSql');
    expect(listQuerySqlSrc).toContain('FROM ${contacts} c');
    expect(listQuerySqlSrc).toContain('faculty.contactId');
    expect(listQuerySqlSrc).toContain('c.name');
    expect(listQuerySqlSrc).not.toMatch(/faculty\.(name|gender)/);
  });

  it('filters employeeId and specialization from typed faculty columns', () => {
    expect(listQuerySqlSrc).toContain('COALESCE(${faculty.employeeId}');
    expect(listQuerySqlSrc).toContain('specializationExpr');
    expect(listOpsSrc).toContain('aggregateFacultyCommandMetrics');
    expect(listBarrelSrc).toContain('aggregateFacultyCommandMetrics');
  });

  it('filters gender from the linked contact and supports quickFilter presets', () => {
    expect(listQuerySqlSrc).toContain('linkedContactGenderExpr');
    expect(listQuerySqlSrc).toContain('FROM ${contacts} c');
    expect(listQuerySqlSrc).toContain('c.gender');
    expect(listQuerySqlSrc).toContain('missingEmployeeId');
    expect(listQuerySqlSrc).toContain('facultyStatusExpr()');
    expect(listQuerySqlSrc).toContain('facultyQuickFilterStatusValue');
    expect(listQuerySqlSrc).toContain('query.gender');
  });

  it('lists active faculty missing an employee id for backfill', () => {
    expect(listQueryOpsSrc).toContain('listActiveFacultyMissingEmployeeId');
    expect(listQueryOpsSrc).toContain('NULLIF(trim(COALESCE(${faculty.employeeId}, \'\')), \'\') IS NULL');
    expect(listBarrelSrc).toContain('listActiveFacultyMissingEmployeeId');
  });
});
