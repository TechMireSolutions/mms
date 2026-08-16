import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/studentRepositoryList.ts'),
  'utf8',
);

describe('studentRepositoryList Contacts SSOT', () => {
  it('filters and sorts gender/dob/name from linked contacts, not student columns', () => {
    expect(listSrc).toContain('linkedContactGenderExpr');
    expect(listSrc).toContain('linkedContactDobExpr');
    expect(listSrc).toContain('linkedContactNameSortExpr');
    expect(listSrc).toContain('SELECT c.gender');
    expect(listSrc).toContain('SELECT c.dob');
    expect(listSrc).toContain('FROM ${contacts} c');
    expect(listSrc).not.toMatch(/students\.(gender|dob)/);
  });

  it('searches contact display name and keeps student GR / studentId / cnic', () => {
    expect(listSrc).toContain('lower(COALESCE(c.name, \'\'))');
    expect(listSrc).toContain("COALESCE(${students.grNumber}, '')");
    expect(listSrc).toContain("COALESCE(${students.studentId}, '')");
    expect(listSrc).toContain("COALESCE(c.cnic, '')");
  });
});
