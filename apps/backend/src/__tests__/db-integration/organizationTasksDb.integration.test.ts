/**
 * @file organizationTasksDb.integration.test.ts
 * @description Position-based task delegation against live PostgreSQL.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDatabase } from '../../db/dbConnection.js';
import { applyDrizzleMigrations } from '../../db/dbInit.js';
import { requireDatabaseConnection } from './dbTestSupport.js';
import { withTenant } from '../../db/tenant-context.js';
import { findEligibleTaskRecipientRows } from '../../db/repositories/taskRecipientRepository.js';
import {
  archiveOrganizationPosition,
  restoreOrganizationPosition,
} from '../../db/repositories/organizationTrashRepository.js';
import { findOrganizationPositionById } from '../../db/repositories/organizationPositionRepository.js';
import {
  cleanupOrganizationTasks,
  orgTasksTenant as tenant,
  seedOrganizationTasks,
} from './organizationTasksFixtures.js';

beforeAll(async () => {
  await requireDatabaseConnection();
  await applyDrizzleMigrations();
  await seedOrganizationTasks();
});
afterAll(async () => {
  await cleanupOrganizationTasks();
  await closeDatabase();
});

describe('Position-based task delegation against PostgreSQL', () => {
  it('given a manager, should include recursive descendants with logins and exclude peers', async () => {
    const rows = await findEligibleTaskRecipientRows(tenant, 'u-it', {
      delegationScope: 'descendants',
      allowSelfAssignment: true,
    });
    const facultyIds = [...new Set(rows.map((r) => r.facultyId))].sort();
    expect(facultyIds).toEqual(['f-it', 'f-off']);
    expect(rows.some((r) => r.facultyId === 'f-fin')).toBe(false);
    expect(rows.some((r) => r.facultyId === 'f-nologin')).toBe(false);
  });

  it('given direct_reports scope, should only include immediate child positions', async () => {
    const rows = await findEligibleTaskRecipientRows(tenant, 'u-gm', {
      delegationScope: 'direct_reports',
      allowSelfAssignment: false,
    });
    const facultyIds = [...new Set(rows.map((r) => r.facultyId))].sort();
    expect(facultyIds).toEqual(['f-fin', 'f-it']);
    expect(rows.some((r) => r.facultyId === 'f-off')).toBe(false);
  });

  it('given assign_anywhere, should include all login-backed occupants', async () => {
    const rows = await findEligibleTaskRecipientRows(tenant, 'u-off', {
      canAssignAnywhere: true,
      allowSelfAssignment: true,
    });
    const facultyIds = [...new Set(rows.map((r) => r.facultyId))].sort();
    expect(facultyIds).toEqual(['f-fin', 'f-gm', 'f-it', 'f-off']);
  });

  it('given multiple positions for one actor, should union descendant trees', async () => {
    const rows = await findEligibleTaskRecipientRows(tenant, 'u-it', {
      delegationScope: 'descendants',
      allowSelfAssignment: false,
    });
    expect(rows.some((r) => r.positionId === 'p-off')).toBe(true);
    expect(rows.filter((r) => r.facultyId === 'f-off').length).toBeGreaterThanOrEqual(1);
  });

  it('given an occupied position, should reject archive until assignments are cleared', async () => {
    const blocked = await archiveOrganizationPosition(tenant, 'p-group-it', 'u-gm');
    expect(blocked.success).toBe(false);
    expect(blocked.reason).toMatch(/active staff assignments/i);

    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`UPDATE faculty_assignments SET deleted_at = NOW(), deleted_by = 'u-gm'
        WHERE workspace_subdomain = ${tenant} AND id = 'a-it-group'`);
    });
    const archived = await archiveOrganizationPosition(tenant, 'p-group-it', 'u-gm');
    expect(archived.success).toBe(true);
    expect(await findOrganizationPositionById(tenant, 'p-group-it')).toBeNull();

    const restored = await restoreOrganizationPosition(tenant, 'p-group-it', 'u-gm');
    expect(restored?.id).toBe('p-group-it');
    expect(await findOrganizationPositionById(tenant, 'p-group-it')).not.toBeNull();
  });

  it('given self-assignment disabled, should omit the actor', async () => {
    const rows = await findEligibleTaskRecipientRows(tenant, 'u-it', {
      allowSelfAssignment: false,
      delegationScope: 'descendants',
    });
    expect(rows.some((r) => r.userId === 'u-it')).toBe(false);
  });
});
