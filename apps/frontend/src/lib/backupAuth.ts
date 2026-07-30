import { apiFetch } from '@/lib/apiClient';

/** Confirms the signed-in admin's password before encrypting or restoring a backup. */
export async function verifyAdminBackupPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; errorKey: 'backup.invalidAdminPassword' | 'backup.serverFetchFailed' }> {
  try {
    const response = await apiFetch('/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password, email: email.trim().toLowerCase() }),
    });

    if (response.ok) {
      return { ok: true };
    }
    if (response.status === 401) {
      return { ok: false, errorKey: 'backup.invalidAdminPassword' };
    }
    return { ok: false, errorKey: 'backup.serverFetchFailed' };
  } catch {
    return { ok: false, errorKey: 'backup.serverFetchFailed' };
  }
}
