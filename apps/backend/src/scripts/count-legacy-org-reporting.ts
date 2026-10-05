/**
 * Post-0147 ops gate: count primary appointments still missing position_id.
 * Legacy person/assignment reporting columns were dropped in 0146/0147.
 *
 * Usage:
 *   tsx src/scripts/count-legacy-org-reporting.ts --tenant <subdomain>
 */
import { sql } from 'drizzle-orm';
import { loadBackendEnv } from '../config/loadEnv.js';
import { initDb } from '../db/database.js';
import { withTenant } from '../db/tenant-context.js';

loadBackendEnv();

function parseTenant(argv: string[]): string {
  const index = argv.indexOf('--tenant');
  const tenant = index >= 0 ? argv[index + 1] : undefined;
  if (!tenant) {
    console.error('Usage: tsx src/scripts/count-legacy-org-reporting.ts --tenant <subdomain>');
    process.exit(1);
  }
  return tenant.trim().toLowerCase();
}

async function main(): Promise<void> {
  const tenant = parseTenant(process.argv.slice(2));
  await initDb();

  const counts = await withTenant(tenant, async (tx) => {
    const result = await tx.execute<{ assignments_missing_position: string }>(sql`
      SELECT
        (SELECT COUNT(*)::text FROM faculty_assignments
          WHERE workspace_subdomain = ${tenant}
            AND deleted_at IS NULL
            AND is_primary = true
            AND status = 'active'
            AND position_id IS NULL) AS assignments_missing_position
    `);
    return result.rows[0];
  });

  const missing = Number(counts?.assignments_missing_position ?? 0);
  console.log(JSON.stringify({
    tenant,
    primaryAssignmentsMissingPositionId: missing,
    positionCoverageReady: missing === 0,
    note: 'Legacy faculty.reporting_faculty_id / faculty_assignments.reports_to_assignment_id were dropped in 0146/0147.',
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
