import React from 'react';
import { Move, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TemplateElement } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { StyleInput } from './TemplateEditorStyleControls';

export interface TemplateEditorPositionSectionProps<TFieldKey extends string = string> {
  selectedElement: TemplateElement<TFieldKey>;
  isOpen: boolean;
  onToggle: () => void;
  onPatchElement: (elementId: string, patch: Partial<TemplateElement<TFieldKey>>) => void;
  onCenterSelected?: (axis: 'both' | 'h' | 'v') => void;
  t: TranslationFunction;
}

export function TemplateEditorPositionSection<TFieldKey extends string = string>({
  selectedElement,
  isOpen,
  onToggle,
  onPatchElement,
  onCenterSelected,
  t,
}: TemplateEditorPositionSectionProps<TFieldKey>): React.JSX.Element {
  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="section-position"
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
            <span>{t('templateEditor.positionSize')}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? '' : '-rotate-90 text-muted-foreground/50'
            }`}
          />
        </button>
        {isOpen && (
          <div id="section-position" className="grid grid-cols-2 gap-2">
            <StyleInput
              label="X"
              type="number"
              value={selectedElement.x}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { x: Math.max(0, num) });
              }}
            />
            <StyleInput
              label="Y"
              type="number"
              value={selectedElement.y}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { y: Math.max(0, num) });
              }}
            />
            <StyleInput
              label="W"
              type="number"
              value={selectedElement.w}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { w: Math.max(20, num) });
              }}
            />
            <StyleInput
              label="H"
              type="number"
              value={selectedElement.h}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { h: Math.max(4, num) });
              }}
            />
          </div>
        )}
      </div>

      {onCenterSelected && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1.5 m-0">
            {t('templateEditor.centerOnPage')}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected('h')}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t('templateEditor.centerHorizontally')}
              aria-label={t('templateEditor.centerHorizontally')}
            >
              <span>{t('templateEditor.centerHorizontally')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCenterSelected('v')}
              className="min-h-11 text-xs rounded-lg border-border hover:bg-muted flex items-center justify-center gap-1.5"
              title={t('templateEditor.centerVertically')}
              aria-label={t('templateEditor.centerVertically')}
            >
              <span>{t('templateEditor.centerVertically')}</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
