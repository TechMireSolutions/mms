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
export * from './globalSettingsUtils.js';
export * from './languageUtils.js';
export * from './timezoneUtils.js';
export * from './dateFormatUtils.js';
export * from './emailIntegrationTypes.js';
export * from './emailProviderRegistry.js';
export * from './smsUtils.js';
export * from './appTranslations.js';
export * from './contactTranslations.js';
export * from './backupTypes.js';
export * from './backupCrypto.js';
export * from './brandingTypes.js';
export * from './brandingTheme.js';
export * from './chartPalettes.js';
export * from './logoBrandColors.js';
export * from './moduleTierTabs.js';
export * from './contactTypes.js';
export * from './workspaceTypes.js';
export * from './tenantUtils.js';
export * from './tenantStorage.js';
export * from './userTypes.js';
export * from './questionBankTypes.js';
export * from './utils.js';
export * from './teacherTypes.js';
export * from './teacherUtils.js';
export * from './demoSeedBuilders.js';
export * from './demoTeachers.js';
export * from './demoStudents.js';
export * from './studentTypes.js';
export * from './studentUtils.js';
export * from './contactLinkPolicy.js';
export * from './linkedCollectionUtils.js';
export * from './permissions.js';
export * from './auditTypes.js';
export * from './platformTypes.js';
export * from './platformSetupValidation.js';
export * from './serverPorts.js';
export * from './tenantAuthTypes.js';

