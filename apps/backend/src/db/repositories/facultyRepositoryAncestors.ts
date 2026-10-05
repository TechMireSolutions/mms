import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { Faculty } from '@mms/shared';
import { faculty } from '../schema.js';
import { withTenantRead } from '../tenant-context.js';
import {
  hydrateFacultyList,
  FACULTY_PROJECTION_COLUMNS,
  attachPrimaryAppointmentToFacultyList,
} from './facultyRepositoryColumns.js';
import { resolveSupervisorPrimaryPositionId } from './facultyRepositorySubordinateCounts.js';
import { primaryAssignmentEffectiveOnDateSql } from './facultyPrimaryAppointmentEffective.js';

export async function findSubordinates(tenant: string, supervisorId: string): Promise<Faculty[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const supervisorPositionId = await resolveSupervisorPrimaryPositionId(tx, subdomain, supervisorId);
    if (!supervisorPositionId) return [];
    const idRows = await tx.execute<{ faculty_id: string }>(sql`
      SELECT DISTINCT a.faculty_id
      FROM faculty_assignments a
      JOIN organization_positions pos
        ON pos.workspace_subdomain = a.workspace_subdomain
        AND pos.id = a.position_id
        AND pos.deleted_at IS NULL
      JOIN faculty f ON f.workspace_subdomain = a.workspace_subdomain AND f.id = a.faculty_id
      WHERE a.workspace_subdomain = ${subdomain}
        AND pos.parent_position_id = ${supervisorPositionId}
        AND a.is_primary = true
        AND a.deleted_at IS NULL
        AND a.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('a')}
        AND f.deleted_at IS NULL
        AND a.faculty_id <> ${supervisorId}
    `);
    const ids = idRows.rows.map((r) => r.faculty_id);
    if (ids.length === 0) return [];
    const rows = await tx
      .select(FACULTY_PROJECTION_COLUMNS)
      .from(faculty)
      .where(and(
        eq(faculty.workspaceSubdomain, subdomain),
        inArray(faculty.id, ids),
        isNull(faculty.deletedAt),
      ));
    const hydrated = await hydrateFacultyList(tx, subdomain, rows);
    return attachPrimaryAppointmentToFacultyList(tx, subdomain, hydrated);
  });
}

export async function findDirectSupervisorsBatch(
  tenant: string,
  facultyIds: string[],
): Promise<Record<string, string>> {
  if (facultyIds.length === 0) return {};
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<{ faculty_id: string; supervisor_id: string }>(sql`
      SELECT DISTINCT sub_a.faculty_id, sup_a.faculty_id AS supervisor_id
      FROM faculty_assignments sub_a
      JOIN organization_positions sub_pos
        ON sub_pos.workspace_subdomain = sub_a.workspace_subdomain
        AND sub_pos.id = sub_a.position_id
        AND sub_pos.deleted_at IS NULL
      JOIN faculty_assignments sup_a
        ON sup_a.workspace_subdomain = sub_pos.workspace_subdomain
        AND sup_a.position_id = sub_pos.parent_position_id
        AND sup_a.is_primary = true
        AND sup_a.deleted_at IS NULL
        AND sup_a.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('sup_a')}
      JOIN faculty sub_f ON sub_f.workspace_subdomain = sub_a.workspace_subdomain AND sub_f.id = sub_a.faculty_id
      JOIN faculty sup_f ON sup_f.workspace_subdomain = sup_a.workspace_subdomain AND sup_f.id = sup_a.faculty_id
      WHERE sub_a.workspace_subdomain = ${subdomain}
        AND sub_a.faculty_id IN (${sql.join(facultyIds.map((id) => sql`${id}`), sql`, `)})
        AND sub_a.is_primary = true
        AND sub_a.deleted_at IS NULL
        AND sub_a.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('sub_a')}
        AND sub_f.deleted_at IS NULL
        AND sup_f.deleted_at IS NULL
        AND sub_pos.parent_position_id IS NOT NULL
    `);
    const result: Record<string, string> = {};
    for (const row of rows.rows) {
      if (row.faculty_id !== row.supervisor_id) {
        result[row.faculty_id] = row.supervisor_id;
      }
    }
    return result;
  });
}

export async function findAncestorChain(
  tenant: string,
  facultyId: string,
  maxDepth = 20,
): Promise<string[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<{ ancestor_id: string }>(sql`
      WITH RECURSIVE chain AS (
        SELECT pos.parent_position_id AS parent_position_id, 1 AS depth
        FROM faculty_assignments a
        JOIN organization_positions pos
          ON pos.workspace_subdomain = a.workspace_subdomain
          AND pos.id = a.position_id
          AND pos.deleted_at IS NULL
        WHERE a.workspace_subdomain = ${subdomain}
          AND a.faculty_id = ${facultyId}
          AND a.is_primary = true
          AND a.deleted_at IS NULL
          AND a.status = 'active'
          AND ${primaryAssignmentEffectiveOnDateSql('a')}
        UNION ALL
        SELECT pos.parent_position_id, chain.depth + 1
        FROM chain
        JOIN organization_positions pos
          ON pos.workspace_subdomain = ${subdomain}
          AND pos.id = chain.parent_position_id
          AND pos.deleted_at IS NULL
        WHERE chain.parent_position_id IS NOT NULL
          AND chain.depth < ${maxDepth}
      )
      SELECT DISTINCT sup.faculty_id AS ancestor_id
      FROM chain
      JOIN faculty_assignments sup
        ON sup.workspace_subdomain = ${subdomain}
        AND sup.position_id = chain.parent_position_id
        AND sup.is_primary = true
        AND sup.deleted_at IS NULL
        AND sup.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('sup')}
      JOIN faculty f ON f.workspace_subdomain = sup.workspace_subdomain AND f.id = sup.faculty_id
      WHERE chain.parent_position_id IS NOT NULL
        AND f.deleted_at IS NULL
        AND sup.faculty_id <> ${facultyId}
      ORDER BY ancestor_id
    `);
    return rows.rows.map((r) => r.ancestor_id);
  });
}
