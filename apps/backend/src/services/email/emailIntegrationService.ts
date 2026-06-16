import { getObject, saveObject } from '../../db/database.js';
import {
  EMAIL_INTEGRATION_OBJECT_KEY,
  EMAIL_INTEGRATION_SECRETS_KEY,
  mergeEmailIntegrationConfig,
  type EmailIntegrationConfig,
  type EmailIntegrationSecrets,
} from '@mms/shared';

export async function loadEmailIntegrationConfig(): Promise<EmailIntegrationConfig> {
  const raw = await getObject(EMAIL_INTEGRATION_OBJECT_KEY);
  return mergeEmailIntegrationConfig(raw as Partial<EmailIntegrationConfig> | null);
}

export async function saveEmailIntegrationConfig(
  config: EmailIntegrationConfig,
): Promise<EmailIntegrationConfig> {
  const merged = mergeEmailIntegrationConfig(config);
  await saveObject(EMAIL_INTEGRATION_OBJECT_KEY, merged);
  return merged;
}

export async function loadEmailIntegrationSecrets(): Promise<EmailIntegrationSecrets> {
  const raw = await getObject(EMAIL_INTEGRATION_SECRETS_KEY);
  if (!raw || typeof raw !== 'object') return {};
  const record = raw as EmailIntegrationSecrets;
  return {
    smtpPassword: typeof record.smtpPassword === 'string' ? record.smtpPassword : undefined,
  };
}

export async function saveEmailIntegrationSecrets(
  secrets: EmailIntegrationSecrets,
): Promise<void> {
  const existing = await loadEmailIntegrationSecrets();
  const next: EmailIntegrationSecrets = {
    smtpPassword:
      secrets.smtpPassword !== undefined ? secrets.smtpPassword : existing.smtpPassword,
  };
  await saveObject(EMAIL_INTEGRATION_SECRETS_KEY, next);
}

export async function markEmailIntegrationTestResult(
  ok: boolean,
  errorMessage?: string,
): Promise<EmailIntegrationConfig> {
  const current = await loadEmailIntegrationConfig();
  const updated = mergeEmailIntegrationConfig({
    ...current,
    connected: ok,
    hasCredentials: current.hasCredentials,
    lastTestAt: new Date().toISOString(),
    lastTestOk: ok,
    lastError: ok ? undefined : errorMessage,
  });
  return saveEmailIntegrationConfig(updated);
}
