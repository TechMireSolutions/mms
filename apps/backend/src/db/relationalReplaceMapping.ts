export interface RelationalCollectionMapping {
  importPath: string;
  /** Repository helper that wipes and reinserts every workspace row (admin restore). */
  fnName: string;
  /**
   * Repository helper that lists every workspace row for admin backup snapshots.
   * Omit to keep a table out of backups — the audit trail must never be rolled back by a restore.
   */
  snapshotFnName?: string;
}

/**
 * Maps REST-migrated collection logical keys to repository helpers.
 * Used by admin sync/restore (`mirrorRelationalReplace: true`) and backup snapshots.
 *
 * Restore order: lower priority runs first. Contacts must precede users because
 * `tenant_users.contact_id` is an FK with ON DELETE SET NULL — replacing contacts
 * after users would null out restored contact links.
 */
export const RELATIONAL_RESTORE_PRIORITY: Record<string, number> = {
  contacts: 10,
  custom_tabs: 20,
  contact_lookups: 25,
  contact_field_configs: 26,
  contact_module_preferences: 27,
  contact_user_column_prefs: 28,
  users: 900,
};

/** Stable collection restore order for FK-safe admin backup restore. */
export function sortCollectionNamesForRestore(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const priorityA = RELATIONAL_RESTORE_PRIORITY[a] ?? 100;
    const priorityB = RELATIONAL_RESTORE_PRIORITY[b] ?? 100;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.localeCompare(b);
  });
}

/** Logical keys included in workspace backup snapshots (excludes audit trail). */
export function listBackupSnapshotCollectionKeys(): string[] {
  return Object.entries(RELATIONAL_REPLACE_MAPPING)
    .filter(([, mapping]) => Boolean(mapping.snapshotFnName))
    .map(([key]) => key);
}

/**
 * Ensures every snapshotted relational collection is present on a restore payload.
 * Missing keys become `[]` so stale rows are wiped instead of left behind.
 *
 * Only expands when `users` is present — that marks a full workspace backup restore.
 * Partial payloads without users are left unchanged so they cannot wipe the tenant.
 */
export function withCompleteRelationalRestoreCollections(
  collections: Record<string, unknown[]> | undefined,
): Record<string, unknown[]> {
  const next: Record<string, unknown[]> = { ...(collections ?? {}) };
  if (!Array.isArray(next.users)) {
    return next;
  }
  for (const key of listBackupSnapshotCollectionKeys()) {
    if (!(key in next) || !Array.isArray(next[key])) {
      next[key] = [];
    }
  }
  return next;
}

export const RELATIONAL_REPLACE_MAPPING: Record<string, RelationalCollectionMapping> = {
  users: {
    importPath: './repositories/tenantUserRepository.js',
    fnName: 'replaceTenantUsersForWorkspace',
    snapshotFnName: 'listAllTenantUsersByWorkspace',
  },
  contacts: {
    importPath: './repositories/contactRepository.js',
    fnName: 'replaceContactsForWorkspace',
    snapshotFnName: 'listContactsByWorkspace',
  },
  students: {
    importPath: './repositories/studentRepository.js',
    fnName: 'replaceStudentsForWorkspace',
    snapshotFnName: 'listStudentsByWorkspace',
  },
  teachers: {
    importPath: './repositories/teacherRepository.js',
    fnName: 'replaceTeachersForWorkspace',
    snapshotFnName: 'listTeachersByWorkspace',
  },
  sessions: {
    importPath: './repositories/sessionRepository.js',
    fnName: 'replaceSessionsForWorkspace',
    snapshotFnName: 'listSessionsByWorkspace',
  },
  attendance_records: {
    importPath: './repositories/attendanceRepository.js',
    fnName: 'replaceAttendanceRecordsForWorkspace',
    snapshotFnName: 'listAttendanceRecordsByWorkspace',
  },
  enrollments: {
    importPath: './repositories/enrollmentRepository.js',
    fnName: 'replaceEnrollmentsForWorkspace',
    snapshotFnName: 'listEnrollmentsByWorkspace',
  },
  obligation_types: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceObligationTypesForWorkspace',
    snapshotFnName: 'listObligationTypesByWorkspace',
  },
  mujtahids: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceMujtahidsForWorkspace',
    snapshotFnName: 'listMujtahidsByWorkspace',
  },
  mujtahid_reps: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceMujtahidRepsForWorkspace',
    snapshotFnName: 'listMujtahidRepsByWorkspace',
  },
  wakala_types: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceWakalaTypesForWorkspace',
    snapshotFnName: 'listWakalaTypesByWorkspace',
  },
  obligation_distributions: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceObligationDistributionsForWorkspace',
    snapshotFnName: 'listObligationDistributionsByWorkspace',
  },
  obligation_collections: {
    importPath: './repositories/obligationRepository.js',
    fnName: 'replaceObligationCollectionsForWorkspace',
    snapshotFnName: 'listObligationCollectionsByWorkspace',
  },
  finance_invoices: {
    importPath: './repositories/financeRepository.js',
    fnName: 'replaceInvoicesForWorkspace',
    snapshotFnName: 'listInvoicesByWorkspace',
  },
  finance_payments: {
    importPath: './repositories/financeRepository.js',
    fnName: 'replacePaymentsForWorkspace',
    snapshotFnName: 'listPaymentsByWorkspace',
  },
  exams: {
    importPath: './repositories/examinationRepository.js',
    fnName: 'replaceExamsForWorkspace',
    snapshotFnName: 'listExamsByWorkspace',
  },
  exam_results: {
    importPath: './repositories/examinationRepository.js',
    fnName: 'replaceExamResultsForWorkspace',
    snapshotFnName: 'listExamResultsByWorkspace',
  },
  hasanat_denoms: {
    importPath: './repositories/hasanatRepository.js',
    fnName: 'replaceDenomsForWorkspace',
    snapshotFnName: 'listDenomsByWorkspace',
  },
  hasanat_batches: {
    importPath: './repositories/hasanatRepository.js',
    fnName: 'replaceBatchesForWorkspace',
    snapshotFnName: 'listBatchesByWorkspace',
  },
  hasanat_distributions: {
    importPath: './repositories/hasanatRepository.js',
    fnName: 'replaceDistributionsForWorkspace',
    snapshotFnName: 'listDistributionsByWorkspace',
  },
  hasanat_redemptions: {
    importPath: './repositories/hasanatRepository.js',
    fnName: 'replaceRedemptionsForWorkspace',
    snapshotFnName: 'listRedemptionsByWorkspace',
  },
  accounting_accounts: {
    importPath: './repositories/accountingRepository.js',
    fnName: 'replaceAccountsForWorkspace',
    snapshotFnName: 'listAccountsByWorkspace',
  },
  accounting_entries: {
    importPath: './repositories/accountingRepository.js',
    fnName: 'replaceEntriesForWorkspace',
    snapshotFnName: 'listEntriesByWorkspace',
  },
  accounting_fiscal_years: {
    importPath: './repositories/accountingRepository.js',
    fnName: 'replaceFiscalYearsForWorkspace',
    snapshotFnName: 'listFiscalYearsByWorkspace',
  },
  questions: {
    importPath: './repositories/questionBankRepository.js',
    fnName: 'replaceQuestionsForWorkspace',
    snapshotFnName: 'listQuestionsByWorkspace',
  },
  tests: {
    importPath: './repositories/questionBankRepository.js',
    fnName: 'replaceTestsForWorkspace',
    snapshotFnName: 'listTestsByWorkspace',
  },
  assessment_results: {
    importPath: './repositories/questionBankRepository.js',
    fnName: 'replaceResultsForWorkspace',
    snapshotFnName: 'listResultsByWorkspace',
  },
  user_activity_logs: {
    importPath: './repositories/logsRepository.js',
    fnName: 'replaceActivityLogsForWorkspace',
    snapshotFnName: 'listActivityLogsByWorkspace',
  },
  message_templates: {
    importPath: './repositories/messagingRepository.js',
    fnName: 'replaceMessageTemplatesForWorkspace',
    snapshotFnName: 'listMessageTemplatesByWorkspace',
  },
  message_logs: {
    importPath: './repositories/messagingRepository.js',
    fnName: 'replaceMessageLogsForWorkspace',
    snapshotFnName: 'listMessageLogsByWorkspace',
  },
  custom_tabs: {
    importPath: './repositories/customTabsRepository.js',
    fnName: 'replaceCustomTabsForWorkspace',
    snapshotFnName: 'listAllCustomTabsByWorkspace',
  },
  contact_lookups: {
    importPath: './repositories/contactLookupsRepository.js',
    fnName: 'replaceContactLookupsForWorkspace',
    snapshotFnName: 'listAllContactLookupsByWorkspace',
  },
  contact_field_configs: {
    importPath: './repositories/contactFieldConfigRepository.js',
    fnName: 'replaceContactFieldConfigsForWorkspace',
    snapshotFnName: 'listAllContactFieldConfigsByWorkspace',
  },
  contact_module_preferences: {
    importPath: './repositories/contactModulePreferencesRepository.js',
    fnName: 'replaceContactModulePreferencesForWorkspace',
    snapshotFnName: 'listAllContactModulePreferencesByWorkspace',
  },
  contact_user_column_prefs: {
    importPath: './repositories/contactUserColumnPrefsRepository.js',
    fnName: 'replaceContactUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllContactUserColumnPrefsByWorkspace',
  },
  saved_reports: {
    importPath: './repositories/savedReportsRepository.js',
    fnName: 'replaceSavedReportsForWorkspace',
    snapshotFnName: 'listAllSavedReportsByWorkspace',
  },
  audit_log: {
    importPath: './repositories/logsRepository.js',
    fnName: 'replaceAuditLogEntriesForWorkspace',
  },
};
