/**
 * @file index.ts
 * @description Root entry point for @mms/shared.
 * Exports domain models, validation schemas, module manifests, settings defaults,
 * and pure utility functions across frontend and backend applications.
 */

// ---------------------------------------------------------------------------
// 1. Core Auth & User Identity
// ---------------------------------------------------------------------------
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
  /** Forces the user through password change before normal workspace access. */
  mustChangePassword?: boolean;
}

export * from './auditTypes.js';
export * from './passwordStrengthUtils.js';
export * from './permissions.js';
export * from './profileSchemas.js';
export * from './tenantAuthTypes.js';
export * from './tenantStorage.js';
export * from './tenantUtils.js';
export * from './userTypes.js';
export * from './workspaceTypes.js';

// ---------------------------------------------------------------------------
// 2. Platform & System Infrastructure
// ---------------------------------------------------------------------------
export * from './apiSchemas.js';
export * from './backgroundJobTypes.js';
export * from './platformApiErrors.js';
export * from './platformSchemas.js';
export * from './platformSettingsTypes.js';
export * from './platformSetupValidation.js';
export * from './platformTypes.js';
export * from './serverPorts.js';

// ---------------------------------------------------------------------------
// 3. Global Settings, Theme & Branding
// ---------------------------------------------------------------------------
export * from './appTranslations.js';
export * from './backupCrypto.js';
export * from './backupTypes.js';
export * from './brandingChartPalette.js';
export * from './brandingColorUtils.js';
export * from './brandingCornerStyle.js';
export * from './brandingCssVariables.js';
export * from './brandingTypes.js';
export * from './chartPalettes.js';
export * from './dashboardPreferencesTypes.js';
export * from './dashboardWidgetSchema.js';
export * from './dashboardSeriesUtils.js';
export * from './dateFormatUtils.js';
export * from './emailIntegrationTypes.js';
export * from './emailProviderRegistry.js';
export * from './globalSettingsTypes.js';
export * from './globalSettingsUtils.js';
export * from './imageOptimizationUtils.js';
export * from './languageUtils.js';
export * from './llmSettingsTypes.js';
export * from './logoBrandColors.js';
export * from './logoPaletteSampling.js';
export * from './settingsDateFormatters.js';
export * from './timezoneUtils.js';

// ---------------------------------------------------------------------------
// 4. Module Setup, Field Registry & Column Layout
// ---------------------------------------------------------------------------
export * from './contactLinkPolicy.js';
export * from './createFieldRemovalIssuesChecker.js';
export * from './createFormCustomFieldHelpers.js';
export * from './fieldUsage.js';
export * from './linkedCollectionUtils.js';
export * from './moduleColumnPreferences.js';
export * from './moduleColumnRegistrySync.js';
export * from './moduleCommandMetrics.js';
export * from './moduleFieldConfigPutBodySchema.js';
export * from './moduleFieldConfigUtils.js';
export * from './moduleFieldSchema.js';
export * from './moduleFieldSetupDefaults.js';
export * from './moduleTierTabs.js';

// ---------------------------------------------------------------------------
// 5. Contacts Feature Module
// ---------------------------------------------------------------------------
export * from './contactColumnAccess.js';
export * from './contactColumnRegistrySync.js';
export * from './contactDuplicateUtils.js';
export * from './contactEnabledTabs.js';
export * from './contactFieldAccess.js';
export * from './contactFieldDependencies.js';
export * from './contactFieldUsage.js';
export * from './contactFormCustomFields.js';
export * from './contactIdentityMatch.js';
export * from './contactLookupTypes.js';
export * from './contactProfileCompleteness.js';
export * from './contactRelationshipRules.js';
export * from './contactResponseSanitizer.js';
export * from './contactSetupConfigTypes.js';
export * from './contactSiblingDerivation.js';
export * from './contactSoftDelete.js';
export * from './contactSyncDiff.js';
export * from './contactTypes.js';
export * from './contactUtils.js';
export * from './contactValidation.js';
export * from './contactsDuplicatesQuery.js';
export * from './contactsExportUtils.js';
export * from './contactsListQuery.js';
export * from './contactsMetricsUtils.js';
export * from './contactsModuleManifest.js';
export * from './contactsPreferencesTypes.js';
export * from './contactsReportAnalytics.js';
export * from './contactsReportFields.js';
export * from './contactsSearchUtils.js';
export * from './contactsWidgetAggregate.js';
export * from './savedReportsSchemas.js';
export type { ContactsSavedReportShareScope, ContactsSavedReportViewer } from './contactsSavedReportUtils.js';
export {
  canDeleteContactsSavedReport,
  canViewContactsSavedReport,
  validateContactsSavedReportDrillDown,
} from './contactsSavedReportUtils.js';
export * from './socialPlatformUtils.js';


// ---------------------------------------------------------------------------
// 6. Students Feature Module
// ---------------------------------------------------------------------------
export * from './studentColumnRegistrySync.js';
export * from './studentDirectoryColumns.js';
export * from './studentFieldDependencies.js';
export * from './studentFormCustomFields.js';
export * from './studentGuardianFromContacts.js';
export * from './studentLookupTypes.js';
export * from './studentRegistrationUtils.js';
export * from './studentSettingsUtils.js';
export * from './studentSetupConfigTypes.js';
export * from './studentTypes.js';
export * from './studentUtils.js';
export * from './schemas/students.dto.js';
export * from './schemas/contacts.dto.js';
export * from './schemas/auth.dto.js';
export * from './schemas/common.dto.js';
export * from './schemas/csvExport.dto.js';
export * from './schemas/teachers.dto.js';
export * from './schemas/finance.dto.js';
export * from './schemas/sessions.dto.js';
export * from './schemas/moduleColumnPreferences.dto.js';
export * from './schemas/attendance.dto.js';
export * from './schemas/users.dto.js';
export * from './schemas/db.dto.js';
export * from './schemas/enrollments.dto.js';
export * from './schemas/email.dto.js';
export * from './schemas/sanitize.js';
export * from './schemas/hasanat.dto.js';
export * from './schemas/examinations.dto.js';
export * from './schemas/questionBank.dto.js';
export * from './schemas/backgroundJob.dto.js';
export * from './contracts/index.js';
export * from './studentsExportUtils.js';
export * from './studentsListQuery.js';
export * from './studentsModuleManifest.js';
export * from './studentsModuleSettings.js';
export * from './studentsResponseSanitizer.js';
export * from './studentsWidgetAggregate.js';
export {
  STUDENT_WRITE_SYSTEM_KEYS,
  buildDynamicStudentSchema,
  formatStudentZodIssues,
  collectStudentWriteExtraFieldKeys,
} from './studentValidation.js';

// ---------------------------------------------------------------------------
// 7. Teachers Feature Module
// ---------------------------------------------------------------------------
export * from './teacherColumnRegistrySync.js';
export * from './teacherDirectoryColumns.js';
export * from './teacherEnabledTabs.js';
export * from './teacherFieldCellFormat.js';
export * from './teacherFieldDependencies.js';
export * from './teacherFormCustomFields.js';
export * from './teacherLookupTypes.js';
export * from './teacherRegistrationUtils.js';
export * from './teacherResponseSanitizer.js';
export * from './teacherSetupConfigTypes.js';
export * from './teacherTypes.js';
export * from './teacherUtils.js';
export * from './teachersExportUtils.js';
export * from './teachersListQuery.js';
export * from './teachersModuleManifest.js';
export * from './teachersModuleSettings.js';
export * from './teachersWidgetAggregate.js';
export {
  TEACHER_WRITE_SYSTEM_KEYS,
  buildDynamicTeacherSchema,
  collectTeacherWriteExtraFieldKeys,
  formatTeacherZodIssues,
} from './teacherValidation.js';

// ---------------------------------------------------------------------------
// 8. Sessions & Enrollments Modules
// ---------------------------------------------------------------------------
export * from './enrollmentSetupConfigTypes.js';
export * from './enrollmentsExportUtils.js';
export * from './enrollmentsListQuery.js';
export * from './enrollmentsModuleManifest.js';
export * from './enrollmentsModuleSettings.js';
export * from './enrollmentsReportAggregates.js';
export * from './enrollmentsWidgetAggregate.js';
export * from './sessionFormCustomFields.js';
export * from './sessionLookupTypes.js';
export * from './sessionSetupConfigTypes.js';
export * from './sessionTypeI18n.js';
export * from './sessionTypes.js';
export * from './sessionUtils.js';
export * from './sessionsExportUtils.js';
export * from './sessionsListQuery.js';
export * from './sessionsModuleManifest.js';
export * from './sessionsModuleSettings.js';
export * from './sessionsReportAggregates.js';
export * from './sessionsWidgetAggregate.js';

// ---------------------------------------------------------------------------
// 9. Attendance, Finance, Accounting & Obligations
// ---------------------------------------------------------------------------
export * from './accountingListQuery.js';
export * from './accountingModuleManifest.js';
export * from './accountingModuleSettings.js';
export * from './accountingSetupConfigTypes.js';
export * from './attendanceListQuery.js';
export * from './attendanceLookupTypes.js';
export * from './attendanceModuleManifest.js';
export * from './attendanceModuleSettings.js';
export * from './attendanceReportAggregates.js';
export * from './attendanceSetupConfigTypes.js';
export * from './financeListQuery.js';
export * from './financeModuleManifest.js';
export * from './financeModuleSettings.js';
export * from './financeReportAggregates.js';
export * from './financeSetupConfigTypes.js';
export * from './obligationsModuleManifest.js';

// ---------------------------------------------------------------------------
// 10. Hasanat, Examinations & Question Bank
// ---------------------------------------------------------------------------
export * from './examinationsListQuery.js';
export * from './examinationsModuleManifest.js';
export * from './examinationsModuleSettings.js';
export * from './examinationsSetupConfigTypes.js';
export * from './hasanatListQuery.js';
export * from './hasanatModuleManifest.js';
export * from './hasanatModuleSettings.js';
export * from './hasanatPointsUtils.js';
export * from './hasanatReportAggregates.js';
export * from './hasanatSetupConfigTypes.js';
export * from './questionBankAnswerUtils.js';
export * from './questionBankCategoryUtils.js';
export * from './questionBankCore.js';
export * from './questionBankDefaults.js';
export * from './questionBankEntities.js';
export * from './questionBankFormUtils.js';
export * from './questionBankListQuery.js';
export * from './questionBankModuleManifest.js';
export * from './questionBankModuleSettings.js';
export * from './questionBankSetupConfigTypes.js';
export * from './questionBankSourceUtils.js';
export * from './questionBankTypes.js';

// ---------------------------------------------------------------------------
// 11. Users & Messaging Modules
// ---------------------------------------------------------------------------
export * from './dashboardModuleManifest.js';
export * from './messagingModuleManifest.js';
export * from './messagingPersonalizeUtils.js';
export * from './messagingSchemas.js';
export * from './smsUtils.js';
export * from './userSetupConfigTypes.js';
export * from './usersExportUtils.js';
export * from './usersListQuery.js';
export * from './usersModuleManifest.js';
export * from './usersModuleSettings.js';
export * from './whatsappProvider.js';

// ---------------------------------------------------------------------------
// 12. Cross-Cutting Utilities & Seed Builders
// ---------------------------------------------------------------------------
export * from './ageUtils.js';
export * from './blueprintVersionUtils.js';
export * from './contactSanitization.js';
export * from './csvUtils.js';
export * from './gradeUtils.js';
export * from './identityFormatUtils.js';
export * from './moneyFormatUtils.js';
export * from './numberUtils.js';
export * from './paginationUtils.js';
export * from './phoneUtils.js';
export * from './titleCaseUtils.js';
export * from './vcardUtils.js';
export * from './widgetFilterUtils.js';


