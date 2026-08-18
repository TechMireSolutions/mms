export interface RelationalCollectionMapping {
  /** Restore order: lower runs first (unmapped defaults to 100). FK-safe ordering. */
  priority?: number;
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
 * Stable collection restore order for FK-safe admin backup restore.
 * Lower priority runs first; unmapped collections default to 100. Contacts must precede
 * users because `tenant_users.contact_id` is an FK with ON DELETE SET NULL — replacing
 * contacts after users would null out restored contact links.
 */
export function sortCollectionNamesForRestore(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const priorityA = RELATIONAL_REPLACE_MAPPING[a]?.priority ?? 100;
    const priorityB = RELATIONAL_REPLACE_MAPPING[b]?.priority ?? 100;
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
    priority: 900,
    importPath: './repositories/tenantUserRepository.js',
    fnName: 'replaceTenantUsersForWorkspace',
    snapshotFnName: 'listAllTenantUsersByWorkspace',
  },
  contacts: {
    priority: 10,
    importPath: './repositories/contactRepository.js',
    fnName: 'replaceContactsForWorkspace',
    snapshotFnName: 'listContactsByWorkspace',
  },
  students: {
    priority: 15,
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
    priority: 36,
    importPath: './repositories/attendanceLookupsRepository.js',
    fnName: 'replaceAttendanceLookupsForWorkspace',
    snapshotFnName: 'listAllAttendanceLookupsByWorkspace',
  },
  attendance_field_configs: {
    priority: 36,
    importPath: './repositories/attendanceFieldConfigRepository.js',
    fnName: 'replaceAttendanceFieldConfigsForWorkspace',
    snapshotFnName: 'listAllAttendanceFieldConfigsByWorkspace',
  },
  accounting_field_configs: {
    priority: 43,
    importPath: './repositories/accountingFieldConfigRepository.js',
    fnName: 'replaceAccountingFieldConfigsForWorkspace',
    snapshotFnName: 'listAllAccountingFieldConfigsByWorkspace',
  },
  accounting_module_preferences: {
    priority: 44,
    importPath: './repositories/accountingModulePreferencesRepository.js',
    fnName: 'replaceAccountingModulePreferencesForWorkspace',
    snapshotFnName: 'listAllAccountingModulePreferencesByWorkspace',
  },
  attendance_module_preferences: {
    priority: 36,
    importPath: './repositories/attendanceModulePreferencesRepository.js',
    fnName: 'replaceAttendanceModulePreferencesForWorkspace',
    snapshotFnName: 'listAllAttendanceModulePreferencesByWorkspace',
  },
  attendance_user_column_prefs: {
    priority: 909,
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
    priority: 36,
    importPath: './repositories/financeFieldConfigRepository.js',
    fnName: 'replaceFinanceFieldConfigsForWorkspace',
    snapshotFnName: 'listAllFinanceFieldConfigsByWorkspace',
  },
  finance_module_preferences: {
    priority: 37,
    importPath: './repositories/financeModulePreferencesRepository.js',
    fnName: 'replaceFinanceModulePreferencesForWorkspace',
    snapshotFnName: 'listAllFinanceModulePreferencesByWorkspace',
  },
  finance_user_column_prefs: {
    priority: 914,
    importPath: './repositories/financeUserColumnPrefsRepository.js',
    fnName: 'replaceFinanceUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllFinanceUserColumnPrefsByWorkspace',
  },
  finance_payment_user_column_prefs: {
    priority: 915,
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
    priority: 49,
    importPath: './repositories/examinationFieldConfigRepository.js',
    fnName: 'replaceExaminationFieldConfigsForWorkspace',
    snapshotFnName: 'listAllExaminationFieldConfigsByWorkspace',
  },
  examinations_module_preferences: {
    priority: 50,
    importPath: './repositories/examinationModulePreferencesRepository.js',
    fnName: 'replaceExaminationModulePreferencesForWorkspace',
    snapshotFnName: 'listAllExaminationModulePreferencesByWorkspace',
  },
  examination_exam_user_column_prefs: {
    priority: 918,
    importPath: './repositories/examinationExamUserColumnPrefsRepository.js',
    fnName: 'replaceExaminationExamUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllExaminationExamUserColumnPrefsByWorkspace',
  },
  examination_results_user_column_prefs: {
    priority: 919,
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
    priority: 39,
    importPath: './repositories/hasanatFieldConfigRepository.js',
    fnName: 'replaceHasanatFieldConfigsForWorkspace',
    snapshotFnName: 'listAllHasanatFieldConfigsByWorkspace',
  },
  hasanat_module_preferences: {
    priority: 40,
    importPath: './repositories/hasanatModulePreferencesRepository.js',
    fnName: 'replaceHasanatModulePreferencesForWorkspace',
    snapshotFnName: 'listAllHasanatModulePreferencesByWorkspace',
  },
  hasanat_distribution_user_column_prefs: {
    priority: 912,
    importPath: './repositories/hasanatDistributionUserColumnPrefsRepository.js',
    fnName: 'replaceHasanatDistributionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllHasanatDistributionUserColumnPrefsByWorkspace',
  },
  hasanat_redemption_user_column_prefs: {
    priority: 913,
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
    priority: 916,
    importPath: './repositories/accountingAccountUserColumnPrefsRepository.js',
    fnName: 'replaceAccountingAccountUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllAccountingAccountUserColumnPrefsByWorkspace',
  },
  accounting_journal_user_column_prefs: {
    priority: 917,
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
    priority: 51,
    importPath: './repositories/questionBankFieldConfigRepository.js',
    fnName: 'replaceQuestionBankFieldConfigsForWorkspace',
    snapshotFnName: 'listAllQuestionBankFieldConfigsByWorkspace',
  },
  question_bank_module_preferences: {
    priority: 52,
    importPath: './repositories/questionBankModulePreferencesRepository.js',
    fnName: 'replaceQuestionBankModulePreferencesForWorkspace',
    snapshotFnName: 'listAllQuestionBankModulePreferencesByWorkspace',
  },
  question_bank_user_column_prefs: {
    priority: 920,
    importPath: './repositories/questionBankUserColumnPrefsRepository.js',
    fnName: 'replaceQuestionBankUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllQuestionBankUserColumnPrefsByWorkspace',
  },
  obligations_user_column_prefs: {
    priority: 921,
    importPath: './repositories/obligationsUserColumnPrefsRepository.js',
    fnName: 'replaceObligationsUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllObligationsUserColumnPrefsByWorkspace',
  },
  messaging_recipients_user_column_prefs: {
    priority: 922,
    importPath: './repositories/messagingRecipientsUserColumnPrefsRepository.js',
    fnName: 'replaceMessagingRecipientsUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllMessagingRecipientsUserColumnPrefsByWorkspace',
  },
  messaging_history_user_column_prefs: {
    priority: 923,
    importPath: './repositories/messagingHistoryUserColumnPrefsRepository.js',
    fnName: 'replaceMessagingHistoryUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllMessagingHistoryUserColumnPrefsByWorkspace',
  },
  messaging_templates_user_column_prefs: {
    priority: 924,
    importPath: './repositories/messagingTemplatesUserColumnPrefsRepository.js',
    fnName: 'replaceMessagingTemplatesUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllMessagingTemplatesUserColumnPrefsByWorkspace',
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
    priority: 25,
    importPath: './repositories/contactLookupsRepository.js',
    fnName: 'replaceContactLookupsForWorkspace',
    snapshotFnName: 'listAllContactLookupsByWorkspace',
  },
  student_lookups: {
    priority: 28,
    importPath: './repositories/studentLookupsRepository.js',
    fnName: 'replaceStudentLookupsForWorkspace',
    snapshotFnName: 'listAllStudentLookupsByWorkspace',
  },
  contact_field_configs: {
    priority: 26,
    importPath: './repositories/contactFieldConfigRepository.js',
    fnName: 'replaceContactFieldConfigsForWorkspace',
    snapshotFnName: 'listAllContactFieldConfigsByWorkspace',
  },
  contact_module_preferences: {
    priority: 27,
    importPath: './repositories/contactModulePreferencesRepository.js',
    fnName: 'replaceContactModulePreferencesForWorkspace',
    snapshotFnName: 'listAllContactModulePreferencesByWorkspace',
  },
  contact_user_column_prefs: {
    priority: 905,
    importPath: './repositories/contactUserColumnPrefsRepository.js',
    fnName: 'replaceContactUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllContactUserColumnPrefsByWorkspace',
  },
  student_field_configs: {
    priority: 29,
    importPath: './repositories/studentFieldConfigRepository.js',
    fnName: 'replaceStudentFieldConfigsForWorkspace',
    snapshotFnName: 'listAllStudentFieldConfigsByWorkspace',
  },
  student_module_preferences: {
    priority: 30,
    importPath: './repositories/studentModulePreferencesRepository.js',
    fnName: 'replaceStudentModulePreferencesForWorkspace',
    snapshotFnName: 'listAllStudentModulePreferencesByWorkspace',
  },
  student_user_column_prefs: {
    priority: 906,
    importPath: './repositories/studentUserColumnPrefsRepository.js',
    fnName: 'replaceStudentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllStudentUserColumnPrefsByWorkspace',
  },
  teacher_lookups: {
    priority: 32,
    importPath: './repositories/teacherLookupsRepository.js',
    fnName: 'replaceTeacherLookupsForWorkspace',
    snapshotFnName: 'listAllTeacherLookupsByWorkspace',
  },
  teacher_field_configs: {
    priority: 33,
    importPath: './repositories/teacherFieldConfigRepository.js',
    fnName: 'replaceTeacherFieldConfigsForWorkspace',
    snapshotFnName: 'listAllTeacherFieldConfigsByWorkspace',
  },
  teacher_module_preferences: {
    priority: 34,
    importPath: './repositories/teacherModulePreferencesRepository.js',
    fnName: 'replaceTeacherModulePreferencesForWorkspace',
    snapshotFnName: 'listAllTeacherModulePreferencesByWorkspace',
  },
  teacher_user_column_prefs: {
    priority: 907,
    importPath: './repositories/teacherUserColumnPrefsRepository.js',
    fnName: 'replaceTeacherUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllTeacherUserColumnPrefsByWorkspace',
  },
  session_lookups: {
    priority: 35,
    importPath: './repositories/sessionLookupsRepository.js',
    fnName: 'replaceSessionLookupsForWorkspace',
    snapshotFnName: 'listAllSessionLookupsByWorkspace',
  },
  session_field_configs: {
    priority: 35,
    importPath: './repositories/sessionFieldConfigRepository.js',
    fnName: 'replaceSessionFieldConfigsForWorkspace',
    snapshotFnName: 'listAllSessionFieldConfigsByWorkspace',
  },
  session_module_preferences: {
    priority: 35,
    importPath: './repositories/sessionModulePreferencesRepository.js',
    fnName: 'replaceSessionModulePreferencesForWorkspace',
    snapshotFnName: 'listAllSessionModulePreferencesByWorkspace',
  },
  session_user_column_prefs: {
    priority: 908,
    importPath: './repositories/sessionUserColumnPrefsRepository.js',
    fnName: 'replaceSessionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllSessionUserColumnPrefsByWorkspace',
  },
  enrollment_field_configs: {
    priority: 45,
    importPath: './repositories/enrollmentFieldConfigRepository.js',
    fnName: 'replaceEnrollmentFieldConfigsForWorkspace',
    snapshotFnName: 'listAllEnrollmentFieldConfigsByWorkspace',
  },
  enrollment_module_preferences: {
    priority: 46,
    importPath: './repositories/enrollmentModulePreferencesRepository.js',
    fnName: 'replaceEnrollmentModulePreferencesForWorkspace',
    snapshotFnName: 'listAllEnrollmentModulePreferencesByWorkspace',
  },
  enrollment_user_column_prefs: {
    priority: 910,
    importPath: './repositories/enrollmentUserColumnPrefsRepository.js',
    fnName: 'replaceEnrollmentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllEnrollmentUserColumnPrefsByWorkspace',
  },
  user_field_configs: {
    priority: 47,
    importPath: './repositories/userFieldConfigRepository.js',
    fnName: 'replaceUserFieldConfigsForWorkspace',
    snapshotFnName: 'listAllUserFieldConfigsByWorkspace',
  },
  user_module_preferences: {
    priority: 48,
    importPath: './repositories/userModulePreferencesRepository.js',
    fnName: 'replaceUserModulePreferencesForWorkspace',
    snapshotFnName: 'listAllUserModulePreferencesByWorkspace',
  },
  user_user_column_prefs: {
    priority: 911,
    importPath: './repositories/userUserColumnPrefsRepository.js',
    fnName: 'replaceUserUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllUserUserColumnPrefsByWorkspace',
  },
  saved_reports: {
    importPath: './repositories/savedReportsRepository.js',
    fnName: 'replaceSavedReportsForWorkspace',
    snapshotFnName: 'listAllSavedReportsByWorkspace',
  },
  dashboard_preferences: {
    priority: 41,
    importPath: './repositories/dashboardPreferencesRepository.js',
    fnName: 'replaceDashboardPreferencesForWorkspace',
    snapshotFnName: 'listAllDashboardPreferencesByWorkspace',
  },
  dashboard_widgets: {
    priority: 42,
    importPath: './repositories/dashboardWidgetsRepository.js',
    fnName: 'replaceDashboardWidgetsForWorkspace',
    snapshotFnName: 'listAllDashboardWidgetsByWorkspace',
  },
  audit_log: {
    priority: 950,
    importPath: './repositories/logsRepository.js',
    fnName: 'replaceAuditLogEntriesForWorkspace',
  },

};
