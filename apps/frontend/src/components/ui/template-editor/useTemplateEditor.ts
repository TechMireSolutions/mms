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
  type TemplateElement,
  type TemplateFieldDefinition,
  type TemplateOrientation,
} from "@mms/shared";
import {
  useTemplateEditorInteractions,
  type DragStateInfo,
  type ResizeStateInfo,
} from "./useTemplateEditorInteractions";
import { useTemplateEditorShortcuts } from "./useTemplateEditorShortcuts";
import { useTemplateEditorElementActions } from "./useTemplateEditorElementActions";
import { downloadTemplateJson, readTemplateJsonFile } from "./templateEditorUtils";

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
  const [autoScale, setAutoScale] = useState(1);
  const [customZoom, setCustomZoom] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const canvasViewportRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragStateInfo<TPayload> | null>(null);
  const resizeState = useRef<ResizeStateInfo<TPayload> | null>(null);

  const canvasScale = customZoom ?? autoScale;
  const orientation = template.orientation || "portrait";
  const size = getPageDimensions(template.pageSize, orientation);
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedElements = template.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElement = template.elements.find((el) => el.id === selectedId);

  const setSelectedId = (id: string | null) => setSelectedIds(id ? [id] : []);
  const deselectAll = () => setSelectedIds([]);
  const selectAll = () => setSelectedIds(template.elements.map((el) => el.id));

  const zoomIn = () => setCustomZoom((prev) => Math.min(2.5, Number(((prev ?? canvasScale) + 0.1).toFixed(2))));
  const zoomOut = () => setCustomZoom((prev) => Math.max(0.3, Number(((prev ?? canvasScale) - 0.1).toFixed(2))));
  const zoomReset = () => setCustomZoom(1);
  const zoomFit = () => setCustomZoom(null);

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const updateCanvasScale = () => {
      const availableWidth = Math.max(0, viewport.clientWidth - 32);
      if (availableWidth > 0) setAutoScale(Math.min(1, availableWidth / size.width));
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
    const prev = history[history.length - 1]!;
    setFuture((futureStack) => [template, ...futureStack]);
    setHistory((historyStack) => historyStack.slice(0, -1));
    setTemplate(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const nextTemplate = future[0]!;
    setHistory((historyStack) => [...historyStack, template]);
    setFuture((futureStack) => futureStack.slice(1));
    setTemplate(nextTemplate);
  };

  type ElementUpdater = (
    elements: TemplateElement<keyof TPayload & string>[]
  ) => TemplateElement<keyof TPayload & string>[];

  const updateElements = (updateFn: ElementUpdater) => {
    setTemplate((curr) => ({ ...curr, elements: updateFn(curr.elements) }));
  };

  const commitUpdate = (updateFn: ElementUpdater) => {
    setTemplate((curr) => {
      const nextTemplate = { ...curr, elements: updateFn(curr.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), curr]);
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

  const elementActions = useTemplateEditorElementActions<TPayload>({
    elements: template.elements,
    selectedIds,
    setSelectedIds,
    commitUpdate,
    size,
    t,
  });

  useTemplateEditorShortcuts({
    undo,
    redo,
    selectAll,
    deselectAll,
    duplicateSelected: elementActions.duplicateSelected,
    deleteSelected: elementActions.deleteSelected,
    nudgeSelected: elementActions.nudgeSelected,
    hasSelection: selectedIds.length > 0,
  });

  const exportTemplateJson = () => downloadTemplateJson(template);

  const importTemplateJson = (file: File) => {
    readTemplateJsonFile<TPayload>(file, (parsed) => {
      commitUpdate(() => parsed.elements);
      if (parsed.orientation) {
        handleOrientationChange(parsed.orientation);
      }
      if (parsed.pageSize) {
        handlePageSize(parsed.pageSize);
      }
    });
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
      activeIds = selectedIds.includes(elementId)
        ? selectedIds.filter((id) => id !== elementId)
        : [...selectedIds, elementId];
      setSelectedIds(activeIds);
    } else if (!selectedIds.includes(elementId)) {
      activeIds = [elementId];
      setSelectedIds(activeIds);
    }

    const itemsToDrag = template.elements
      .filter((el) => activeIds.includes(el.id))
      .map((el) => ({ id: el.id, origX: el.x, origY: el.y }));
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
    isPreviewMode,
    setIsPreviewMode,
    saved,
    saving,
    history,
    future,
    canvasScale,
    zoomIn,
    zoomOut,
    zoomReset,
    zoomFit,
    canvasViewportRef,
    canvasRef,
    size,
    orientation,
    undo,
    redo,
    exportTemplateJson,
    importTemplateJson,
    applyPreset,
    onMouseDownElement,
    onMouseDownResize,
    handleSave,
    handlePageSize,
    handleOrientationChange,
    resetToDefault,
    availableFields,
    presets,
    ...elementActions,
  };
}
