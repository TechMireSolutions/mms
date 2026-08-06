import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const drizzleDir = join(process.cwd(), 'src/db/migrations_drizzle');

describe('students deferred DB migrations (source)', () => {
  it('0016 adds gender expression index', () => {
    const sql = readFileSync(join(drizzleDir, '0016_students_gender_active_idx.sql'), 'utf8');
    expect(sql).toContain('students_workspace_gender_active_idx');
    expect(sql).toContain("custom_data->>'gender'");
  });

  it('0017 promotes status/gr_number and rebuilds indexes on typed columns', () => {
    const sql = readFileSync(join(drizzleDir, '0017_students_status_gr_columns.sql'), 'utf8');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "status"');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "gr_number"');
    expect(sql).toContain('students_workspace_gr_active_uidx');
    expect(sql).toContain('lower(trim("gr_number"))');
  });

  it('0018 creates FORCE RLS student_lookups', () => {
    const sql = readFileSync(join(drizzleDir, '0018_student_lookups.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "student_lookups"');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
  });

  it('0019 nulls orphan contact_id then adds composite FK SET NULL', () => {
    const sql = readFileSync(join(drizzleDir, '0019_students_contact_fk.sql'), 'utf8');
    expect(sql).toContain('SET "contact_id" = NULL');
    expect(sql).toContain('students_workspace_subdomain_contact_id_contacts_workspace_subdomain_id_fk');
    expect(sql).toContain('ON DELETE set null');
  });
});

describe('students sync integrity (source)', () => {
  it('migrate-GR wraps saveStudent with unique conflict mapping', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/services/studentService.ts'),
      'utf8',
    );
    expect(src).toMatch(/migrateStudentsMissingGrNumbers[\s\S]*throwGrUniqueConflict/);
  });

  it('list status/GR expressions use typed columns only', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/db/repositories/studentRepositoryList.ts'),
      'utf8',
    );
    expect(src).toContain("COALESCE(${students.status}, 'active')");
    expect(src).toContain("COALESCE(${students.grNumber}, '')");
    expect(src).not.toContain("customData}->>'status'");
    expect(src).not.toMatch(/grNumberExpr[\s\S]*customData}->>'grNumber'/);
  });
});
