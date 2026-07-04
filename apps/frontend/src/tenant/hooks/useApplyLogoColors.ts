import { useCallback, useState, useEffect, useRef } from 'react';
import { extractLogoBrandColors } from '@/lib/extractLogoBrandColors';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';

interface UseApplyLogoColorsOptions {
  logoUrl: string;
  onPrimaryChange: (hex: string) => void;
  onSecondaryChange: (hex: string) => void;
}

export function useApplyLogoColors({
  logoUrl,
  onPrimaryChange,
  onSecondaryChange,
}: UseApplyLogoColorsOptions): {
  applying: boolean;
  apply: () => Promise<void>;
} {
  const { t } = useTranslation();
  const [applying, setApplying] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const apply = useCallback(async (): Promise<void> => {
    if (applying) return;
    if (!logoUrl.trim()) {
      notify.error(t('theme.logoColorsMissing'), { description: t('theme.logoColorsMissingDesc') });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setApplying(true);
    try {
      const colors = await extractLogoBrandColors(logoUrl, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (!colors) {
        notify.error(t('theme.logoColorsFailed'), { description: t('theme.logoColorsFailedDesc') });
        return;
      }
      onPrimaryChange(colors.primaryColor);
      onSecondaryChange(colors.secondaryColor);
      notify.success(t('theme.logoColorsApplied'), { description: t('theme.logoColorsAppliedDesc') });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      notify.error(t('theme.logoColorsFailed'));
    } finally {
      if (controllerRef.current === controller) {
        setApplying(false);
        controllerRef.current = null;
      }
    }
  }, [logoUrl, onPrimaryChange, onSecondaryChange, t, applying]);

  return { applying, apply };
}
