import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { type EmailIntegrationRow } from '../schema/messaging.js';
import type { EmailIntegrationConfig, EmailIntegrationSecrets } from '@mms/shared';
import { DEFAULT_EMAIL_INTEGRATION } from '@mms/shared';

export async function getEmailIntegrationRow(workspaceSubdomain: string): Promise<EmailIntegrationRow | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.emailIntegrations)
      .where(eq(schema.emailIntegrations.workspaceSubdomain, workspaceSubdomain))
      .limit(1);

    return rows[0] ?? null;
  } catch (err) {
    if (err instanceof Error && err.message === 'Database not initialized') {
      return null;
    }
    throw err;
  }
}

export async function upsertEmailIntegrationConfigRow(
  workspaceSubdomain: string,
  config: EmailIntegrationConfig,
): Promise<void> {
  const db = getDb();
  await db
    .insert(schema.emailIntegrations)
    .values({
      workspaceSubdomain,
      providerId: config.providerId,
      fromAddress: config.fromAddress,
      fromName: config.fromName,
      smtpUsername: config.smtpUsername,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: config.smtpSecure,
      connected: config.connected,
      hasCredentials: config.hasCredentials,
      lastTestAt: config.lastTestAt ? new Date(config.lastTestAt) : null,
      lastTestOk: config.lastTestOk ?? null,
      lastError: config.lastError,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.emailIntegrations.workspaceSubdomain,
      set: {
        providerId: config.providerId,
        fromAddress: config.fromAddress,
        fromName: config.fromName,
        smtpUsername: config.smtpUsername,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        connected: config.connected,
        hasCredentials: config.hasCredentials,
        lastTestAt: config.lastTestAt ? new Date(config.lastTestAt) : null,
        lastTestOk: config.lastTestOk ?? null,
        lastError: config.lastError,
        updatedAt: new Date(),
      },
    });
}

export async function upsertEmailIntegrationSecretsRow(
  workspaceSubdomain: string,
  secrets: EmailIntegrationSecrets,
): Promise<void> {
  const db = getDb();
  await db
    .insert(schema.emailIntegrations)
    .values({
      workspaceSubdomain,
      providerId: DEFAULT_EMAIL_INTEGRATION.providerId,
      smtpPassword: secrets.smtpPassword,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.emailIntegrations.workspaceSubdomain,
      set: {
        smtpPassword: secrets.smtpPassword,
        updatedAt: new Date(),
      },
    });
}
