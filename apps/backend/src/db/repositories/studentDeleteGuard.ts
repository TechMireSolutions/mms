import { sql } from 'drizzle-orm';
import { withTenantRead } from '../tenant-context.js';
import { ConflictError } from '../../lib/httpErrors.js';
import { financeInvoices } from '../schema.js';

/**
 * Pre-deletion guard for students.
 * Blocks soft-delete with 409 Conflict if active dependent operational records
 * (e.g. active unpaid invoices) are still associated with the target students.
 */
export async function guardStudentSoftDelete(tenant: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenantRead(subdomain, async (tx) => {
    if (!tx || typeof (tx as { execute?: unknown }).execute !== 'function') return;
    const members = sql.join(ids.map((id) => sql`${id}`), sql`, `);
    const unpaidInvoices = await tx.execute(sql`
      SELECT 1
      FROM ${financeInvoices} fi
      WHERE fi.workspace_subdomain = ${subdomain}
        AND fi.student_id IN (${members})
        AND fi.deleted_at IS NULL
        AND fi.status NOT IN ('paid', 'void', 'cancelled')
      LIMIT 1
    `);
    if (unpaidInvoices.rows.length > 0) {
      throw new ConflictError(
        'Cannot delete student with active unpaid invoices. Settle or cancel invoices first.',
      );
    }
  });
}
