/** Shared User interface used across frontend and backend. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  /** Madrasa subdomain this account belongs to. */
  workspaceSubdomain: string;
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
export * from './logoBrandColors.js';
export * from './contactTypes.js';
export * from './workspaceTypes.js';
export * from './tenantUtils.js';
export * from './tenantStorage.js';
export * from './userTypes.js';
export * from './questionBankTypes.js';
export * from './utils.js';
export * from './permissions.js';
export * from './auditTypes.js';
export * from './platformTypes.js';
export * from './platformSetupValidation.js';

