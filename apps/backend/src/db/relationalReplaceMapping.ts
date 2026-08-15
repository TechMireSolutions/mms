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
  students: 15,
  contact_lookups: 25,
  contact_field_configs: 26,
  contact_module_preferences: 27,
  student_lookups: 28,
  student_field_configs: 29,
  student_module_preferences: 30,
  teacher_lookups: 32,
  teacher_field_configs: 33,
  teacher_module_preferences: 34,
  session_lookups: 35,
  session_field_configs: 35,
  session_module_preferences: 35,
  attendance_lookups: 36,
  attendance_field_configs: 36,
  attendance_module_preferences: 36,
  finance_field_configs: 36,
  finance_module_preferences: 37,
  hasanat_field_configs: 39,
  hasanat_module_preferences: 40,
  accounting_field_configs: 43,
  accounting_module_preferences: 44,
  enrollment_field_configs: 45,
  enrollment_module_preferences: 46,
  user_field_configs: 47,
  user_module_preferences: 48,
  examinations_field_configs: 49,
  examinations_module_preferences: 50,
  question_bank_field_configs: 51,
  question_bank_module_preferences: 52,
  users: 900,
  // Per-user column prefs restore after `users` because the hasanat
  // distribution/redemption tables have `user_id → tenant_users.id` FKs.
  // The no-FK column-prefs tables join them here for a single consistent group.
  contact_user_column_prefs: 905,
  student_user_column_prefs: 906,
  teacher_user_column_prefs: 907,
  session_user_column_prefs: 908,
  attendance_user_column_prefs: 909,
  enrollment_user_column_prefs: 910,
  user_user_column_prefs: 911,
  hasanat_distribution_user_column_prefs: 912,
  hasanat_redemption_user_column_prefs: 913,
  finance_user_column_prefs: 914,
  finance_payment_user_column_prefs: 915,
  accounting_account_user_column_prefs: 916,
  accounting_journal_user_column_prefs: 917,
  examination_exam_user_column_prefs: 918,
  examination_results_user_column_prefs: 919,
  question_bank_user_column_prefs: 920,
  audit_log: 950,
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
  attendance_lookups: {
    importPath: './repositories/attendanceLookupsRepository.js',
    fnName: 'replaceAttendanceLookupsForWorkspace',
    snapshotFnName: 'listAllAttendanceLookupsByWorkspace',
  },
  attendance_field_configs: {
    importPath: './repositories/attendanceFieldConfigRepository.js',
    fnName: 'replaceAttendanceFieldConfigsForWorkspace',
    snapshotFnName: 'listAllAttendanceFieldConfigsByWorkspace',
  },
  accounting_field_configs: {
    importPath: './repositories/accountingFieldConfigRepository.js',
    fnName: 'replaceAccountingFieldConfigsForWorkspace',
    snapshotFnName: 'listAllAccountingFieldConfigsByWorkspace',
  },
  accounting_module_preferences: {
    importPath: './repositories/accountingModulePreferencesRepository.js',
    fnName: 'replaceAccountingModulePreferencesForWorkspace',
    snapshotFnName: 'listAllAccountingModulePreferencesByWorkspace',
  },
  attendance_module_preferences: {
    importPath: './repositories/attendanceModulePreferencesRepository.js',
    fnName: 'replaceAttendanceModulePreferencesForWorkspace',
    snapshotFnName: 'listAllAttendanceModulePreferencesByWorkspace',
  },
  attendance_user_column_prefs: {
    importPath: './repositories/attendanceUserColumnPrefsRepository.js',
    fnName: 'replaceAttendanceUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllAttendanceUserColumnPrefsByWorkspace',
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
  finance_field_configs: {
    importPath: './repositories/financeFieldConfigRepository.js',
    fnName: 'replaceFinanceFieldConfigsForWorkspace',
    snapshotFnName: 'listAllFinanceFieldConfigsByWorkspace',
  },
  finance_module_preferences: {
    importPath: './repositories/financeModulePreferencesRepository.js',
    fnName: 'replaceFinanceModulePreferencesForWorkspace',
    snapshotFnName: 'listAllFinanceModulePreferencesByWorkspace',
  },
  finance_user_column_prefs: {
    importPath: './repositories/financeUserColumnPrefsRepository.js',
    fnName: 'replaceFinanceUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllFinanceUserColumnPrefsByWorkspace',
  },
  finance_payment_user_column_prefs: {
    importPath: './repositories/financePaymentUserColumnPrefsRepository.js',
    fnName: 'replaceFinancePaymentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllFinancePaymentUserColumnPrefsByWorkspace',
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
  examinations_field_configs: {
    importPath: './repositories/examinationFieldConfigRepository.js',
    fnName: 'replaceExaminationFieldConfigsForWorkspace',
    snapshotFnName: 'listAllExaminationFieldConfigsByWorkspace',
  },
  examinations_module_preferences: {
    importPath: './repositories/examinationModulePreferencesRepository.js',
    fnName: 'replaceExaminationModulePreferencesForWorkspace',
    snapshotFnName: 'listAllExaminationModulePreferencesByWorkspace',
  },
  examination_exam_user_column_prefs: {
    importPath: './repositories/examinationExamUserColumnPrefsRepository.js',
    fnName: 'replaceExaminationExamUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllExaminationExamUserColumnPrefsByWorkspace',
  },
  examination_results_user_column_prefs: {
    importPath: './repositories/examinationResultsUserColumnPrefsRepository.js',
    fnName: 'replaceExaminationResultsUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllExaminationResultsUserColumnPrefsByWorkspace',
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
  hasanat_field_configs: {
    importPath: './repositories/hasanatFieldConfigRepository.js',
    fnName: 'replaceHasanatFieldConfigsForWorkspace',
    snapshotFnName: 'listAllHasanatFieldConfigsByWorkspace',
  },
  hasanat_module_preferences: {
    importPath: './repositories/hasanatModulePreferencesRepository.js',
    fnName: 'replaceHasanatModulePreferencesForWorkspace',
    snapshotFnName: 'listAllHasanatModulePreferencesByWorkspace',
  },
  hasanat_distribution_user_column_prefs: {
    importPath: './repositories/hasanatDistributionUserColumnPrefsRepository.js',
    fnName: 'replaceHasanatDistributionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllHasanatDistributionUserColumnPrefsByWorkspace',
  },
  hasanat_redemption_user_column_prefs: {
    importPath: './repositories/hasanatRedemptionUserColumnPrefsRepository.js',
    fnName: 'replaceHasanatRedemptionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllHasanatRedemptionUserColumnPrefsByWorkspace',
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
  accounting_account_user_column_prefs: {
    importPath: './repositories/accountingAccountUserColumnPrefsRepository.js',
    fnName: 'replaceAccountingAccountUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllAccountingAccountUserColumnPrefsByWorkspace',
  },
  accounting_journal_user_column_prefs: {
    importPath: './repositories/accountingJournalUserColumnPrefsRepository.js',
    fnName: 'replaceAccountingJournalUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllAccountingJournalUserColumnPrefsByWorkspace',
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
  question_bank_field_configs: {
    importPath: './repositories/questionBankFieldConfigRepository.js',
    fnName: 'replaceQuestionBankFieldConfigsForWorkspace',
    snapshotFnName: 'listAllQuestionBankFieldConfigsByWorkspace',
  },
  question_bank_module_preferences: {
    importPath: './repositories/questionBankModulePreferencesRepository.js',
    fnName: 'replaceQuestionBankModulePreferencesForWorkspace',
    snapshotFnName: 'listAllQuestionBankModulePreferencesByWorkspace',
  },
  question_bank_user_column_prefs: {
    importPath: './repositories/questionBankUserColumnPrefsRepository.js',
    fnName: 'replaceQuestionBankUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllQuestionBankUserColumnPrefsByWorkspace',
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
  contact_lookups: {
    importPath: './repositories/contactLookupsRepository.js',
    fnName: 'replaceContactLookupsForWorkspace',
    snapshotFnName: 'listAllContactLookupsByWorkspace',
  },
  student_lookups: {
    importPath: './repositories/studentLookupsRepository.js',
    fnName: 'replaceStudentLookupsForWorkspace',
    snapshotFnName: 'listAllStudentLookupsByWorkspace',
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
  student_field_configs: {
    importPath: './repositories/studentFieldConfigRepository.js',
    fnName: 'replaceStudentFieldConfigsForWorkspace',
    snapshotFnName: 'listAllStudentFieldConfigsByWorkspace',
  },
  student_module_preferences: {
    importPath: './repositories/studentModulePreferencesRepository.js',
    fnName: 'replaceStudentModulePreferencesForWorkspace',
    snapshotFnName: 'listAllStudentModulePreferencesByWorkspace',
  },
  student_user_column_prefs: {
    importPath: './repositories/studentUserColumnPrefsRepository.js',
    fnName: 'replaceStudentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllStudentUserColumnPrefsByWorkspace',
  },
  teacher_lookups: {
    importPath: './repositories/teacherLookupsRepository.js',
    fnName: 'replaceTeacherLookupsForWorkspace',
    snapshotFnName: 'listAllTeacherLookupsByWorkspace',
  },
  teacher_field_configs: {
    importPath: './repositories/teacherFieldConfigRepository.js',
    fnName: 'replaceTeacherFieldConfigsForWorkspace',
    snapshotFnName: 'listAllTeacherFieldConfigsByWorkspace',
  },
  teacher_module_preferences: {
    importPath: './repositories/teacherModulePreferencesRepository.js',
    fnName: 'replaceTeacherModulePreferencesForWorkspace',
    snapshotFnName: 'listAllTeacherModulePreferencesByWorkspace',
  },
  teacher_user_column_prefs: {
    importPath: './repositories/teacherUserColumnPrefsRepository.js',
    fnName: 'replaceTeacherUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllTeacherUserColumnPrefsByWorkspace',
  },
  session_lookups: {
    importPath: './repositories/sessionLookupsRepository.js',
    fnName: 'replaceSessionLookupsForWorkspace',
    snapshotFnName: 'listAllSessionLookupsByWorkspace',
  },
  session_field_configs: {
    importPath: './repositories/sessionFieldConfigRepository.js',
    fnName: 'replaceSessionFieldConfigsForWorkspace',
    snapshotFnName: 'listAllSessionFieldConfigsByWorkspace',
  },
  session_module_preferences: {
    importPath: './repositories/sessionModulePreferencesRepository.js',
    fnName: 'replaceSessionModulePreferencesForWorkspace',
    snapshotFnName: 'listAllSessionModulePreferencesByWorkspace',
  },
  session_user_column_prefs: {
    importPath: './repositories/sessionUserColumnPrefsRepository.js',
    fnName: 'replaceSessionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllSessionUserColumnPrefsByWorkspace',
  },
  enrollment_field_configs: {
    importPath: './repositories/enrollmentFieldConfigRepository.js',
    fnName: 'replaceEnrollmentFieldConfigsForWorkspace',
    snapshotFnName: 'listAllEnrollmentFieldConfigsByWorkspace',
  },
  enrollment_module_preferences: {
    importPath: './repositories/enrollmentModulePreferencesRepository.js',
    fnName: 'replaceEnrollmentModulePreferencesForWorkspace',
    snapshotFnName: 'listAllEnrollmentModulePreferencesByWorkspace',
  },
  enrollment_user_column_prefs: {
    importPath: './repositories/enrollmentUserColumnPrefsRepository.js',
    fnName: 'replaceEnrollmentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllEnrollmentUserColumnPrefsByWorkspace',
  },
  user_field_configs: {
    importPath: './repositories/userFieldConfigRepository.js',
    fnName: 'replaceUserFieldConfigsForWorkspace',
    snapshotFnName: 'listAllUserFieldConfigsByWorkspace',
  },
  user_module_preferences: {
    importPath: './repositories/userModulePreferencesRepository.js',
    fnName: 'replaceUserModulePreferencesForWorkspace',
    snapshotFnName: 'listAllUserModulePreferencesByWorkspace',
  },
  user_user_column_prefs: {
    importPath: './repositories/userUserColumnPrefsRepository.js',
    fnName: 'replaceUserUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllUserUserColumnPrefsByWorkspace',
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
