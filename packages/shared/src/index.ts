/** Shared User interface used across frontend and backend. */
export interface User {
  id: string;
  /** Sign-in email (`loginEmail`); kept as `email` for JWT backward compatibility. */
  email: string;
  name: string;
  role: string;
  /** Madrasa subdomain this account belongs to. */
  workspaceSubdomain: string;
  /** Linked CRM contact for profile fields. */
  contactId?: string | number;
  loginEmail?: string;
  emailVerifiedAt?: string;
}

export * from './settingsTypes.js';
export * from './llmSettingsTypes.js';
export * from './globalSettingsUtils.js';
export * from './languageUtils.js';
export * from './timezoneUtils.js';
export * from './dateFormatUtils.js';
export * from './emailIntegrationTypes.js';
export * from './emailProviderRegistry.js';
export * from './smsUtils.js';
export * from './appTranslations.js';
export * from './backupTypes.js';
export * from './backupCrypto.js';
export * from './brandingTypes.js';
export * from './brandingTheme.js';
export * from './chartPalettes.js';
export * from './logoBrandColors.js';
export * from './logoPaletteSampling.js';
export * from './brandingCornerStyle.js';
export * from './moduleTierTabs.js';
export * from './contactFieldDependencies.js';
export * from './contactsReportFields.js';
export * from './contactTypes.js';
export * from './contactDuplicateUtils.js';
export * from './contactsModuleContract.js';
export * from './contactsPreferencesTypes.js';
export * from './contactsSearchUtils.js';
export * from './contactsMetricsUtils.js';
export * from './contactsReportAnalytics.js';
export * from './contactsWidgetAggregate.js';
export * from './studentsWidgetAggregate.js';
export * from './backgroundJobTypes.js';
export * from './contactProfileCompleteness.js';
export * from './contactsListQuery.js';
export * from './contactsExportUtils.js';
export * from './contactsDuplicatesQuery.js';
export type { ContactsSavedReportShareScope, ContactsSavedReportViewer } from './contactsSavedReportUtils.js';
export {
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  validateContactsSavedReportDrillDown,
} from './contactsSavedReportUtils.js';
export * from './contactResponseSanitizer.js';
export * from './contactSyncDiff.js';
export * from './contactSoftDelete.js';
export * from './contactFieldAccess.js';
export * from './contactColumnAccess.js';
export * from './workspaceTypes.js';
export * from './tenantUtils.js';
export * from './tenantStorage.js';
export * from './userTypes.js';
export * from './questionBankTypes.js';
export * from './utils.js';
export * from './csvUtils.js';
export * from './gradeUtils.js';
export * from './teacherTypes.js';
export * from './teacherUtils.js';
export * from './demoSeedBuilders.js';
export * from './demoTeachers.js';
export * from './demoStudents.js';
export * from './studentTypes.js';
export * from './studentsModuleContract.js';
export * from './studentsListQuery.js';
export * from './studentRegistrationUtils.js';
export * from './teachersModuleContract.js';
export * from './teachersListQuery.js';
export * from './teacherRegistrationUtils.js';
export * from './teachersWidgetAggregate.js';
export * from './financeModuleContract.js';
export * from './attendanceModuleContract.js';
export * from './sessionsModuleContract.js';
export * from './enrollmentsModuleContract.js';
export * from './obligationsModuleContract.js';
export * from './accountingModuleContract.js';
export * from './hasanatModuleContract.js';
export * from './examinationsModuleContract.js';
export * from './questionBankModuleContract.js';
export * from './usersModuleContract.js';
export * from './moduleCommandMetrics.js';
export * from './moduleColumnPreferences.js';
export * from './studentUtils.js';
export * from './contactLinkPolicy.js';
export * from './linkedCollectionUtils.js';
export * from './permissions.js';
export * from './auditTypes.js';
export * from './platformTypes.js';
export * from './platformSetupValidation.js';
export * from './serverPorts.js';
export * from './tenantAuthTypes.js';
export * from './contactValidation.js';
export { buildDynamicStudentSchema, formatStudentZodIssues } from './studentValidation.js';

export const DEFAULT_CURRENCIES = [
  { id: "cur1", code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { id: "cur2", code: "USD", name: "US Dollar", symbol: "$" },
  { id: "cur3", code: "GBP", name: "British Pound", symbol: "£" }
];
