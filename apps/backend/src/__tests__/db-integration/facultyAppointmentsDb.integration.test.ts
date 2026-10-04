import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDatabase } from '../../db/dbConnection.js';
import { applyDrizzleMigrations } from '../../db/dbInit.js';
import { withTenant } from '../../db/tenant-context.js';
import { saveFacultyAssignment, closeAssignment } from '../../db/repositories/facultyAssignmentRepository.js';
import { saveFacultyDepartment, softDeleteFacultyDepartment } from '../../db/repositories/facultyDepartmentRepository.js';
import { listFacultyDesignations, saveFacultyDesignation, softDeleteFacultyDesignation } from '../../db/repositories/facultyDesignationRepository.js';
import { requireDatabaseConnection } from './dbTestSupport.js';
import { seedFacultyHierarchy, cleanupFacultyHierarchy, facultyTestTenant as tenant } from './facultyHierarchyFixtures.js';

beforeAll(async () => { await requireDatabaseConnection(); await applyDrizzleMigrations(); await seedFacultyHierarchy(); });
afterAll(async () => { await cleanupFacultyHierarchy(); await closeDatabase(); });

function appointment(id: string, overrides = {}) {
  return {
    id,
    workspaceSubdomain: tenant,
    facultyId: 'f0',
    departmentId: 'd',
    designationId: 'g',
    positionId: 'pos-d-g',
    startDate: '2025-01-01',
    isPrimary: false,
    ...overrides,
  };
}

describe('Faculty appointment integrity', () => {
  it('rejects overlapping primary periods but allows secondary appointments', async () => {
    await expect(saveFacultyAssignment(tenant, appointment('primary', { isPrimary: true }))).rejects.toThrow('overlaps');
    await expect(saveFacultyAssignment(tenant, appointment('secondary'))).resolves.toBeUndefined();
  });

  it('retains historical primary dates and rejects an inclusive boundary overlap', async () => {
    await closeAssignment(tenant, 'a0', '2024-12-31');
    await expect(saveFacultyAssignment(tenant, appointment('boundary', {
      startDate: '2024-12-31', endDate: '2025-01-01', isPrimary: true,
    }))).rejects.toThrow('overlaps');
    await expect(saveFacultyAssignment(tenant, appointment('next', { isPrimary: true }))).resolves.toBeUndefined();
  });

  it('serializes simultaneous primary saves on separate connections', async () => {
    await closeAssignment(tenant, 'a1', '2024-12-31');
    const results = await Promise.allSettled([
      saveFacultyAssignment(tenant, appointment('race-a', { facultyId: 'f1', isPrimary: true })),
      saveFacultyAssignment(tenant, appointment('race-b', { facultyId: 'f1', isPrimary: true })),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });

  it('soft-stops reports_to on create and update; still rejects inactive faculty targets', async () => {
    // Create + update ignore client reports_to (forced null) — no cycle path via this field.
    await expect(saveFacultyAssignment(tenant, appointment('same-person', {
      reportsToAssignmentId: 'a0',
    }))).resolves.toBeUndefined();
    await expect(saveFacultyAssignment(tenant, appointment('same-person', {
      reportsToAssignmentId: 'a2',
    }))).resolves.toBeUndefined();
    await withTenant(tenant, async (tx) => {
      const result = await tx.execute(sql`
        SELECT reports_to_assignment_id
        FROM faculty_assignments
        WHERE workspace_subdomain = ${tenant} AND id = 'same-person'
      `);
      expect(result.rows[0]?.reports_to_assignment_id ?? null).toBeNull();
    });
    await expect(saveFacultyAssignment(tenant, appointment('a2'))).rejects.toThrow('belongs');
  });

  it('rejects missing references and an end date before the start', async () => {
    await expect(saveFacultyAssignment(tenant, appointment('missing', { departmentId: 'missing' }))).rejects.toThrow('active');
    await expect(saveFacultyAssignment(tenant, appointment('bad-date', { endDate: '2020-01-01' }))).rejects.toThrow('End date');
  });

  it('does not let closing an earlier period extend it into a later primary role', async () => {
    await expect(closeAssignment(tenant, 'a0', '2025-01-01')).rejects.toThrow('overlaps');
  });

  it('commits the audit record with the appointment', async () => {
    await withTenant(tenant, async (tx) => {
      const result = await tx.execute(sql`SELECT record_id FROM audit_trail_events
        WHERE workspace_subdomain = ${tenant} AND table_name = 'faculty_assignments' AND record_id = 'secondary'`);
      expect(result.rows).toHaveLength(1);
    });
  });
});

describe('Faculty department integrity', () => {
  it('serializes reciprocal parent changes so concurrent edits cannot create a cycle', async () => {
    const left = { id: 'left', workspaceSubdomain: tenant, name: 'Left', code: 'L' };
    const right = { id: 'right', workspaceSubdomain: tenant, name: 'Right', code: 'R' };
    await saveFacultyDepartment(tenant, left);
    await saveFacultyDepartment(tenant, right);
    const results = await Promise.allSettled([
      saveFacultyDepartment(tenant, { ...left, parentId: 'right' }),
      saveFacultyDepartment(tenant, { ...right, parentId: 'left' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
  it('validates parent cycles and active dependent deletion', async () => {
    await saveFacultyDepartment(tenant, { id: 'child', workspaceSubdomain: tenant, parentId: 'd', name: 'Child', code: 'C' });
    await expect(saveFacultyDepartment(tenant, {
      id: 'd', workspaceSubdomain: tenant, parentId: 'child', name: 'Department', code: 'D',
    })).rejects.toThrow('Circular');
    await expect(softDeleteFacultyDepartment(tenant, 'd', 'actor')).rejects.toThrow('active children');
  });

  it('orders designations by seniority and excludes soft-deleted definitions', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`INSERT INTO faculty_designations (workspace_subdomain, id, code, name, hierarchy_rank)
        VALUES (${tenant}, 'junior', 'J', 'Junior', 20), (${tenant}, 'archived', 'A', 'Archived', 10)`);
      await tx.execute(sql`UPDATE faculty_designations SET deleted_at = now() WHERE workspace_subdomain = ${tenant} AND id = 'archived'`);
    });
    expect((await listFacultyDesignations(tenant)).map((d) => d.id)).toEqual(['g', 'junior']);
  });

  it('archives unused designations with an outbox event and permits code reuse', async () => {
    await expect(softDeleteFacultyDesignation(tenant, 'g', 'actor')).rejects.toThrow('dependent');
    await softDeleteFacultyDesignation(tenant, 'junior', 'actor');
    await expect(saveFacultyDesignation(tenant, {
      id: 'junior', code: 'J', name: 'Junior', hierarchyRank: 20, isActive: true, assignableRoles: [],
    })).rejects.toThrow('archived');
    await saveFacultyDesignation(tenant, {
      id: 'replacement', code: 'J', name: 'Replacement', hierarchyRank: 20, isActive: true, assignableRoles: [],
    });
    await withTenant(tenant, async (tx) => {
      const events = await tx.execute(sql`SELECT id FROM outbox_events WHERE workspace_subdomain = ${tenant}
        AND event_type = 'entity.soft_deleted' AND payload ->> 'entityId' = 'junior'`);
      expect(events.rows).toHaveLength(1);
    });
  });
});
