/**
 * @file organizationTasksFixtures.ts
 * @description DB fixtures for position hierarchy + task delegation integration tests.
 */

import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { withGlobalTenant } from '../../db/tenant-context.js';
import {
  workspaces, contacts, faculty, facultyDepartments, facultyDesignations,
  facultyAssignments, facultyEmployments, organizationPositions, tenantUsers,
} from '../../db/schema.js';

export const orgTasksTenant = `orgtasks-${randomUUID().slice(0, 8)}`;

export async function seedOrganizationTasks(): Promise<void> {
  const tenant = orgTasksTenant;
  await withGlobalTenant(async (tx) => {
    await tx.insert(workspaces).values({
      id: tenant, subdomain: tenant, madrasaName: tenant, timezone: 'UTC',
    });
    await tx.insert(contacts).values([
      { id: 'c-gm', workspaceSubdomain: tenant, firstName: 'General', lastName: 'Manager', name: 'General Manager' },
      { id: 'c-it', workspaceSubdomain: tenant, firstName: 'IT', lastName: 'Manager', name: 'IT Manager' },
      { id: 'c-off', workspaceSubdomain: tenant, firstName: 'IT', lastName: 'Officer', name: 'IT Officer' },
      { id: 'c-fin', workspaceSubdomain: tenant, firstName: 'Finance', lastName: 'Manager', name: 'Finance Manager' },
      { id: 'c-nologin', workspaceSubdomain: tenant, firstName: 'No', lastName: 'Login', name: 'No Login' },
    ]);
    await tx.insert(tenantUsers).values([
      { id: 'u-gm', workspaceSubdomain: tenant, loginEmail: `gm@${tenant}.test`, name: 'GM', passwordHash: 'x' },
      { id: 'u-it', workspaceSubdomain: tenant, loginEmail: `it@${tenant}.test`, name: 'IT', passwordHash: 'x' },
      { id: 'u-off', workspaceSubdomain: tenant, loginEmail: `off@${tenant}.test`, name: 'Officer', passwordHash: 'x' },
      { id: 'u-fin', workspaceSubdomain: tenant, loginEmail: `fin@${tenant}.test`, name: 'Finance', passwordHash: 'x' },
    ]);
    await tx.insert(facultyEmployments).values([
      { id: 'emp-gm', workspaceSubdomain: tenant, contactId: 'c-gm', employeeId: 'E-GM', status: 'active' },
      { id: 'emp-it', workspaceSubdomain: tenant, contactId: 'c-it', employeeId: 'E-IT', status: 'active' },
      { id: 'emp-off', workspaceSubdomain: tenant, contactId: 'c-off', employeeId: 'E-OFF', status: 'active' },
      { id: 'emp-fin', workspaceSubdomain: tenant, contactId: 'c-fin', employeeId: 'E-FIN', status: 'active' },
      { id: 'emp-nologin', workspaceSubdomain: tenant, contactId: 'c-nologin', employeeId: 'E-NL', status: 'active' },
    ]);
    await tx.insert(faculty).values([
      { id: 'f-gm', workspaceSubdomain: tenant, employmentId: 'emp-gm', userId: 'u-gm' },
      { id: 'f-it', workspaceSubdomain: tenant, employmentId: 'emp-it', userId: 'u-it' },
      { id: 'f-off', workspaceSubdomain: tenant, employmentId: 'emp-off', userId: 'u-off' },
      { id: 'f-fin', workspaceSubdomain: tenant, employmentId: 'emp-fin', userId: 'u-fin' },
      { id: 'f-nologin', workspaceSubdomain: tenant, employmentId: 'emp-nologin' },
    ]);
    await tx.insert(facultyDepartments).values({
      id: 'd-it', workspaceSubdomain: tenant, name: 'IT', code: 'IT',
    });
    await tx.insert(facultyDesignations).values({
      id: 'des-mgr', workspaceSubdomain: tenant, name: 'Manager', code: 'MGR', hierarchyRank: 2,
    });
    await tx.insert(organizationPositions).values([
      { id: 'p-gm', workspaceSubdomain: tenant, code: 'GM', name: 'General Manager', capacity: 1 },
      {
        id: 'p-it', workspaceSubdomain: tenant, code: 'IT-MGR', name: 'IT Manager',
        parentPositionId: 'p-gm', departmentId: 'd-it', capacity: 1,
      },
      {
        id: 'p-off', workspaceSubdomain: tenant, code: 'IT-OFF', name: 'IT Officer',
        parentPositionId: 'p-it', departmentId: 'd-it', capacity: 2,
      },
      {
        id: 'p-fin', workspaceSubdomain: tenant, code: 'FIN-MGR', name: 'Finance Manager',
        parentPositionId: 'p-gm', capacity: 1,
      },
      {
        id: 'p-group-it', workspaceSubdomain: tenant, code: 'GRP-IT', name: 'Group IT Coord',
        parentPositionId: 'p-gm', capacity: 1,
      },
    ]);
    await tx.insert(facultyAssignments).values([
      {
        id: 'a-gm', workspaceSubdomain: tenant, facultyId: 'f-gm', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-gm', startDate: '2020-01-01', isPrimary: true,
      },
      {
        id: 'a-it', workspaceSubdomain: tenant, facultyId: 'f-it', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-it', startDate: '2020-01-01', isPrimary: true,
      },
      {
        id: 'a-off', workspaceSubdomain: tenant, facultyId: 'f-off', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-off', startDate: '2020-01-01', isPrimary: true,
      },
      {
        id: 'a-fin', workspaceSubdomain: tenant, facultyId: 'f-fin', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-fin', startDate: '2020-01-01', isPrimary: true,
      },
      {
        id: 'a-it-group', workspaceSubdomain: tenant, facultyId: 'f-it', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-group-it', startDate: '2020-01-01', isPrimary: false,
      },
      {
        id: 'a-nologin', workspaceSubdomain: tenant, facultyId: 'f-nologin', departmentId: 'd-it',
        designationId: 'des-mgr', positionId: 'p-off', startDate: '2020-01-01', isPrimary: false,
      },
    ]);
  });
}

export async function cleanupOrganizationTasks(): Promise<void> {
  const tenant = orgTasksTenant;
  await withGlobalTenant(async (tx) => {
    await tx.execute(sql`SET LOCAL app.allow_hard_purge = 'true'`);
    await tx.execute(sql`DELETE FROM faculty_assignments WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM organization_positions WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM faculty WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM faculty_employments WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM tenant_users WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM faculty_designations WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM faculty_departments WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM contacts WHERE workspace_subdomain = ${tenant}`);
    await tx.execute(sql`DELETE FROM workspaces WHERE subdomain = ${tenant}`);
  });
}
