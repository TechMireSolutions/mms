import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { withGlobalTenant, withTenant } from '../../db/tenant-context.js';
import { workspaces, contacts, faculty, facultyDepartments, facultyDesignations, facultyAssignments } from '../../db/schema.js';

export const facultyTestTenant = `faculty-${randomUUID().slice(0, 8)}`;
export const facultyOtherTenant = `${facultyTestTenant}-other`;
export const facultyTestRole = `faculty_test_${randomUUID().replaceAll('-', '')}`;

export async function seedFacultyHierarchy(): Promise<void> {
  await withGlobalTenant(async (tx) => {
    await tx.execute(sql`CREATE ROLE ${sql.identifier(facultyTestRole)} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await tx.execute(sql`GRANT USAGE ON SCHEMA public TO ${sql.identifier(facultyTestRole)}`);
    await tx.execute(sql`GRANT SELECT, INSERT, UPDATE ON faculty, faculty_assignments,
      faculty_departments, faculty_designations TO ${sql.identifier(facultyTestRole)}`);
    for (const tenant of [facultyTestTenant, facultyOtherTenant]) {
      await tx.insert(workspaces).values({ id: tenant, subdomain: tenant, madrasaName: tenant });
      await tx.insert(contacts).values(Array.from({ length: 25 }, (_, i) => ({
        id: `c${i}`, workspaceSubdomain: tenant, firstName: `Person ${i}`, name: `Person ${i}`,
      })));
      await tx.insert(faculty).values(Array.from({ length: 25 }, (_, i) => ({
        id: `f${i}`, workspaceSubdomain: tenant, contactId: `c${i}`, employeeId: `E${i}`,
      })));
      await tx.insert(facultyDepartments).values({ id: 'd', workspaceSubdomain: tenant, name: 'Department', code: 'D' });
      await tx.insert(facultyDesignations).values({
        id: 'g', workspaceSubdomain: tenant, name: 'Professor', code: 'P', hierarchyRank: 1,
      });
      await tx.insert(facultyAssignments).values(Array.from({ length: 25 }, (_, i) => ({
        id: `a${i}`, workspaceSubdomain: tenant, facultyId: `f${i}`, departmentId: 'd', designationId: 'g',
        reportsToAssignmentId: i ? `a${i - 1}` : null, startDate: '2020-01-01', isPrimary: true,
      })));
    }
  });
}

export async function cleanupFacultyHierarchy(): Promise<void> {
  await withGlobalTenant(async (tx) => {
    await tx.execute(sql`SET LOCAL app.allow_hard_purge = 'true'`);
    for (const tenant of [facultyTestTenant, facultyOtherTenant]) {
      await tx.execute(sql`UPDATE faculty_assignments SET reports_to_assignment_id = NULL WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM faculty_assignments WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`UPDATE faculty_departments SET head_faculty_id = NULL WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM faculty_departments WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM faculty_designations WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM faculty WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM contacts WHERE workspace_subdomain = ${tenant}`);
      await tx.execute(sql`DELETE FROM workspaces WHERE subdomain = ${tenant}`);
    }
    await tx.execute(sql`DROP OWNED BY ${sql.identifier(facultyTestRole)}`);
    await tx.execute(sql`DROP ROLE ${sql.identifier(facultyTestRole)}`);
  });
}

export async function withFacultyRls<T>(tenant: string, callback: Parameters<typeof withTenant<T>>[1]) {
  return withTenant(tenant, async (tx) => {
    await tx.execute(sql`SET LOCAL ROLE ${sql.identifier(facultyTestRole)}`);
    return callback(tx);
  });
}
