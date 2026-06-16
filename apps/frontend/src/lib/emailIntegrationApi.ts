import type { EmailIntegrationConfig } from '@mms/shared';
import { apiFetch, apiJson } from './apiClient';

export async function fetchEmailIntegration(): Promise<EmailIntegrationConfig | null> {
  try {
    return await apiJson<EmailIntegrationConfig>('/api/email/integration');
  } catch {
    return null;
  }
}

export type SaveEmailIntegrationInput = EmailIntegrationConfig & {
  smtpPassword?: string;
};

export async function saveEmailIntegration(
  payload: SaveEmailIntegrationInput,
): Promise<EmailIntegrationConfig> {
  return apiJson<EmailIntegrationConfig>('/api/email/integration', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function testEmailIntegration(): Promise<EmailIntegrationConfig> {
  const data = await apiJson<{ config: EmailIntegrationConfig }>('/api/email/integration/test', {
    method: 'POST',
  });
  return data.config;
}

export async function sendVerificationCodeEmail(code: string): Promise<boolean> {
  try {
    const data = await apiJson<{ delivered?: boolean }>('/api/email/verification-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return data.delivered === true;
  } catch {
    return false;
  }
}
