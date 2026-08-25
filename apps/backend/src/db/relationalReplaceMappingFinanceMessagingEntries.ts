import type { RelationalCollectionMapping } from './relationalReplaceMappingTypes.js';

/** Finance, accounting, messaging, dashboard, and audit collections. */
export const RELATIONAL_REPLACE_MAPPING_FINANCE_MESSAGING: Record<string, RelationalCollectionMapping> = {
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
