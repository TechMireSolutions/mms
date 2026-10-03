/**
 * Read-only gate before dropping legacy org reporting columns.
 *
 * Usage:
 *   tsx src/scripts/count-legacy-org-reporting.ts --tenant <subdomain>
 *
 * Exit 0 always after printing counts. Ops must confirm all counts are zero
 * before approving a forward-only DROP migration.
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
    const result = await tx.execute<{
      assignments_missing_position: string;
      assignments_with_reports_to: string;
      faculty_with_reporting: string;
      faculty_with_hierarchy_rank: string;
    }>(sql`
      SELECT
        (SELECT COUNT(*)::text FROM faculty_assignments
          WHERE workspace_subdomain = ${tenant}
            AND deleted_at IS NULL
            AND position_id IS NULL) AS assignments_missing_position,
        (SELECT COUNT(*)::text FROM faculty_assignments
          WHERE workspace_subdomain = ${tenant}
            AND deleted_at IS NULL
            AND reports_to_assignment_id IS NOT NULL) AS assignments_with_reports_to,
        (SELECT COUNT(*)::text FROM faculty
          WHERE workspace_subdomain = ${tenant}
            AND deleted_at IS NULL
            AND reporting_faculty_id IS NOT NULL) AS faculty_with_reporting,
        (SELECT COUNT(*)::text FROM faculty
          WHERE workspace_subdomain = ${tenant}
            AND deleted_at IS NULL
            AND hierarchy_rank IS NOT NULL
            AND hierarchy_rank <> 10) AS faculty_with_hierarchy_rank
    `);
    return result.rows[0];
  });

  const missing = Number(counts?.assignments_missing_position ?? 0);
  const reportsTo = Number(counts?.assignments_with_reports_to ?? 0);
  const personReporting = Number(counts?.faculty_with_reporting ?? 0);
  const rankOverrides = Number(counts?.faculty_with_hierarchy_rank ?? 0);
  const ready = missing === 0 && reportsTo === 0 && personReporting === 0;

  console.log(JSON.stringify({
    tenant,
    assignmentsMissingPositionId: missing,
    assignmentsWithReportsTo: reportsTo,
    facultyWithReportingFacultyId: personReporting,
    facultyWithNonDefaultHierarchyRank: rankOverrides,
    legacyDropReady: ready,
  }, null, 2));

  if (!ready) {
    console.error(
      'Gate not clear: backfill positions and clear legacy reporting before DROP.',
    );
  } else {
    console.log('Gate clear for legacy reporting DROP (ops still requires review).');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
