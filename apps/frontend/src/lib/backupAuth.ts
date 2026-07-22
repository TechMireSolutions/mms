import { apiFetch } from '@/lib/apiClient';

/** Confirms admin password before encrypting a backup (accepts 2FA-pending as valid). */
export async function verifyAdminBackupPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; errorKey: 'backup.invalidAdminPassword' | 'backup.serverFetchFailed' }> {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const authProbeResponse = (await response.json()) as {
      requires2FA?: boolean;
      type?: string;
    };

    if (response.ok || authProbeResponse.requires2FA === true) {
      return { ok: true };
    }

    return { ok: false, errorKey: 'backup.invalidAdminPassword' };
  } catch {
    return { ok: false, errorKey: 'backup.serverFetchFailed' };
  }
}
