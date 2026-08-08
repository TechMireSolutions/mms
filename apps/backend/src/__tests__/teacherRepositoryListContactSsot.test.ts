import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/teacherRepositoryList.ts'),
  'utf8',
);

describe('teacherRepositoryList Contacts SSOT', () => {
  it('sorts and searches display name from linked contacts via typed contactId', () => {
    expect(listSrc).toContain('linkedContactNameSortExpr');
    expect(listSrc).toContain('buildSearchSql');
    expect(listSrc).toMatch(/FROM contacts c/);
    expect(listSrc).toContain('teachers.contactId');
    expect(listSrc).toContain("c.custom_data->>'name'");
    expect(listSrc).not.toMatch(/customData}->>'name'/);
    expect(listSrc).not.toMatch(/customData}->>'contactId'/);
  });

  it('filters employeeId and specialization from teacher row JSONB', () => {
    expect(listSrc).toContain("customData}->>'employeeId'");
    expect(listSrc).toContain('specializationExpr');
    expect(listSrc).toContain('aggregateTeachersCommandMetrics');
  });
});
