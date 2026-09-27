import React, { type JSX } from 'react';
import { RotateCw, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export type StudentCardPrintMode = 'front' | 'back' | 'both';

export interface StudentIdCardPrintControlsBarProps {
  printMode: StudentCardPrintMode;
  onSelectPrintMode: (mode: StudentCardPrintMode) => void;
  onToggleGlobalFlipped: () => void;
  showCutGuides: boolean;
  onToggleShowCutGuides: () => void;
  t: TranslationFunction;
}

export function StudentIdCardPrintControlsBar({
  printMode,
  onSelectPrintMode,
  onToggleGlobalFlipped,
  showCutGuides,
  onToggleShowCutGuides,
  t,
}: StudentIdCardPrintControlsBarProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border text-xs print:hidden">
      {/* Side Mode Selector */}
      <div className="flex items-center gap-1 p-0.5 bg-muted/80 rounded-lg border border-border/80">
        <button
          type="button"
          onClick={() => onSelectPrintMode('front')}
          className={`px-3 py-1.5 font-medium rounded-md transition-all ${
            printMode === 'front'
              ? 'bg-background text-foreground shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('students.idCard.printFrontOnly')}
        </button>
        <button
          type="button"
          onClick={() => onSelectPrintMode('back')}
          className={`px-3 py-1.5 font-medium rounded-md transition-all ${
            printMode === 'back'
              ? 'bg-background text-foreground shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('students.idCard.printBackOnly')}
        </button>
        <button
          type="button"
          onClick={() => onSelectPrintMode('both')}
          className={`px-3 py-1.5 font-medium rounded-md transition-all ${
            printMode === 'both'
              ? 'bg-background text-foreground shadow-2xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('students.idCard.printBothSides')}
        </button>
      </div>

      {/* Quick Actions: Flip & Cut Guides */}
      <div className="flex items-center gap-1.5">
        {printMode !== 'both' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleGlobalFlipped}
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{t('students.idCard.flipAll')}</span>
          </Button>
        )}

        <Button
          type="button"
          variant={showCutGuides ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleShowCutGuides}
          className="flex items-center gap-1.5 h-8 px-2.5 text-xs"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>{t('students.idCard.cutGuides')}</span>
        </Button>
      </div>
    </div>
  );
}
