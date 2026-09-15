import React from 'react';
import { Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TemplateElement } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { StyleInput } from './TemplateEditorStyleControls';
import { TemplateEditorSection } from './TemplateEditorSection';

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
    <TemplateEditorSection
      titleKey="templateEditor.positionSize"
      icon={Move}
      isOpen={isOpen}
      onToggle={onToggle}
      t={t}
      panelClassName="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <StyleInput
          label={t('templateEditor.positionX')}
          type="number"
          value={selectedElement.x}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { x: Math.max(0, num) });
          }}
        />
        <StyleInput
          label={t('templateEditor.positionY')}
          type="number"
          value={selectedElement.y}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { y: Math.max(0, num) });
          }}
        />
        <StyleInput
          label={t('templateEditor.width')}
          type="number"
          value={selectedElement.w}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { w: Math.max(20, num) });
          }}
        />
        <StyleInput
          label={t('templateEditor.height')}
          type="number"
          value={selectedElement.h}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) onPatchElement(selectedElement.id, { h: Math.max(4, num) });
          }}
        />
      </div>

      {onCenterSelected && (
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0">
            {t('templateEditor.centerOnPage')}
          </p>
          <div role="group" aria-label={t('templateEditor.centerOnPage')} className="grid grid-cols-2 gap-1.5">
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
    </TemplateEditorSection>
  );
}
