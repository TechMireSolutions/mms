import { sql } from 'drizzle-orm';
import type { TenantTransaction } from '../tenant-context.js';

export async function backfillFacultyReporting(tx: TenantTransaction, tenant: string): Promise<void> {
  await tx.execute(sql`
    UPDATE faculty_assignments target SET reports_to_assignment_id = manager.id
    FROM faculty f JOIN faculty_assignments manager
      ON manager.workspace_subdomain = f.workspace_subdomain AND manager.faculty_id = f.reporting_faculty_id
      AND manager.is_primary AND manager.end_date IS NULL AND manager.deleted_at IS NULL
    WHERE target.workspace_subdomain = ${tenant} AND f.workspace_subdomain = target.workspace_subdomain
      AND f.id = target.faculty_id AND target.id = 'legacy-assignment-' || md5(f.workspace_subdomain || ':' || f.id)
      AND target.reports_to_assignment_id IS NULL AND target.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM faculty_assignments other
        WHERE other.workspace_subdomain = manager.workspace_subdomain AND other.faculty_id = manager.faculty_id
          AND other.id <> manager.id AND other.is_primary AND other.end_date IS NULL AND other.deleted_at IS NULL)
  `);
  const invalid = await tx.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id, reports_to_assignment_id, ARRAY[faculty_id] AS people, 0 AS depth, FALSE AS cycle
      FROM faculty_assignments WHERE workspace_subdomain = ${tenant} AND deleted_at IS NULL
        AND id LIKE 'legacy-assignment-%'
      UNION ALL
      SELECT a.id, a.reports_to_assignment_id, t.people || a.faculty_id, t.depth + 1,
        a.faculty_id = ANY(t.people)
      FROM faculty_assignments a JOIN tree t ON t.reports_to_assignment_id = a.id
      WHERE a.workspace_subdomain = ${tenant} AND a.deleted_at IS NULL AND NOT t.cycle AND t.depth < 20
    ) SELECT id FROM tree WHERE cycle OR (depth = 20 AND reports_to_assignment_id IS NOT NULL) LIMIT 1
  `);
  if (invalid.rows.length) throw new Error(`Faculty reporting backfill requires hierarchy repair in workspace ${tenant}`);
}
