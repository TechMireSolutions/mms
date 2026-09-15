/**
 * @file TemplateEditorPropertiesPanel.tsx
 * @description Inspector sidebar panel for configuring element properties, styles, position, alignment, and layers.
 */

import React, { useState } from 'react';
import { Copy, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElementStyle, TemplateElement, TemplateFieldDefinition } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AlignmentType } from './templateEditorUtils';
import { TemplateEditorMultiSelectPanel } from './TemplateEditorMultiSelectPanel';
import { TemplateEditorTypographySection } from './TemplateEditorTypographySection';
import { TemplateEditorPositionSection } from './TemplateEditorPositionSection';
import { TemplateEditorLayersSection } from './TemplateEditorLayersSection';
import { TemplateEditorAppearanceSection } from './TemplateEditorAppearanceSection';
import { TemplateEditorTableSection } from './TemplateEditorTableSection';
import { TemplateEditorLayerList } from './TemplateEditorLayerList';
import { TemplateEditorElementIdentitySection } from './TemplateEditorElementIdentitySection';
import { TemplateEditorSection } from './TemplateEditorSection';

export interface TemplateEditorPropertiesPanelProps<TPayload = Record<string, unknown>> {
  selectedElement: TemplateElement<keyof TPayload & string> | undefined;
  selectedElements?: TemplateElement<keyof TPayload & string>[];
  /** Every element on the page, for the layer list. */
  elements?: TemplateElement<keyof TPayload & string>[];
  /** Selectable data fields, so an existing field element can be re-bound. */
  availableFields?: TemplateFieldDefinition<TPayload>[];
  onSelectElement?: (elementId: string) => void;
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
  /** Whether the application is rendered right-to-left (ar/ur/fa). */
  isRtl?: boolean;
  t: TranslationFunction;
}

export function TemplateEditorPropertiesPanel<TPayload = Record<string, unknown>>({
  selectedElement,
  selectedElements = [],
  elements = [],
  availableFields = [],
  onSelectElement,
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
  isRtl = false,
  t,
}: TemplateEditorPropertiesPanelProps<TPayload>): React.JSX.Element {
  const [openSections, setOpenSections] = useState({
    position: true,
    layers: true,
    appearance: true,
    typography: false,
    table: false,
    layerList: false,
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
        className="max-h-64 w-full shrink-0 space-y-4 overflow-y-auto border-t border-border bg-card p-3 lg:max-h-none lg:w-60 lg:border-t-0 lg:border-s select-none print:hidden"
      >
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary shadow-xs">
            <Layers className="w-6 h-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-foreground m-0">{t('templateEditor.emptyHint')}</p>
          <p className="text-3xs text-muted-foreground mt-1.5 max-w-[190px] leading-relaxed m-0">
            {t('templateEditor.emptyHintDetail')}
          </p>
        </div>

        {/*
         * With nothing selected the layer list is the primary way to pick an element:
         * presets place 1–2px dividers and heavily overlapped elements on the page,
         * which are all but unhittable with a pointer.
         */}
        <section className="space-y-2 pt-2 border-t border-border">
          <h3 className="m-0 text-xs font-bold uppercase text-muted-foreground tracking-widest">
            {t('templateEditor.layerList')}
          </h3>
          <TemplateEditorLayerList
            elements={elements}
            selectedIds={[]}
            onSelectElement={onSelectElement || (() => {})}
            t={t}
          />
        </section>
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

      <TemplateEditorElementIdentitySection
        selectedElement={selectedElement}
        availableFields={availableFields}
        onPatchElement={onPatchElement}
        t={t}
      />

      {onSelectElement && elements.length > 0 && (
        <TemplateEditorSection
          titleKey="templateEditor.layerList"
          icon={Layers}
          isOpen={openSections.layerList}
          onToggle={() => toggleSection('layerList')}
          t={t}
          panelClassName="space-y-1.5"
        >
          <TemplateEditorLayerList
            elements={elements}
            selectedIds={[selectedElement.id]}
            onSelectElement={onSelectElement}
            t={t}
          />
        </TemplateEditorSection>
      )}

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
          isOpen={openSections.typography}
          onToggle={() => toggleSection('typography')}
          onPatchStyle={onPatchStyle}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          isRtl={isRtl}
          t={t}
        />
      )}

      {selectedElement.type === 'table' && (
        <TemplateEditorTableSection
          selectedElement={selectedElement}
          isOpen={openSections.table}
          onToggle={() => toggleSection('table')}
          onPatchElement={onPatchElement}
          t={t}
        />
      )}
    </aside>
  );
}
