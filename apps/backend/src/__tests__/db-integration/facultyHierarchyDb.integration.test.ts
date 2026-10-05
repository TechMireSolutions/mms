import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDatabase } from '../../db/dbConnection.js';
import { applyDrizzleMigrations } from '../../db/dbInit.js';
import { requireDatabaseConnection } from './dbTestSupport.js';
import { withTenant } from '../../db/tenant-context.js';
import { findAssignmentManagerChain, findAssignmentSubordinateTree, findFacultyManagerChain } from '../../db/repositories/facultyAssignmentHierarchyRepository.js';
import { seedFacultyHierarchy, cleanupFacultyHierarchy, facultyTestTenant as tenant,
  facultyOtherTenant, withFacultyRls } from './facultyHierarchyFixtures.js';

beforeAll(async () => { await requireDatabaseConnection(); await applyDrizzleMigrations(); await seedFacultyHierarchy(); });
afterAll(async () => { await cleanupFacultyHierarchy(); await closeDatabase(); });

describe('Faculty recursive SQL against PostgreSQL', () => {
  it('returns managers and subordinates in depth order with real date strings', async () => {
    const chain = await findAssignmentManagerChain(tenant, 'a3');
    expect(chain.map((node) => [node.id, node.depth])).toEqual([['a2', 1], ['a1', 2], ['a0', 3]]);
    expect(chain[0]?.startDate).toBe('2020-01-01');
    const tree = await findAssignmentSubordinateTree(tenant, 'a0', 3);
    expect(tree.map((node) => node.id)).toEqual(['a1', 'a2', 'a3']);
    expect(tree[2]?.path).toEqual(['a0', 'a1', 'a2', 'a3']);
  });

  it('caps deep trees at 20 and rejects invalid limits', async () => {
    expect(await findAssignmentSubordinateTree(tenant, 'a0')).toHaveLength(20);
    for (const limit of [0, -1, 21, 1.5, NaN, Infinity]) {
      await expect(findAssignmentManagerChain(tenant, 'a1', limit)).rejects.toThrow('Hierarchy depth');
    }
  });

  it('resolves a faculty member on a calendar date and excludes expired appointments', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`UPDATE faculty_assignments SET end_date = '2023-12-31'
        WHERE workspace_subdomain = ${tenant} AND id = 'a1'`);
      expect((await findFacultyManagerChain(tenant, 'f3', '2024-01-01')).map((n) => n.id)).toEqual(['a2']);
      expect(await findFacultyManagerChain(tenant, 'f3', '2019-01-01')).toEqual([]);
      await tx.execute(sql`UPDATE faculty_assignments SET end_date = NULL
        WHERE workspace_subdomain = ${tenant} AND id = 'a1'`);
    });
  });

  it('returns a cycle marker once, then terminates in either direction', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`UPDATE organization_positions SET parent_position_id = 'pos2'
        WHERE workspace_subdomain = ${tenant} AND id = 'pos0'`);
      try {
        const chain = await findAssignmentManagerChain(tenant, 'a0');
        expect(chain.map((n) => [n.id, n.isCycle])).toEqual([['a2', false], ['a1', false], ['a0', true]]);
        const tree = await findAssignmentSubordinateTree(tenant, 'a0');
        expect(tree.filter((n) => n.isCycle).map((n) => n.id)).toEqual(['a0']);
      } finally {
        await tx.execute(sql`UPDATE organization_positions SET parent_position_id = NULL
          WHERE workspace_subdomain = ${tenant} AND id = 'pos0'`);
      }
    });
  });

  it('detects repeated faculty identity across distinct assignment IDs', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`UPDATE faculty_assignments SET faculty_id = 'f0'
        WHERE workspace_subdomain = ${tenant} AND id = 'a2'`);
      const tree = await findAssignmentSubordinateTree(tenant, 'a0');
      expect(tree.map((n) => [n.id, n.isCycle])).toEqual([['a1', false], ['a2', true]]);
      await tx.execute(sql`UPDATE faculty_assignments SET faculty_id = 'f2'
        WHERE workspace_subdomain = ${tenant} AND id = 'a2'`);
    });
  });

  it('does not traverse deleted roots or deleted intermediate members', async () => {
    await withTenant(tenant, async (tx) => {
      await tx.execute(sql`UPDATE faculty_assignments SET deleted_at = now()
        WHERE workspace_subdomain = ${tenant} AND id = 'a0'`);
      expect(await findAssignmentSubordinateTree(tenant, 'a0')).toEqual([]);
      await tx.execute(sql`UPDATE faculty_assignments SET deleted_at = NULL
        WHERE workspace_subdomain = ${tenant} AND id = 'a0'`);
      await tx.execute(sql`UPDATE faculty SET deleted_at = now() WHERE workspace_subdomain = ${tenant} AND id = 'f1'`);
      expect(await findAssignmentSubordinateTree(tenant, 'a0')).toEqual([]);
      await tx.execute(sql`UPDATE faculty SET deleted_at = NULL WHERE workspace_subdomain = ${tenant} AND id = 'f1'`);
    });
  });

  it('enforces RLS without relying on explicit tenant WHERE predicates', async () => {
    await withFacultyRls(tenant, async (tx) => {
      const result = await tx.execute<{ workspace_subdomain: string }>(sql`SELECT workspace_subdomain FROM faculty_assignments`);
      expect(new Set(result.rows.map((r) => r.workspace_subdomain))).toEqual(new Set([tenant]));
      expect(await findAssignmentManagerChain(tenant, 'a1')).toHaveLength(1);
      await tx.execute(sql`SELECT set_config('app.current_tenant', '', true)`);
      expect((await tx.execute(sql`SELECT id FROM faculty_assignments`)).rows).toEqual([]);
    });
    await expect(withFacultyRls(tenant, (tx) => tx.execute(sql`
      UPDATE faculty_assignments SET workspace_subdomain = ${facultyOtherTenant}
      WHERE id = 'a0'
    `))).rejects.toMatchObject({ cause: { code: '42501' } });
  });
});
