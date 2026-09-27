import React from 'react';
import { usePlatformLanguage } from '@/platform/hooks/usePlatformLanguage';
import { LanguagePicker } from '@/components/ui/LanguagePicker';

export interface PlatformLanguagePickerProps {
  compact?: boolean;
}

/**
 * Platform language picker delegating presentation to universal LanguagePicker primitive.
 */
export function PlatformLanguagePicker({ compact = false }: PlatformLanguagePickerProps): React.JSX.Element {
  const { platformLanguage, setPlatformLanguage } = usePlatformLanguage();

  return (
    <LanguagePicker
      currentLanguage={platformLanguage}
      onSelectLanguage={setPlatformLanguage}
      compact={compact}
    />
  );
}
