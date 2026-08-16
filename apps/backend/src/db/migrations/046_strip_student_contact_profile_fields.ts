/**
 * Strip contact-owned identity / guardian dual-write keys from students.custom_data.
 * Contacts remain SSOT for gender, dob, name, phone, email, city, and relationships.
 * Idempotent: only updates rows that still contain any of the keys.
 */
import { sql } from 'drizzle-orm';
import { withTenantTransaction } from '../withTenantTransaction.js';

export async function runMigration046(): Promise<void> {
  await withTenantTransaction(null, async (tx) => {
    const colCheck = (await tx.execute(sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'custom_data'
    `)) as unknown;
    const hasCustomData =
      typeof colCheck === 'object' && colCheck !== null && 'rowCount' in colCheck
        ? Number((colCheck as { rowCount?: number }).rowCount ?? 0) > 0
        : Array.isArray(colCheck) && (colCheck as unknown[]).length > 0;

    if (!hasCustomData) {
      console.log('[Migration 046] No student custom_data column to strip.');
      return;
    }

    const result = await tx.execute(sql`
      UPDATE students
      SET
        custom_data = custom_data
          - 'name' - 'phone' - 'email' - 'gender' - 'dob' - 'city'
          - 'firstName' - 'lastName'
          - 'fatherContactId' - 'motherContactId' - 'guardianContactId'
          - 'fatherName' - 'motherName' - 'guardianName',
        updated_at = NOW()
      WHERE custom_data ?| ARRAY[
        'name', 'phone', 'email', 'gender', 'dob', 'city',
        'firstName', 'lastName',
        'fatherContactId', 'motherContactId', 'guardianContactId',
        'fatherName', 'motherName', 'guardianName'
      ]::text[]
    `);

    const rowCount =
      typeof result === 'object' && result !== null && 'rowCount' in result
        ? Number((result as { rowCount?: number }).rowCount ?? 0)
        : 0;

    if (rowCount > 0) {
      console.log(
        `[Migration 046] Stripped contact profile / guardian dual-write keys from ${rowCount} student row(s).`,
      );
    } else {
      console.log('[Migration 046] No student custom_data profile keys to strip.');
    }
  });
}
