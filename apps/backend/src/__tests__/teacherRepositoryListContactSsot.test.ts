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
    expect(listQuerySrc).toMatch(/FROM contacts c/);
    expect(listQuerySrc).toContain('teachers.contactId');
    expect(listQuerySrc).toContain("c.custom_data->>'name'");
    expect(listQuerySrc).not.toMatch(/customData}->>'name'/);
    expect(listQuerySrc).not.toMatch(/customData}->>'contactId'/);
  });

  it('filters employeeId and specialization from teacher row JSONB', () => {
    expect(listQuerySrc).toContain("customData}->>'employeeId'");
    expect(listQuerySrc).toContain('specializationExpr');
    expect(listOpsSrc).toContain('aggregateTeachersCommandMetrics');
    expect(listBarrelSrc).toContain('aggregateTeachersCommandMetrics');
  });

  it('filters gender from the linked contact and supports quickFilter presets', () => {
    expect(listQuerySrc).toContain('linkedContactGenderExpr');
    expect(listQuerySrc).toMatch(/FROM contacts c/);
    expect(listQuerySrc).toContain("c.custom_data->>'gender'");
    expect(listQuerySrc).not.toMatch(/customData}->>'gender'/);
    expect(listQuerySrc).toContain('missingEmployeeId');
    expect(listQuerySrc).toContain('teacherStatusExpr()');
    expect(listQuerySrc).toContain('teachersQuickFilterStatusValue');
    expect(listQuerySrc).toContain('query.gender');
  });

  it('lists active teachers missing an employee id for backfill', () => {
    expect(listQuerySrc).toContain('listActiveTeachersMissingEmployeeId');
    expect(listQuerySrc).toMatch(/NULLIF\(trim\(COALESCE\(\$\{teachers\.customData\}->>'employeeId', ''\)\), ''\) IS NULL/);
    expect(listBarrelSrc).toContain('listActiveTeachersMissingEmployeeId');
  });
});
