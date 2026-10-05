import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';
import { withTenant, withTenantRead } from '../tenant-context.js';
import { primaryAssignmentEffectiveOnDateSql } from './facultyPrimaryAppointmentEffective.js';

export async function resolveSupervisorPrimaryPositionId(
  tx: TenantTransaction,
  subdomain: string,
  supervisorId: string,
): Promise<string | null> {
  const rows = await tx.execute<{ position_id: string | null }>(sql`
    SELECT a.position_id
    FROM faculty_assignments a
    WHERE a.workspace_subdomain = ${subdomain}
      AND a.faculty_id = ${supervisorId}
      AND a.is_primary = true
      AND a.deleted_at IS NULL
      AND a.status = 'active'
      AND ${primaryAssignmentEffectiveOnDateSql('a')}
    ORDER BY a.start_date DESC
    LIMIT 1
  `);
  return rows.rows[0]?.position_id ?? null;
}

export async function countSubordinates(tenant: string, supervisorId: string): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const supervisorPositionId = await resolveSupervisorPrimaryPositionId(tx, subdomain, supervisorId);
    if (!supervisorPositionId) return 0;
    const rows = await tx.execute<{ count: number }>(sql`
      SELECT count(DISTINCT a.faculty_id)::int AS count
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
    return Number(rows.rows[0]?.count ?? 0);
  });
}

export async function countSubordinatesBatch(
  tenant: string,
  supervisorIds: string[],
): Promise<Record<string, number>> {
  if (supervisorIds.length === 0) return {};
  const subdomain = tenant.trim().toLowerCase();
  return withTenantRead(subdomain, async (tx) => {
    const rows = await tx.execute<{ supervisor_id: string; count: number }>(sql`
      WITH supervisor_positions AS (
        SELECT DISTINCT ON (a.faculty_id) a.faculty_id, a.position_id
        FROM faculty_assignments a
        WHERE a.workspace_subdomain = ${subdomain}
          AND a.faculty_id IN (${sql.join(supervisorIds.map((id) => sql`${id}`), sql`, `)})
          AND a.is_primary = true
          AND a.deleted_at IS NULL
          AND a.status = 'active'
          AND ${primaryAssignmentEffectiveOnDateSql('a')}
          AND a.position_id IS NOT NULL
        ORDER BY a.faculty_id, a.start_date DESC
      )
      SELECT sp.faculty_id AS supervisor_id, count(DISTINCT sub_a.faculty_id)::int AS count
      FROM supervisor_positions sp
      JOIN organization_positions child_pos
        ON child_pos.workspace_subdomain = ${subdomain}
        AND child_pos.parent_position_id = sp.position_id
        AND child_pos.deleted_at IS NULL
      JOIN faculty_assignments sub_a
        ON sub_a.workspace_subdomain = ${subdomain}
        AND sub_a.position_id = child_pos.id
        AND sub_a.is_primary = true
        AND sub_a.deleted_at IS NULL
        AND sub_a.status = 'active'
        AND ${primaryAssignmentEffectiveOnDateSql('sub_a')}
      JOIN faculty sub_f ON sub_f.workspace_subdomain = sub_a.workspace_subdomain AND sub_f.id = sub_a.faculty_id
      WHERE sub_a.faculty_id <> sp.faculty_id
        AND sub_f.deleted_at IS NULL
      GROUP BY sp.faculty_id
    `);
    const result: Record<string, number> = {};
    for (const row of rows.rows) {
      result[row.supervisor_id] = Number(row.count ?? 0);
    }
    return result;
  });
}

export async function reassignSubordinates(
  tenant: string,
  oldSupervisorId: string,
  newSupervisorId: string | null,
  txClient?: TenantTransaction,
): Promise<number> {
  const subdomain = tenant.trim().toLowerCase();
  const execute = async (tx: TenantTransaction) => {
    const oldPositionId = await resolveSupervisorPrimaryPositionId(tx, subdomain, oldSupervisorId);
    if (!oldPositionId) return 0;
    let newParentPositionId: string | null = null;
    if (newSupervisorId) {
      newParentPositionId = await resolveSupervisorPrimaryPositionId(tx, subdomain, newSupervisorId);
      if (!newParentPositionId) return 0;
    }
    const result = await tx.execute(sql`
      UPDATE organization_positions
      SET parent_position_id = ${newParentPositionId}, updated_at = NOW()
      WHERE workspace_subdomain = ${subdomain}
        AND parent_position_id = ${oldPositionId}
        AND deleted_at IS NULL
    `);
    return (result as { rowCount?: number }).rowCount ?? 0;
  };
  if (txClient) return execute(txClient);
  return withTenant(subdomain, execute);
}
