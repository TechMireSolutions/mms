import { useMutation } from '@tanstack/react-query';
import type { MigrateAndRestartAccepted } from '@mms/shared';
import { apiFetch, apiJson } from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

/** Default delay before migrate starts when the response omits delayMs. */
const DEFAULT_MIGRATE_RESTART_DELAY_MS = 1_500;

/** How long to wait for `/ready` after migrate+reload before forcing a soft reload. */
const READY_POLL_TIMEOUT_MS = 60_000;

/** Interval between `/ready` probes while waiting for the backend. */
const READY_POLL_INTERVAL_MS = 750;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Wait for the backend delay window, then poll `/ready` until OK (or timeout).
 * Preserves the platform session — callers should soft-reload, not log out.
 */
export async function waitForBackendReadyAfterMigrate(delayMs: number): Promise<void> {
  const waitMs = Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : DEFAULT_MIGRATE_RESTART_DELAY_MS;
  await sleep(waitMs);

  const deadline = Date.now() + READY_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await apiFetch('/ready');
      if (response.ok) return;
    } catch {
      // Backend still restarting — keep polling.
    }
    await sleep(READY_POLL_INTERVAL_MS);
  }
}

/** Hook for platform super-users to reset and re-seed the entire database. */
export function useResetPlatformDatabase() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (input: { confirm: string; password: string }) =>
      apiJson<{ success: boolean; message: string }>('/api/platform/settings/reset-database', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      notify.success(t('platform.profileDestroyDatabaseSuccess'));
    },
  });
}

/** Hook for platform super-users to apply Drizzle migrations and reload the backend. */
export function useMigrateAndRestartPlatform() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (input: { confirm: string; password: string }) =>
      apiJson<MigrateAndRestartAccepted>('/api/platform/admin/system/migrate-and-restart', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      notify.success(t('platform.profileMigrateRestartSuccess'));
    },
  });
}
