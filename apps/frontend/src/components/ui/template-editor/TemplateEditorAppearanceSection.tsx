import React from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElementStyle } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import { StyleInput } from './TemplateEditorStyleControls';
import { normalizeHexColor } from './templateEditorUtils';

export interface TemplateEditorAppearanceSectionProps {
  elementId: string;
  elStyle: ElementStyle;
  isOpen: boolean;
  onToggle: () => void;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  t: TranslationFunction;
}

export function TemplateEditorAppearanceSection({
  elementId,
  elStyle,
  isOpen,
  onToggle,
  onPatchStyle,
  t,
}: TemplateEditorAppearanceSectionProps): React.JSX.Element {
  return (
    <div className="pt-2 border-t border-border space-y-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="section-appearance"
        className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
          <span>{t('templateEditor.appearance')}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90 text-muted-foreground/50'
          }`}
        />
      </button>

      {isOpen && (
        <div id="section-appearance" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label
                htmlFor={`bg-color-${elementId}`}
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                {t('templateEditor.backgroundColor')}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`bg-color-${elementId}`}
                  name={`bg-color-${elementId}`}
                  aria-label={t('templateEditor.backgroundColor')}
                  type="color"
                  value={normalizeHexColor(elStyle.backgroundColor, '#ffffff')}
                  onChange={(e) => onPatchStyle(elementId, { backgroundColor: e.target.value })}
                  className="w-9 h-9 p-0.5 border border-border rounded-md bg-background cursor-pointer touch-manipulation min-h-9 min-w-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onPatchStyle(elementId, { backgroundColor: undefined })}
                  className="min-h-11 text-3xs px-2"
                  title={t('templateEditor.transparent')}
                  aria-label={t('templateEditor.transparent')}
                >
                  {t('templateEditor.transparent')}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label
                htmlFor={`border-color-${elementId}`}
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                {t('templateEditor.borderColor')}
              </label>
              <input
                id={`border-color-${elementId}`}
                name={`border-color-${elementId}`}
                aria-label={t('templateEditor.borderColor')}
                type="color"
                value={normalizeHexColor(elStyle.borderColor, '#cbd5e1')}
                onChange={(e) => onPatchStyle(elementId, { borderColor: e.target.value })}
                className="w-full min-h-11 h-11 p-1 border border-border rounded-lg bg-background cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StyleInput
              label={t('templateEditor.borderWidth')}
              type="number"
              min={0}
              max={12}
              value={elStyle.borderWidth ?? 0}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) {
                  onPatchStyle(elementId, { borderWidth: Math.max(0, Math.min(12, num)) });
                }
              }}
            />
            <StyleInput
              label={t('templateEditor.borderRadius')}
              type="number"
              min={0}
              max={32}
              value={elStyle.borderRadius ?? 0}
              onChange={(val) => {
                const num = Number(val);
                if (!Number.isNaN(num)) {
                  onPatchStyle(elementId, { borderRadius: Math.max(0, Math.min(32, num)) });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
