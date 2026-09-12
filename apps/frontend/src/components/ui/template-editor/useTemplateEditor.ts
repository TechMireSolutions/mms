/**
 * @file useTemplateEditor.ts
 * @description Headless hook managing template state, undo/redo stacks, element lifecycle, and shortcut commands.
 */

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getPageDimensions,
  type DocumentTemplate,
  type DocumentTemplatePreset,
  type ElementStyle,
  type TemplateElement,
  type TemplateFieldDefinition,
  type TemplateOrientation,
} from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import { alignElements, newId, type AlignmentType } from "./templateEditorUtils";
import { useTemplateEditorInteractions, type DragStateInfo, type ResizeStateInfo } from "./useTemplateEditorInteractions";

export interface UseTemplateEditorOptions<TPayload = Record<string, unknown>> {
  initialTemplate?: DocumentTemplate<TPayload>;
  defaultTemplate?: DocumentTemplate<TPayload>;
  availableFields?: TemplateFieldDefinition<TPayload>[];
  presets?: DocumentTemplatePreset<TPayload>[];
  onSave?: (template: DocumentTemplate<TPayload>) => void | Promise<void>;
}

const FALLBACK_TEMPLATE: DocumentTemplate = {
  pageSize: "A5",
  orientation: "portrait",
  elements: [],
};

export function useTemplateEditor<TPayload = Record<string, unknown>>({
  initialTemplate,
  defaultTemplate = FALLBACK_TEMPLATE as DocumentTemplate<TPayload>,
  availableFields = [],
  presets = [],
  onSave,
}: UseTemplateEditorOptions<TPayload> = {}) {
  const { t } = useTranslation();
  const [template, setTemplate] = useState<DocumentTemplate<TPayload>>(() => initialTemplate || defaultTemplate);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuides, setShowGuides] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<DocumentTemplate<TPayload>[]>([]);
  const [future, setFuture] = useState<DocumentTemplate<TPayload>[]>([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasViewportRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragStateInfo<TPayload> | null>(null);
  const resizeState = useRef<ResizeStateInfo<TPayload> | null>(null);

  const orientation = template.orientation || "portrait";
  const size = getPageDimensions(template.pageSize, orientation);
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedElements = template.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElement = template.elements.find((el) => el.id === selectedId);

  const setSelectedId = (id: string | null) => setSelectedIds(id ? [id] : []);
  const deselectAll = () => setSelectedIds([]);
  const selectAll = () => setSelectedIds(template.elements.map((el) => el.id));

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const updateCanvasScale = () => {
      const availableWidth = Math.max(0, viewport.clientWidth - 32);
      if (availableWidth > 0) setCanvasScale(Math.min(1, availableWidth / size.width));
    };
    const observer = new ResizeObserver(updateCanvasScale);
    observer.observe(viewport);
    updateCanvasScale();
    return () => observer.disconnect();
  }, [size.width]);

  const pushHistory = (currentTemplate: DocumentTemplate<TPayload>) => {
    setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
    setFuture([]);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((futureStack) => [template, ...futureStack]);
    setHistory((historyStack) => historyStack.slice(0, -1));
    setTemplate(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const nextTemplate = future[0];
    setHistory((historyStack) => [...historyStack, template]);
    setFuture((futureStack) => futureStack.slice(1));
    setTemplate(nextTemplate);
  };

  const updateElements = (updateFn: (elements: TemplateElement<keyof TPayload & string>[]) => TemplateElement<keyof TPayload & string>[]) => {
    setTemplate((currentTemplate) => ({ ...currentTemplate, elements: updateFn(currentTemplate.elements) }));
  };

  const commitUpdate = (updateFn: (elements: TemplateElement<keyof TPayload & string>[]) => TemplateElement<keyof TPayload & string>[]) => {
    setTemplate((currentTemplate) => {
      const nextTemplate = { ...currentTemplate, elements: updateFn(currentTemplate.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
      setFuture([]);
      return nextTemplate;
    });
  };

  useTemplateEditorInteractions({
    canvasScale,
    dragState,
    resizeState,
    updateElements,
    setTemplate,
    setHistory,
    setFuture,
  });

  const patchElement = (elementId: string, patch: Partial<TemplateElement<keyof TPayload & string>>) => {
    commitUpdate((elements) => elements.map((el) => (el.id === elementId ? { ...el, ...patch } : el)));
  };

  const patchStyle = (elementId: string, stylePatch: Partial<ElementStyle>) => {
    commitUpdate((elements) =>
      elements.map((el) => (el.id === elementId ? { ...el, style: { ...el.style, ...stylePatch } } : el))
    );
  };

  const deleteElement = (elementId: string) => {
    commitUpdate((elements) => elements.filter((el) => el.id !== elementId));
    setSelectedIds((prev) => prev.filter((id) => id !== elementId));
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((elements) => elements.filter((el) => !idSet.has(el.id)));
    setSelectedIds([]);
  };

  const duplicateElement = (elementId: string) => {
    const el = template.elements.find((e) => e.id === elementId);
    if (!el) return;
    const duplicated: TemplateElement<keyof TPayload & string> = {
      ...el,
      id: newId(),
      x: el.x + 12,
      y: el.y + 12,
      style: { ...el.style },
    };
    commitUpdate((elements) => [...elements, duplicated]);
    setSelectedIds([duplicated.id]);
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const targets = template.elements.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;
    const newElements = targets.map((el) => ({ ...el, id: newId(), x: el.x + 12, y: el.y + 12, style: { ...el.style } }));
    commitUpdate((elements) => [...elements, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
  };

  const alignSelected = (alignType: AlignmentType) => {
    commitUpdate((elements) => alignElements(elements, selectedIds, alignType));
  };

  const addStaticText = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "static",
      label: t("templateEditor.newText"),
      x: 20,
      y: 20,
      w: 200,
      h: 18,
      style: { fontSize: 11, color: PRINT_NEUTRAL.text },
    };
    commitUpdate((elements) => [...elements, el]);
    setSelectedIds([el.id]);
  };

  const addDivider = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "divider",
      label: "",
      x: 20,
      y: 20,
      w: size.width - 40,
      h: 1,
      style: { color: PRINT_NEUTRAL.border },
    };
    commitUpdate((elements) => [...elements, el]);
    setSelectedIds([el.id]);
  };

  const addField = (fieldDef: TemplateFieldDefinition<TPayload>) => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "field",
      label: fieldDef.label,
      field: fieldDef.field,
      x: 20,
      y: 20,
      w: 160,
      h: 16,
      style: { fontSize: 10, color: PRINT_NEUTRAL.text },
    };
    commitUpdate((elements) => [...elements, el]);
    setSelectedIds([el.id]);
  };

  const addQrCode = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "qrcode",
      label: t("templateEditor.qrCode"),
      x: 20,
      y: 20,
      w: 64,
      h: 64,
    };
    commitUpdate((elements) => [...elements, el]);
    setSelectedIds([el.id]);
  };

  const applyPreset = (presetKey: string) => {
    const match = presets.find((p) => p.key === presetKey);
    if (!match) return;
    pushHistory(template);
    setTemplate(match.template);
    setSelectedIds([]);
  };

  const onMouseDownElement = (event: ReactMouseEvent, elementId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;

    const isMulti = event.shiftKey || event.metaKey || event.ctrlKey;
    let activeIds = selectedIds;
    if (isMulti) {
      activeIds = selectedIds.includes(elementId) ? selectedIds.filter((id) => id !== elementId) : [...selectedIds, elementId];
      setSelectedIds(activeIds);
    } else if (!selectedIds.includes(elementId)) {
      activeIds = [elementId];
      setSelectedIds(activeIds);
    }

    const itemsToDrag = template.elements.filter((el) => activeIds.includes(el.id)).map((el) => ({ id: el.id, origX: el.x, origY: el.y }));
    dragState.current = {
      items: itemsToDrag.length > 0 ? itemsToDrag : [{ id: elementId, origX: 0, origY: 0 }],
      startX: event.clientX,
      startY: event.clientY,
      initialTemplate: template,
      hasMoved: false,
    };
  };

  const onMouseDownResize = (event: ReactMouseEvent, elementId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const el = template.elements.find((e) => e.id === elementId);
    if (!el) return;
    resizeState.current = {
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      origW: el.w,
      origH: el.h,
      initialTemplate: template,
      hasMoved: false,
    };
  };

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave(template);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePageSize = (pageSizeKey: string) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, pageSize: pageSizeKey }));
  };

  const handleOrientationChange = (nextOrientation: TemplateOrientation) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, orientation: nextOrientation }));
  };

  const resetToDefault = () => {
    pushHistory(template);
    setTemplate(defaultTemplate);
    setSelectedIds([]);
  };

  return {
    t,
    template,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    selectAll,
    deselectAll,
    selectedElement,
    selectedElements,
    showGuides,
    setShowGuides,
    saved,
    saving,
    history,
    future,
    canvasScale,
    canvasViewportRef,
    canvasRef,
    size,
    orientation,
    undo,
    redo,
    patchElement,
    patchStyle,
    deleteElement,
    deleteSelected,
    duplicateElement,
    duplicateSelected,
    alignSelected,
    addStaticText,
    addDivider,
    addField,
    addQrCode,
    applyPreset,
    onMouseDownElement,
    onMouseDownResize,
    handleSave,
    handlePageSize,
    handleOrientationChange,
    resetToDefault,
    availableFields,
    presets,
  };
}
