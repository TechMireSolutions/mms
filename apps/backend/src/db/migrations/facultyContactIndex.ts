import type pg from 'pg';

// Runs after Drizzle commits, because PostgreSQL forbids CONCURRENTLY in a transaction.
export async function ensureFacultyContactIndex(client: pg.Client): Promise<void> {
  await client.query('SELECT pg_advisory_lock(2145836402)');
  try {
    const existing = await client.query<{ indisvalid: boolean }>(`
      SELECT i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'faculty_workspace_contact_active_uidx'
    `);
    if (existing.rows[0]?.indisvalid) return;
    if (existing.rows.length) {
      await client.query('DROP INDEX CONCURRENTLY public.faculty_workspace_contact_active_uidx');
    }
    // Duplicated active contacts fail the migration; never silently discard or merge people.
    await client.query(`CREATE UNIQUE INDEX CONCURRENTLY faculty_workspace_contact_active_uidx
      ON public.faculty (workspace_subdomain, contact_id) WHERE deleted_at IS NULL`);
  } finally {
    await client.query('SELECT pg_advisory_unlock(2145836402)');
  }
}
