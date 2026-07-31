import { useMutation } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';

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
