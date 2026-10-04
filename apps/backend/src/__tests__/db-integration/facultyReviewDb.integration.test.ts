import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDatabase } from '../../db/dbConnection.js';
import { applyDrizzleMigrations } from '../../db/dbInit.js';
import { withTenant } from '../../db/tenant-context.js';
import { requireDatabaseConnection } from './dbTestSupport.js';
import { seedFacultyHierarchy, cleanupFacultyHierarchy, facultyTestTenant as tenant } from './facultyHierarchyFixtures.js';
import { findAncestorChain } from '../../db/repositories/facultyRepositorySubordinates.js';
import { guardFacultyAssignmentDependents } from '../../db/repositories/facultyDeleteGuard.js';
import { listFacultyPage } from '../../db/repositories/facultyRepositoryListQueryPage.js';
import { saveFaculty } from '../../db/repositories/facultyRepository.js';
import {
  findCurrentFacultyDesignationAssignment,
  listFacultyDesignationAssignments,
} from '../../db/repositories/facultyDesignationAssignmentRepository.js';

beforeAll(async () => { await requireDatabaseConnection(); await applyDrizzleMigrations(); await seedFacultyHierarchy(); });
afterAll(async () => {
  await withTenant(tenant, async (tx) => {
    await tx.execute(sql`UPDATE faculty SET reporting_faculty_id = NULL WHERE workspace_subdomain = ${tenant}`);
  });
  await cleanupFacultyHierarchy();
  await closeDatabase();
});

describe('Faculty review fixes against PostgreSQL', () => {
  it('given a legacy supervisor, reads the ancestor chain from the real driver', async () => {
    // Arrange
    await withTenant(tenant, (tx) => tx.execute(sql`UPDATE faculty SET reporting_faculty_id = 'f0'
      WHERE workspace_subdomain = ${tenant} AND id = 'f1'`));
    // Act / Assert
    expect(await findAncestorChain(tenant, 'f1')).toEqual(['f0']);
  });

  it('given an existing ID, insert-only persistence cannot reactivate or replace it', async () => {
    // Arrange
    await withTenant(tenant, (tx) => tx.execute(sql`UPDATE faculty SET deleted_at = now()
      WHERE workspace_subdomain = ${tenant} AND id = 'f24'`));
    // Act / Assert
    await expect(saveFaculty(tenant, { id: 'f24', contactId: 'c23', employeeId: 'DIFFERENT', status: 'active' }, { createOnly: true })).rejects.toThrow();
    await withTenant(tenant, async (tx) => {
      const result = await tx.execute(sql`SELECT contact_id, deleted_at IS NOT NULL AS archived
        FROM faculty WHERE workspace_subdomain = ${tenant} AND id = 'f24'`);
      expect(result.rows).toEqual([{ contact_id: 'c24', archived: true }]);
      await tx.execute(sql`UPDATE faculty SET deleted_at = NULL WHERE workspace_subdomain = ${tenant} AND id = 'f24'`);
    });
  });

  it('given assignment-only reporting, blocks orphaning a child but allows deleting the whole chain', async () => {
    // Act / Assert
    await expect(guardFacultyAssignmentDependents(tenant, ['f0'])).rejects.toMatchObject({ statusCode: 409 });
    await expect(guardFacultyAssignmentDependents(tenant, Array.from({ length: 25 }, (_, i) => `f${i}`))).resolves.toBeUndefined();
  });

  it('given stored custom fields and notes, returns their values in list pages', async () => {
    // Arrange
    await withTenant(tenant, (tx) => tx.execute(sql`UPDATE faculty SET notes = 'Office hours',
      custom_data = '{"office":"Room 12"}'::jsonb WHERE workspace_subdomain = ${tenant} AND id = 'f0'`));
    // Act / Assert
    const page = await listFacultyPage(tenant, {});
    expect(page.faculty.find((row) => row.id === 'f0')).toMatchObject({ office: 'Room 12', notes: 'Office hours' });
  });

  it('given primary faculty_assignments, projects designation-history from FA rows', async () => {
    // Act
    const history = await listFacultyDesignationAssignments(tenant, 'f0');
    const current = await findCurrentFacultyDesignationAssignment(tenant, 'f0', '2024-06-01');

    // Assert
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 'a0',
      facultyId: 'f0',
      designationId: 'g',
      designationName: 'Professor',
      startsOn: '2020-01-01',
      endsOn: null,
    });
    expect(current).toMatchObject({ id: 'a0', designationId: 'g', designationName: 'Professor' });
  });
});
