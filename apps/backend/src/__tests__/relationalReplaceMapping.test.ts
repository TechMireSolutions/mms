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
      'accounting_account_user_column_prefs',
      'accounting_accounts',
      'accounting_entries',
      'accounting_field_configs',
      'accounting_fiscal_years',
      'accounting_journal_user_column_prefs',
      'accounting_module_preferences',
      'assessment_results',
      'attendance_field_configs',
      'attendance_module_preferences',
      'attendance_records',
      'attendance_user_column_prefs',
      'contact_field_configs',
      'contact_lookups',
      'contact_module_preferences',
      'contact_user_column_prefs',
      'contacts',
      'custom_tabs',
      'enrollment_field_configs',
      'enrollment_module_preferences',
      'enrollment_user_column_prefs',
      'enrollments',
      'exam_results',
      'examination_exam_user_column_prefs',
      'examination_results_user_column_prefs',
      'examinations_field_configs',
      'examinations_module_preferences',
      'exams',
      'finance_field_configs',
      'finance_invoices',
      'finance_module_preferences',
      'finance_payment_user_column_prefs',
      'finance_payments',
      'finance_user_column_prefs',
      'hasanat_batches',
      'hasanat_denoms',
      'hasanat_distribution_user_column_prefs',
      'hasanat_distributions',
      'hasanat_field_configs',
      'hasanat_module_preferences',
      'hasanat_redemption_user_column_prefs',
      'hasanat_redemptions',
      'message_logs',
      'message_templates',
      'mujtahid_reps',
      'mujtahids',
      'obligation_collections',
      'obligation_distributions',
      'obligation_types',
      'question_bank_field_configs',
      'question_bank_module_preferences',
      'question_bank_user_column_prefs',
      'questions',
      'saved_reports',
      'session_field_configs',
      'session_module_preferences',
      'session_user_column_prefs',
      'sessions',
      'student_field_configs',
      'student_lookups',
      'student_module_preferences',
      'student_user_column_prefs',
      'students',
      'teacher_field_configs',
      'teacher_lookups',
      'teacher_module_preferences',
      'teacher_user_column_prefs',
      'teachers',
      'tests',
      'user_activity_logs',
      'user_field_configs',
      'user_module_preferences',
      'user_user_column_prefs',
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
      'students',
      'message_logs',
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
    // contact_google_sync_credentials (OAuth secrets — never snapshot),
    // plus platform/global tables (workspaces, platform_*, auth_artifacts, data_migrations).
    const tenantBusinessTables = [
      'tenant_users',
      'contacts',
      'contact_field_configs',
      'contact_lookups',
      'contact_module_preferences',
      'contact_user_column_prefs',
      'student_lookups',
      'student_field_configs',
      'student_module_preferences',
      'student_user_column_prefs',
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
