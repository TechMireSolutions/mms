import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('Teachers contact / employee-id SQL SSOT', () => {
  it('list repo exposes linked-contact and next-employee-id SQL helpers', () => {
    const listBarrelSrc = readFileSync(
      join(here, '../db/repositories/teacherRepositoryList.ts'),
      'utf8',
    );
    const listQuerySrc = readFileSync(
      join(here, '../db/repositories/teacherRepositoryListQuery.ts'),
      'utf8',
    );
    expect(listBarrelSrc).toContain('listTeacherLinkedContactIdsSql');
    expect(listBarrelSrc).toContain('countTeachersForNextEmployeeId');
    expect(listQuerySrc).toContain('teachers.contactId');
  });

  it('contacts list teacher link filter uses typed contact_id', () => {
    const contactListSrc = readFileSync(
      join(here, '../db/repositories/contactRepositoryList.ts'),
      'utf8',
    );
    expect(contactListSrc).toContain('existsActiveTeacherLinkSql');
    expect(contactListSrc).toContain('teachers.contactId');
    expect(contactListSrc).not.toContain("teachers.customData}->>'contactId'");
  });
});
