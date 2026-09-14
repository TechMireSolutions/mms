import React from 'react';
import { Layers, ChevronDown, ArrowUpToLine, ChevronUp, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export interface TemplateEditorLayersSectionProps {
  elementId: string;
  isOpen: boolean;
  onToggle: () => void;
  onBringToFront: (elementId: string) => void;
  onMoveForward?: (elementId: string) => void;
  onMoveBackward?: (elementId: string) => void;
  onSendToBack?: (elementId: string) => void;
  t: TranslationFunction;
}

export function TemplateEditorLayersSection({
  elementId,
  isOpen,
  onToggle,
  onBringToFront,
  onMoveForward,
  onMoveBackward,
  onSendToBack,
  t,
}: TemplateEditorLayersSectionProps): React.JSX.Element {
  return (
    <div className="pt-2 border-t border-border space-y-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="section-layers"
        className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase text-muted-foreground tracking-widest hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
          <span>{t('templateEditor.layerStacking')}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90 text-muted-foreground/50'
          }`}
        />
      </button>
      {isOpen && (
        <div id="section-layers" className="grid grid-cols-4 gap-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onBringToFront(elementId)}
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
            title={t('templateEditor.bringToFront')}
            aria-label={t('templateEditor.bringToFront')}
          >
            <ArrowUpToLine className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onMoveForward?.(elementId)}
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
            title={t('templateEditor.moveForward')}
            aria-label={t('templateEditor.moveForward')}
          >
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onMoveBackward?.(elementId)}
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
            title={t('templateEditor.moveBackward')}
            aria-label={t('templateEditor.moveBackward')}
          >
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSendToBack?.(elementId)}
            className="min-h-11 p-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted"
            title={t('templateEditor.sendToBack')}
            aria-label={t('templateEditor.sendToBack')}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
