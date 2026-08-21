import {
  mergeEmailIntegrationConfig,
  type EmailIntegrationConfig,
  type EmailIntegrationSecrets,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import {
  getEmailIntegrationRow,
  upsertEmailIntegrationConfigRow,
  upsertEmailIntegrationSecretsRow,
} from '../../db/repositories/emailIntegrationRepository.js';

export async function loadEmailIntegrationConfig(): Promise<EmailIntegrationConfig> {
  const subdomain = getRequestTenant();
  if (!subdomain) return mergeEmailIntegrationConfig(null);
  const row = await getEmailIntegrationRow(subdomain);
  if (!row) return mergeEmailIntegrationConfig(null);

  return mergeEmailIntegrationConfig({
    providerId: row.providerId as any,
    fromAddress: row.fromAddress,
    fromName: row.fromName,
    smtpUsername: row.smtpUsername,
    smtpHost: row.smtpHost ?? undefined,
    smtpPort: row.smtpPort ?? undefined,
    smtpSecure: row.smtpSecure ?? undefined,
    connected: row.connected,
    hasCredentials: row.hasCredentials,
    lastTestAt: row.lastTestAt ? row.lastTestAt.toISOString() : undefined,
    lastTestOk: row.lastTestOk ?? undefined,
    lastError: row.lastError ?? undefined,
  });
}

export async function saveEmailIntegrationConfig(
  config: EmailIntegrationConfig,
): Promise<EmailIntegrationConfig> {
  const subdomain = getRequestTenant();
  if (!subdomain) throw new Error('Tenant context missing');
  const merged = mergeEmailIntegrationConfig(config);
  await upsertEmailIntegrationConfigRow(subdomain, merged);
  return merged;
}

export async function loadEmailIntegrationSecrets(): Promise<EmailIntegrationSecrets> {
  const subdomain = getRequestTenant();
  if (!subdomain) return {};
  const row = await getEmailIntegrationRow(subdomain);
  if (!row) return {};

  return {
    smtpPassword: row.smtpPassword ?? undefined,
  };
}

export async function saveEmailIntegrationSecrets(
  secrets: EmailIntegrationSecrets,
): Promise<void> {
  const subdomain = getRequestTenant();
  if (!subdomain) throw new Error('Tenant context missing');
  await upsertEmailIntegrationSecretsRow(subdomain, secrets);
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
