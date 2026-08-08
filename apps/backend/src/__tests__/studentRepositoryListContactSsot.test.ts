import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listSrc = readFileSync(
  join(process.cwd(), 'src/db/repositories/studentRepositoryList.ts'),
  'utf8',
);

describe('studentRepositoryList Contacts SSOT', () => {
  it('filters and sorts gender/dob/name from linked contacts, not student custom_data', () => {
    expect(listSrc).toContain('linkedContactGenderExpr');
    expect(listSrc).toContain('linkedContactDobExpr');
    expect(listSrc).toContain('linkedContactNameSortExpr');
    expect(listSrc).toMatch(/SELECT c\.custom_data->>'gender'/);
    expect(listSrc).toMatch(/SELECT c\.custom_data->>'dob'/);
    expect(listSrc).toContain('FROM contacts c');
    expect(listSrc).not.toMatch(/customData}->>'gender'/);
    expect(listSrc).not.toMatch(/customData}->>'dob'/);
    expect(listSrc).not.toMatch(/customData}->>'name'/);
  });

  it('searches contact display name and keeps student GR / studentId / cnic only', () => {
    expect(listSrc).toContain("c.custom_data->>'name'");
    expect(listSrc).toContain("COALESCE(${students.grNumber}, '')");
    expect(listSrc).toContain("customData}->>'studentId'");
    expect(listSrc).toContain("customData}->>'cnic'");
    expect(listSrc).not.toContain("customData}->>'fatherName'");
    expect(listSrc).not.toContain("customData}->>'guardianName'");
  });
});
