import React from 'react';
import { Sparkles, School, BookOpen, GraduationCap } from 'lucide-react';
import { SYSTEM_MODULES } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export interface PlatformModulePresetsBarProps {
  onApplyPreset: (moduleIds: string[]) => void;
  disabled?: boolean;
}

export function PlatformModulePresetsBar({
  onApplyPreset,
  disabled = false,
}: PlatformModulePresetsBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-muted/40 border border-border/50 text-start">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
        <span>{t('onboarding.presetsLabel')}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onApplyPreset(SYSTEM_MODULES.map((m) => m.id))}
          className="min-h-11 h-11 px-3 text-xs font-bold rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary gap-1.5 shadow-2xs cursor-pointer"
        >
          <School className="w-3.5 h-3.5 text-primary" aria-hidden />
          {t('onboarding.presetFull')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            onApplyPreset(['dashboard', 'contacts', 'messaging', 'students', 'teachers', 'attendance', 'hasanat', 'users'])
          }
          className="min-h-11 h-11 px-3 text-xs font-bold rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary gap-1.5 shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden />
          {t('onboarding.presetHifz')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            onApplyPreset(['dashboard', 'contacts', 'messaging', 'students', 'attendance', 'finance', 'users'])
          }
          className="min-h-11 h-11 px-3 text-xs font-bold rounded-xl border-border/70 hover:bg-primary/10 hover:text-primary gap-1.5 shadow-2xs cursor-pointer"
        >
          <GraduationCap className="w-3.5 h-3.5 text-primary" aria-hidden />
          {t('onboarding.presetWeekend')}
        </Button>
      </div>
    </div>
  );
}
