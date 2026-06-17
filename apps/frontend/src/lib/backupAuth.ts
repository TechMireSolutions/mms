import { apiFetch } from './apiClient';

/** Confirms admin password before encrypting a backup (accepts 2FA-pending as valid). */
export async function verifyAdminBackupPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; errorKey: 'backup.invalidAdminPassword' | 'backup.serverFetchFailed' }> {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const data = (await response.json()) as {
      requires2FA?: boolean;
      type?: string;
    };

    if (response.ok || data.requires2FA === true) {
      return { ok: true };
    }

    if (data.type === 'invalid_credentials') {
      return { ok: false, errorKey: 'backup.invalidAdminPassword' };
    }

    return { ok: false, errorKey: 'backup.invalidAdminPassword' };
  } catch {
    return { ok: false, errorKey: 'backup.serverFetchFailed' };
  }
}
