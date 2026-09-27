import React from 'react';
import { IdCard, RotateCw } from 'lucide-react';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { CardSide } from '../../lib/studentCardTemplateTypes';

export interface StudentCardSideSwitcherProps {
  activeSide: CardSide;
  onSelectSide: (side: CardSide) => void;
  t: TranslationFunction;
}

export function StudentCardSideSwitcher({
  activeSide,
  onSelectSide,
  t,
}: StudentCardSideSwitcherProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/80 rounded-lg border border-border/80 shadow-2xs">
      <button
        type="button"
        onClick={() => onSelectSide('front')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          activeSide === 'front'
            ? 'bg-background text-foreground shadow-2xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <IdCard className="w-3.5 h-3.5" />
        <span>{t('students.cardTemplate.side.front') || 'Front Side'}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectSide('back')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          activeSide === 'back'
            ? 'bg-background text-foreground shadow-2xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span>{t('students.cardTemplate.side.back') || 'Back Side'}</span>
      </button>
    </div>
  );
}
