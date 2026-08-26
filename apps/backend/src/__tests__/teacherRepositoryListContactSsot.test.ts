import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listQuerySqlSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryListQuerySql.ts'),
  'utf8',
);
const listQueryOpsSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryListQueryOps.ts'),
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
    expect(listQuerySqlSrc).toContain('linkedContactNameSortExpr');
    expect(listQuerySqlSrc).toContain('buildSearchSql');
    expect(listQuerySqlSrc).toContain('FROM ${contacts} c');
    expect(listQuerySqlSrc).toContain('teachers.contactId');
    expect(listQuerySqlSrc).toContain('c.name');
    expect(listQuerySqlSrc).not.toMatch(/teachers\.(name|gender)/);
  });

  it('filters employeeId and specialization from typed teacher columns', () => {
    expect(listQuerySqlSrc).toContain('COALESCE(${teachers.employeeId}');
    expect(listQuerySqlSrc).toContain('specializationExpr');
    expect(listOpsSrc).toContain('aggregateTeachersCommandMetrics');
    expect(listBarrelSrc).toContain('aggregateTeachersCommandMetrics');
  });

  it('filters gender from the linked contact and supports quickFilter presets', () => {
    expect(listQuerySqlSrc).toContain('linkedContactGenderExpr');
    expect(listQuerySqlSrc).toContain('FROM ${contacts} c');
    expect(listQuerySqlSrc).toContain('c.gender');
    expect(listQuerySqlSrc).toContain('missingEmployeeId');
    expect(listQuerySqlSrc).toContain('teacherStatusExpr()');
    expect(listQuerySqlSrc).toContain('teachersQuickFilterStatusValue');
    expect(listQuerySqlSrc).toContain('query.gender');
  });

  it('lists active teachers missing an employee id for backfill', () => {
    expect(listQueryOpsSrc).toContain('listActiveTeachersMissingEmployeeId');
    expect(listQueryOpsSrc).toContain('NULLIF(trim(COALESCE(${teachers.employeeId}, \'\')), \'\') IS NULL');
    expect(listBarrelSrc).toContain('listActiveTeachersMissingEmployeeId');
  });
});
