import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDatabase } from '../../db/dbConnection.js';
import { applyDrizzleMigrations } from '../../db/dbInit.js';
import { withTenant } from '../../db/tenant-context.js';
import { backfillFacultyAssignments } from '../../db/migrations/087_backfill_faculty_assignments.js';
import { requireDatabaseConnection } from './dbTestSupport.js';
import { seedFacultyHierarchy, cleanupFacultyHierarchy, facultyTestTenant as tenant } from './facultyHierarchyFixtures.js';

beforeAll(async () => { await requireDatabaseConnection(); await applyDrizzleMigrations(); await seedFacultyHierarchy(); });
afterAll(async () => { await cleanupFacultyHierarchy(); await closeDatabase(); });

describe('Faculty legacy backfill', () => {
  it('rejects multiple active faculty profiles for the same contact in a workspace', async () => {
    await expect(withTenant(tenant, (tx) => tx.execute(sql`
      INSERT INTO faculty (id, workspace_subdomain, contact_id) VALUES ('duplicate', ${tenant}, 'c0')
    `))).rejects.toThrow();
  });
  it('preserves identity, non-Latin labels, reporting, dates and archived history on replay', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`INSERT INTO contacts (id, workspace_subdomain, first_name, name)
        VALUES ('legacy-contact', ${tenant}, 'Legacy', 'Legacy'), ('archived-contact', ${tenant}, 'Archived', 'Archived')`);
      await tx.execute(sql`INSERT INTO faculty (id, workspace_subdomain, contact_id, department, designation,
        reporting_faculty_id, created_at, deleted_at, deleted_by)
        VALUES ('legacy', ${tenant}, 'legacy-contact', 'العربية', 'أستاذ', 'f0', '2020-05-06T23:00:00Z', NULL, NULL),
          ('archived', ${tenant}, 'archived-contact', NULL, NULL, NULL, '2020-01-02T00:00:00Z', '2021-01-01', 'actor')`);
    });
    await backfillFacultyAssignments(tenant);
    await backfillFacultyAssignments(tenant);
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`SELECT set_config('app.include_deleted', 'true', true)`);
      const result = await tx.execute<{
        faculty_id: string; start_date: string; deleted_by: string | null; reports_to_assignment_id: string | null;
        department: string; designation: string; contact_id: string;
      }>(sql`SELECT a.faculty_id, a.start_date::text, a.deleted_by, a.reports_to_assignment_id,
          d.name AS department, g.name AS designation, f.contact_id
        FROM faculty_assignments a JOIN faculty f ON f.workspace_subdomain = a.workspace_subdomain AND f.id = a.faculty_id
        JOIN faculty_departments d ON d.workspace_subdomain = a.workspace_subdomain AND d.id = a.department_id
        JOIN faculty_designations g ON g.workspace_subdomain = a.workspace_subdomain AND g.id = a.designation_id
        WHERE a.workspace_subdomain = ${tenant} AND a.faculty_id IN ('legacy', 'archived') ORDER BY a.faculty_id`);
      expect(result.rows).toEqual([
        { faculty_id: 'archived', start_date: '2020-01-02', deleted_by: 'actor', reports_to_assignment_id: null,
          department: 'General', designation: 'Faculty Member', contact_id: 'archived-contact' },
        { faculty_id: 'legacy', start_date: '2020-05-06', deleted_by: null, reports_to_assignment_id: 'a0',
          department: 'العربية', designation: 'أستاذ', contact_id: 'legacy-contact' },
      ]);
    });
  });

  it('has a deferred tenant-scoped department head FK and hard-delete guards', async () => {
    await withTenant(tenant, async (tx) => {
      const result = await tx.execute<{ condeferrable: boolean; condeferred: boolean }>(sql`
        SELECT condeferrable, condeferred FROM pg_constraint WHERE conname = 'faculty_departments_head_faculty_fk'
      `);
      expect(result.rows).toEqual([{ condeferrable: true, condeferred: true }]);
    });
    await expect(withTenant(tenant, (tx) => tx.execute(sql`
      DELETE FROM faculty_assignments WHERE workspace_subdomain = ${tenant} AND id = 'a24'
    `))).rejects.toThrow();
    await expect(withTenant(tenant, (tx) => tx.execute(sql`
      UPDATE faculty_departments SET head_faculty_id = 'missing' WHERE workspace_subdomain = ${tenant} AND id = 'd'
    `))).rejects.toThrow();
  });
});
