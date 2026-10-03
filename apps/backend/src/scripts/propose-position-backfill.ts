/**
 * Propose (and optionally apply) organization positions from active faculty
 * assignment reporting trees where position_id is missing.
 *
 * Usage:
 *   tsx src/scripts/propose-position-backfill.ts --tenant <subdomain> --dry-run
 *   tsx src/scripts/propose-position-backfill.ts --tenant <subdomain>
 *
 * Idempotent: skips assignments that already have position_id.
 * Never drops legacy columns.
 */
import { randomUUID } from 'node:crypto';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { loadBackendEnv } from '../config/loadEnv.js';
import { initDb } from '../db/database.js';
import { facultyAssignments, organizationPositions } from '../db/schema.js';
import { withTenant } from '../db/tenant-context.js';

loadBackendEnv();

interface ProposedPosition {
  assignmentId: string;
  facultyId: string;
  departmentId: string;
  designationId: string;
  designationName: string;
  proposedCode: string;
  proposedName: string;
  parentAssignmentId: string | null;
  parentPositionId: string | null;
}

function parseArgs(argv: string[]): { tenant: string; dryRun: boolean } {
  const get = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const tenant = get('--tenant');
  if (!tenant) {
    console.error(
      'Usage: tsx src/scripts/propose-position-backfill.ts --tenant <subdomain> [--dry-run]',
    );
    process.exit(1);
  }
  return { tenant: tenant.trim().toLowerCase(), dryRun: argv.includes('--dry-run') };
}

async function main(): Promise<void> {
  const { tenant, dryRun } = parseArgs(process.argv.slice(2));
  await initDb();

  const proposals = await withTenant(tenant, async (tx) => {
    const rows = await tx.execute<{
      assignment_id: string;
      faculty_id: string;
      department_id: string;
      designation_id: string;
      designation_name: string;
      reports_to_assignment_id: string | null;
      parent_position_id: string | null;
    }>(sql`
      SELECT
        a.id AS assignment_id,
        a.faculty_id,
        a.department_id,
        a.designation_id,
        COALESCE(d.name, a.designation_id) AS designation_name,
        a.reports_to_assignment_id,
        parent.position_id AS parent_position_id
      FROM faculty_assignments a
      LEFT JOIN faculty_designations d
        ON d.workspace_subdomain = a.workspace_subdomain
       AND d.id = a.designation_id
       AND d.deleted_at IS NULL
      LEFT JOIN faculty_assignments parent
        ON parent.workspace_subdomain = a.workspace_subdomain
       AND parent.id = a.reports_to_assignment_id
       AND parent.deleted_at IS NULL
      WHERE a.workspace_subdomain = ${tenant}
        AND a.deleted_at IS NULL
        AND a.position_id IS NULL
        AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
      ORDER BY a.start_date ASC
    `);

    return rows.rows.map((row): ProposedPosition => {
      const codeBase = row.designation_name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24) || 'POS';
      return {
        assignmentId: row.assignment_id,
        facultyId: row.faculty_id,
        departmentId: row.department_id,
        designationId: row.designation_id,
        designationName: row.designation_name,
        proposedCode: `${codeBase}-${row.assignment_id.slice(0, 8)}`,
        proposedName: row.designation_name,
        parentAssignmentId: row.reports_to_assignment_id,
        parentPositionId: row.parent_position_id,
      };
    });
  });

  console.log(`Tenant: ${tenant}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`Proposals: ${proposals.length}`);
  for (const p of proposals) {
    console.log(
      JSON.stringify({
        assignmentId: p.assignmentId,
        facultyId: p.facultyId,
        code: p.proposedCode,
        name: p.proposedName,
        parentPositionId: p.parentPositionId,
      }),
    );
  }

  if (dryRun || proposals.length === 0) {
    process.exit(0);
  }

  let applied = 0;
  await withTenant(tenant, async (tx) => {
    for (const proposal of proposals) {
      const positionId = randomUUID();
      await tx.insert(organizationPositions).values({
        id: positionId,
        workspaceSubdomain: tenant,
        code: proposal.proposedCode,
        name: proposal.proposedName,
        departmentId: proposal.departmentId,
        designationId: proposal.designationId,
        parentPositionId: proposal.parentPositionId,
        capacity: 1,
        sortOrder: 0,
        isActive: true,
      });
      await tx
        .update(facultyAssignments)
        .set({ positionId, updatedAt: new Date() })
        .where(
          and(
            eq(facultyAssignments.workspaceSubdomain, tenant),
            eq(facultyAssignments.id, proposal.assignmentId),
            isNull(facultyAssignments.positionId),
            isNull(facultyAssignments.deletedAt),
          ),
        );
      applied += 1;
    }
  });

  console.log(`Applied: ${applied}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
