/**
 * Quarantined: relied on faculty_assignments.reports_to_assignment_id (dropped in 0147).
 * Position occupancy is now set via the Faculty appointments UI / assignment API.
 *
 * Usage (exits 1 with guidance):
 *   tsx src/scripts/propose-position-backfill.ts --tenant <subdomain>
 */
console.error(
  'propose-position-backfill.ts is retired after 0147 (reports_to_assignment_id dropped). '
  + 'Assign organization positions on appointments in the Faculty module instead.',
);
process.exit(1);
