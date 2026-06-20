import { useCallback, useState } from 'react';
import { extractLogoBrandColors } from '@/lib/extractLogoBrandColors';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';

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

  const apply = useCallback(async (): Promise<void> => {
    if (!logoUrl.trim()) {
      notify.error(t('theme.logoColorsMissing'), { description: t('theme.logoColorsMissingDesc') });
      return;
    }
    setApplying(true);
    try {
      const colors = await extractLogoBrandColors(logoUrl);
      if (!colors) {
        notify.error(t('theme.logoColorsFailed'), { description: t('theme.logoColorsFailedDesc') });
        return;
      }
      onPrimaryChange(colors.primaryColor);
      onSecondaryChange(colors.secondaryColor);
      notify.success(t('theme.logoColorsApplied'), { description: t('theme.logoColorsAppliedDesc') });
    } finally {
      setApplying(false);
    }
  }, [logoUrl, onPrimaryChange, onSecondaryChange, t]);

  return { applying, apply };
}
