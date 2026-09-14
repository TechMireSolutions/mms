/**
 * @file TemplateEditorPropertiesPanel.tsx
 * @description Inspector sidebar panel for configuring element properties, styles, position, alignment, and layers.
 */

import React, { useState } from 'react';
import { Copy, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ElementStyle, TemplateElement } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AlignmentType } from './templateEditorUtils';
import { TemplateEditorMultiSelectPanel } from './TemplateEditorMultiSelectPanel';
import { TemplateEditorTypographySection } from './TemplateEditorTypographySection';
import { TemplateEditorPositionSection } from './TemplateEditorPositionSection';
import { TemplateEditorLayersSection } from './TemplateEditorLayersSection';
import { TemplateEditorAppearanceSection } from './TemplateEditorAppearanceSection';
import { TemplateEditorTableSection } from './TemplateEditorTableSection';

export interface TemplateEditorPropertiesPanelProps<TPayload = Record<string, unknown>> {
  selectedElement: TemplateElement<keyof TPayload & string> | undefined;
  selectedElements?: TemplateElement<keyof TPayload & string>[];
  onPatchElement: (
    elementId: string,
    patch: Partial<TemplateElement<keyof TPayload & string>>,
  ) => void;
  onPatchStyle: (elementId: string, stylePatch: Partial<ElementStyle>) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateSelected?: () => void;
  onDeleteSelected?: () => void;
  onAlignSelected?: (alignType: AlignmentType) => void;
  onDistributeSelected?: (axis: 'horizontal' | 'vertical') => void;
  onCenterSelected?: (axis: 'both' | 'h' | 'v') => void;
  onBringToFront?: (elementId?: string) => void;
  onSendToBack?: (elementId?: string) => void;
  onBringSelectedToFront?: () => void;
  onSendSelectedToBack?: () => void;
  onMoveForward?: (elementId?: string) => void;
  onMoveBackward?: (elementId?: string) => void;
  onPatchSelectedStyles?: (stylePatch: Partial<ElementStyle>) => void;
  primaryColor?: string;
  secondaryColor?: string;
  t: TranslationFunction;
}

export function TemplateEditorPropertiesPanel<TPayload = Record<string, unknown>>({
  selectedElement,
  selectedElements = [],
  onPatchElement,
  onPatchStyle,
  onDuplicateElement,
  onDeleteElement,
  onDuplicateSelected,
  onDeleteSelected,
  onAlignSelected,
  onDistributeSelected,
  onCenterSelected,
  onBringToFront,
  onSendToBack,
  onBringSelectedToFront,
  onSendSelectedToBack,
  onMoveForward,
  onMoveBackward,
  onPatchSelectedStyles,
  primaryColor,
  secondaryColor,
  t,
}: TemplateEditorPropertiesPanelProps<TPayload>): React.JSX.Element {
  const [openSections, setOpenSections] = useState({
    position: true,
    layers: true,
    appearance: true,
    typography: true,
    table: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isMultiSelect = selectedElements.length > 1;

  if (isMultiSelect) {
    return (
      <TemplateEditorMultiSelectPanel
        selectedElements={selectedElements}
        onAlignSelected={onAlignSelected}
        onDistributeSelected={onDistributeSelected}
        onCenterSelected={onCenterSelected}
        onBringToFront={
          onBringSelectedToFront || (onBringToFront ? () => onBringToFront() : undefined)
        }
        onSendToBack={onSendSelectedToBack || (onSendToBack ? () => onSendToBack() : undefined)}
        onDuplicateSelected={onDuplicateSelected}
        onDeleteSelected={onDeleteSelected}
        onPatchSelectedStyles={onPatchSelectedStyles}
        t={t}
      />
    );
  }

  if (!selectedElement) {
    return (
      <aside
        aria-label={t('templateEditor.properties')}
        className="max-h-64 w-full shrink-0 flex flex-col items-center justify-center p-6 text-center border-t border-border bg-card lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s select-none print:hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-xs">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-foreground m-0">{t('templateEditor.emptyHint')}</p>
        <p className="text-3xs text-muted-foreground/80 mt-1.5 max-w-[170px] leading-relaxed m-0">
          {t('templateEditor.emptyHintDetail')}
        </p>
      </aside>
    );
  }

  const elStyle = selectedElement.style || {};
  const isTextLike = selectedElement.type === 'static' || selectedElement.type === 'field';

  return (
    <aside
      aria-label={t('templateEditor.properties')}
      className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s print:hidden"
    >
      <div className="pb-2 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {selectedElement.type}
          </span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
            {selectedElement.label || t('templateEditor.element')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="min-h-11 min-w-11 text-muted-foreground hover:text-foreground rounded"
            title={t('templateEditor.duplicate')}
            aria-label={t('templateEditor.duplicate')}
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="min-h-11 min-w-11 text-destructive hover:bg-destructive/10 rounded"
            title={t('templateEditor.delete')}
            aria-label={t('templateEditor.delete')}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`label-input-${selectedElement.id}`}
          className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
        >
          {t('templateEditor.labelText')}
        </label>
        <Input
          id={`label-input-${selectedElement.id}`}
          name={`label-input-${selectedElement.id}`}
          type="text"
          dir="auto"
          value={selectedElement.label}
          onChange={(e) => onPatchElement(selectedElement.id, { label: e.target.value })}
          className="w-full min-h-11 px-2 py-1.5 text-xs border border-border rounded bg-background"
        />
      </div>

      <TemplateEditorPositionSection
        selectedElement={selectedElement}
        isOpen={openSections.position}
        onToggle={() => toggleSection('position')}
        onPatchElement={onPatchElement}
        onCenterSelected={onCenterSelected}
        t={t}
      />

      {onBringToFront && (
        <TemplateEditorLayersSection
          elementId={selectedElement.id}
          isOpen={openSections.layers}
          onToggle={() => toggleSection('layers')}
          onBringToFront={onBringToFront}
          onMoveForward={onMoveForward}
          onMoveBackward={onMoveBackward}
          onSendToBack={onSendToBack}
          t={t}
        />
      )}

      <TemplateEditorAppearanceSection
        elementId={selectedElement.id}
        elStyle={elStyle}
        isOpen={openSections.appearance}
        onToggle={() => toggleSection('appearance')}
        onPatchStyle={onPatchStyle}
        t={t}
      />

      {isTextLike && (
        <TemplateEditorTypographySection
          elementId={selectedElement.id}
          elStyle={elStyle}
          onPatchStyle={onPatchStyle}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          t={t}
        />
      )}

      {selectedElement.type === 'table' && (
        <TemplateEditorTableSection
          selectedElement={selectedElement}
          onPatchElement={onPatchElement}
          t={t}
        />
      )}
    </aside>
  );
}
