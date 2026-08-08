/**
 * Strip contact-owned identity dual-write keys from teachers.custom_data.
 * Contacts remain SSOT for name, phone, email, gender, dob, city, first/last name.
 * Idempotent: only updates rows that still contain any of the keys.
 */
import { sql } from 'drizzle-orm';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function runMigration053(): Promise<void> {
  await withTenantTransaction(null, async (tx) => {
    const result = await tx.execute(sql`
      UPDATE teachers
      SET
        custom_data = custom_data
          - 'name' - 'phone' - 'email' - 'gender' - 'dob' - 'city'
          - 'firstName' - 'lastName',
        updated_at = NOW()
      WHERE custom_data ?| ARRAY[
        'name', 'phone', 'email', 'gender', 'dob', 'city',
        'firstName', 'lastName'
      ]::text[]
    `);

    const rowCount =
      typeof result === 'object' && result !== null && 'rowCount' in result
        ? Number((result as { rowCount?: number }).rowCount ?? 0)
        : 0;

    if (rowCount > 0) {
      console.log(
        `[Migration 053] Stripped contact profile dual-write keys from ${rowCount} teacher row(s).`,
      );
    } else {
      console.log('[Migration 053] No teacher custom_data profile keys to strip.');
    }
  });
}
