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
});
