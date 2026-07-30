import { describe, expect, it } from 'vitest';
import {
  listBackupSnapshotCollectionKeys,
  RELATIONAL_REPLACE_MAPPING,
  sortCollectionNamesForRestore,
  withCompleteRelationalRestoreCollections,
} from '../db/relationalReplaceMapping.js';

describe('RELATIONAL_REPLACE_MAPPING backup coverage', () => {
  it('snapshots every REST-migrated business table except the audit trail', () => {
    const snapshotKeys = Object.entries(RELATIONAL_REPLACE_MAPPING)
      .filter(([, mapping]) => Boolean(mapping.snapshotFnName))
      .map(([key]) => key)
      .sort();

    expect(snapshotKeys).toEqual([
      'accounting_accounts',
      'accounting_entries',
      'accounting_fiscal_years',
      'assessment_results',
      'attendance_records',
      'contacts',
      'custom_tabs',
      'enrollments',
      'exam_results',
      'exams',
      'finance_invoices',
      'finance_payments',
      'hasanat_batches',
      'hasanat_denoms',
      'hasanat_distributions',
      'hasanat_redemptions',
      'message_logs',
      'message_templates',
      'mujtahid_reps',
      'mujtahids',
      'obligation_collections',
      'obligation_distributions',
      'obligation_types',
      'questions',
      'saved_reports',
      'sessions',
      'students',
      'teachers',
      'tests',
      'user_activity_logs',
      'users',
      'wakala_types',
    ]);
  });

  it('never snapshots the audit trail (restore must not roll it back)', () => {
    expect(RELATIONAL_REPLACE_MAPPING.audit_log.snapshotFnName).toBeUndefined();
    expect(RELATIONAL_REPLACE_MAPPING.audit_log.fnName).toBe('replaceAuditLogEntriesForWorkspace');
  });

  it('restores contacts before users to preserve contact_id foreign keys', () => {
    expect(sortCollectionNamesForRestore(['users', 'students', 'contacts', 'message_logs'])).toEqual([
      'contacts',
      'message_logs',
      'students',
      'users',
    ]);
  });

  it('expands missing snapshotted collections to [] when users mark a full restore', () => {
    const expanded = withCompleteRelationalRestoreCollections({
      users: [{ id: 'u-1' }],
      contacts: [{ id: 'c-1' }],
    });

    expect(expanded.users).toEqual([{ id: 'u-1' }]);
    expect(expanded.contacts).toEqual([{ id: 'c-1' }]);
    expect(expanded.students).toEqual([]);
    expect(expanded.message_logs).toEqual([]);
    expect(expanded.audit_log).toBeUndefined();
    expect(Object.keys(expanded).sort()).toEqual(
      [...listBackupSnapshotCollectionKeys()].sort(),
    );
  });

  it('does not wipe relational tables for partial payloads without users', () => {
    const partial = withCompleteRelationalRestoreCollections({
      students: [{ id: 's-1' }],
    });
    expect(partial).toEqual({ students: [{ id: 's-1' }] });
  });

  it('covers every tenant business table that belongs in a full workspace backup', () => {
    // Keep this list in sync with apps/backend/src/db/schema.ts tenant tables.
    // Intentional non-backup tables: audit_log_entries, audit_logs, background_jobs,
    // plus platform/global tables (workspaces, platform_*, auth_artifacts, data_migrations).
    const tenantBusinessTables = [
      'tenant_users',
      'contacts',
      'students',
      'teachers',
      'sessions',
      'attendance',
      'enrollments',
      'obligation_types',
      'mujtahids',
      'mujtahid_reps',
      'wakala_types',
      'obligation_distributions',
      'obligation_collections',
      'finance_invoices',
      'finance_payments',
      'exams',
      'exam_results',
      'hasanat_denoms',
      'hasanat_batches',
      'hasanat_distributions',
      'hasanat_redemptions',
      'accounting_accounts',
      'accounting_entries',
      'accounting_fiscal_years',
      'questions',
      'tests',
      'assessment_results',
      'user_activity_logs',
      'custom_tabs',
      'saved_reports',
      'message_templates',
      'message_logs',
    ];

    const snapshotKeys = new Set(listBackupSnapshotCollectionKeys());
    const tableToLogicalKey: Record<string, string> = {
      tenant_users: 'users',
      attendance: 'attendance_records',
    };

    for (const table of tenantBusinessTables) {
      const logicalKey = tableToLogicalKey[table] ?? table;
      expect(snapshotKeys.has(logicalKey)).toBe(true);
    }
  });
});
