import type { AppTranslationKey } from './appTranslations.js';

/** Logical object keys for email integration storage. */
export const EMAIL_INTEGRATION_OBJECT_KEY = 'email_integration' as const;

/** Backend-only — never synced to the browser. */
export const EMAIL_INTEGRATION_SECRETS_KEY = 'email_integration_secrets' as const;

/** Object keys withheld from `/api/db/sync` and direct object reads. */
export const SERVER_ONLY_OBJECT_KEYS: readonly string[] = [
  EMAIL_INTEGRATION_SECRETS_KEY,
] as const;

export function isServerOnlyObjectKey(key: string): boolean {
  return SERVER_ONLY_OBJECT_KEYS.includes(key);
}

export const EMAIL_PROVIDERS = [
  'gmail',
  'microsoft365',
  'outlook',
  'yahoo',
  'icloud',
  'zoho',
  'custom_smtp',
] as const;

export type EmailProviderId = typeof EMAIL_PROVIDERS[number];

export function isEmailProviderId(value: unknown): value is EmailProviderId {
  return typeof value === 'string' && (EMAIL_PROVIDERS as readonly string[]).includes(value);
}


export type EmailConnectionType = 'smtp' | 'oauth';

export interface EmailProviderPreset {
  id: EmailProviderId;
  labelKey: AppTranslationKey;
  hintKey: AppTranslationKey;
  connectionType: EmailConnectionType;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
  /** BCP 47 hint for default from-address domain examples in UI. */
  exampleDomain: string;
}

/** Public integration config (safe to store in tenant sync). */
export interface EmailIntegrationConfig {
  providerId: EmailProviderId;
  fromAddress: string;
  fromName: string;
  smtpUsername: string;
  /** Custom SMTP host when `providerId` is `custom_smtp`. */
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  connected: boolean;
  hasCredentials: boolean;
  lastTestAt?: string;
  lastTestOk?: boolean;
  lastError?: string;
}

/** Credentials — server-side only. */
export interface EmailIntegrationSecrets {
  smtpPassword?: string;
}

export const DEFAULT_EMAIL_INTEGRATION: EmailIntegrationConfig = {
  providerId: 'gmail',
  fromAddress: '',
  fromName: 'Madrasa Management System',
  smtpUsername: '',
  connected: false,
  hasCredentials: false,
};

export function mergeEmailIntegrationConfig(
  partial?: Partial<EmailIntegrationConfig> | null,
): EmailIntegrationConfig {
  const providerId = partial?.providerId ?? DEFAULT_EMAIL_INTEGRATION.providerId;
  return {
    ...DEFAULT_EMAIL_INTEGRATION,
    ...partial,
    providerId: isEmailProviderId(providerId)
      ? providerId
      : DEFAULT_EMAIL_INTEGRATION.providerId,
    fromName: partial?.fromName?.trim() || DEFAULT_EMAIL_INTEGRATION.fromName,
    fromAddress: partial?.fromAddress?.trim() ?? '',
    smtpUsername: partial?.smtpUsername?.trim() ?? '',
  };
}
