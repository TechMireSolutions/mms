import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';
import type { InsertFacultyAssignmentRow } from '../schema/facultyAssignmentTables.js';

export async function validatePositionOccupancy(
  tx: Pick<TenantTransaction, 'execute'>,
  tenant: string,
  input: InsertFacultyAssignmentRow,
): Promise<void> {
  const result = await tx.execute<{ id: string; capacity: number; department_id: string | null; designation_id: string | null }>(sql`
    SELECT p.id, p.capacity, p.department_id, p.designation_id FROM organization_positions p
    WHERE p.workspace_subdomain = ${tenant}
      AND p.id = ${input.positionId ?? null} AND p.deleted_at IS NULL AND p.is_active FOR UPDATE
  `);
  const position = result.rows[0];
  if (!position) throw new Error('Position must be active in this workspace');
  if ((position.department_id && position.department_id !== input.departmentId)
    || (position.designation_id && position.designation_id !== input.designationId)) {
    throw new Error('Assignment department and designation must match its position');
  }
  const occupied = await tx.execute<{ peak: number }>(sql`
    WITH intervals AS (
      SELECT start_date, end_date FROM faculty_assignments
      WHERE workspace_subdomain = ${tenant} AND position_id = ${position.id}
        AND id <> ${input.id} AND deleted_at IS NULL
        AND start_date <= COALESCE(${input.endDate ?? null}::date, 'infinity'::date)
        AND COALESCE(end_date, 'infinity'::date) >= ${input.startDate}::date
      UNION ALL SELECT ${input.startDate}::date, ${input.endDate ?? null}::date
    ), events AS (
      SELECT start_date AS day, 1 AS change FROM intervals
      UNION ALL SELECT end_date + 1, -1 FROM intervals WHERE end_date IS NOT NULL
    ), totals AS (
      SELECT sum(sum(change)) OVER (ORDER BY day) AS occupied FROM events GROUP BY day
    ) SELECT COALESCE(max(occupied), 0)::int AS peak FROM totals
  `);
  if ((occupied.rows[0]?.peak ?? 0) > position.capacity) {
    throw new Error('Position capacity would be exceeded during this appointment');
  }
}
