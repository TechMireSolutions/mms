import { useCallback } from 'react';
import { PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES } from '@mms/shared';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { useIdleTimer } from '@/hooks/useIdleTimer';

interface PlatformSessionTimeoutOptions {
  enabled: boolean;
  onTimeout: () => void;
  minutes?: number;
}

/**
 * Signs out platform super-users after idle minutes on the apex domain.
 */
export function usePlatformSessionTimeout({
  enabled,
  onTimeout,
  minutes = PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES,
}: PlatformSessionTimeoutOptions): void {
  const { t } = useTranslation();

  const handleTimeout = useCallback((): void => {
    notify.info(t('platform.sessionEndedTitle'), {
      description: t('platform.sessionEndedDesc'),
    });
    onTimeout();
  }, [onTimeout, t]);

  useIdleTimer({
    enabled,
    timeoutMinutes: minutes,
    onTimeout: handleTimeout,
  });
}

export default usePlatformSessionTimeout;

