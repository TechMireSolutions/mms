/**
 * @file useTemplateEditor.ts
 * @description Headless hook managing template state, undo/redo stacks, element lifecycle, and shortcut commands.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
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
  // Timer ref for the "saved" flash — cleared on unmount to prevent state update on unmounted component
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canvasScale = customZoom ?? autoScale;
  const orientation = template.orientation || "portrait";

  // Memoize derived values to avoid recomputation on every render
  const size = useMemo(() => getPageDimensions(template.pageSize, orientation), [template.pageSize, orientation]);
  const selectedId = useMemo(
    () => (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null),
    [selectedIds]
  );
  const selectedElements = useMemo(
    () => template.elements.filter((el) => selectedIds.includes(el.id)),
    [template.elements, selectedIds]
  );
  const selectedElement = useMemo(
    () => template.elements.find((el) => el.id === selectedId),
    [template.elements, selectedId]
  );

  const setSelectedId = useCallback((id: string | null) => setSelectedIds(id ? [id] : []), []);
  const deselectAll = useCallback(() => setSelectedIds([]), []);
  const selectAll = useCallback(() => setSelectedIds(template.elements.map((el) => el.id)), [template.elements]);

  const zoomIn = useCallback(
    () => setCustomZoom((prev) => Math.min(2.5, Number(((prev ?? canvasScale) + 0.1).toFixed(2)))),
    [canvasScale]
  );
  const zoomOut = useCallback(
    () => setCustomZoom((prev) => Math.max(0.3, Number(((prev ?? canvasScale) - 0.1).toFixed(2)))),
    [canvasScale]
  );
  const zoomReset = useCallback(() => setCustomZoom(1), []);
  const zoomFit = useCallback(() => setCustomZoom(null), []);

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

  // Cleanup the saved-flash timer on unmount to prevent state update on unmounted component
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const pushHistory = useCallback((currentTemplate: DocumentTemplate<TPayload>) => {
    setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((historyStack) => {
      if (!historyStack.length) return historyStack;
      const prev = historyStack[historyStack.length - 1]!;
      setFuture((futureStack) => [template, ...futureStack]);
      setTemplate(prev);
      return historyStack.slice(0, -1);
    });
  }, [template]);

  const redo = useCallback(() => {
    setFuture((futureStack) => {
      if (!futureStack.length) return futureStack;
      const nextTemplate = futureStack[0]!;
      setHistory((historyStack) => [...historyStack, template]);
      setTemplate(nextTemplate);
      return futureStack.slice(1);
    });
  }, [template]);

  type ElementUpdater = (
    elements: TemplateElement<keyof TPayload & string>[]
  ) => TemplateElement<keyof TPayload & string>[];

  const updateElements = useCallback((updateFn: ElementUpdater) => {
    setTemplate((curr) => ({ ...curr, elements: updateFn(curr.elements) }));
  }, []);

  const commitUpdate = useCallback((updateFn: ElementUpdater) => {
    setTemplate((curr) => {
      const nextTemplate = { ...curr, elements: updateFn(curr.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), curr]);
      setFuture([]);
      return nextTemplate;
    });
  }, []);

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

  const exportTemplateJson = useCallback(() => downloadTemplateJson(template), [template]);

  const importTemplateJson = useCallback((file: File) => {
    readTemplateJsonFile<TPayload>(file, (parsed) => {
      commitUpdate(() => parsed.elements);
      if (parsed.orientation) handleOrientationChange(parsed.orientation);
      if (parsed.pageSize) handlePageSize(parsed.pageSize);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitUpdate]);

  const applyPreset = useCallback((presetKey: string) => {
    const match = presets.find((p) => p.key === presetKey);
    if (!match) return;
    pushHistory(template);
    setTemplate(match.template);
    setSelectedIds([]);
  }, [presets, pushHistory, template]);

  const onMouseDownElement = useCallback((event: ReactMouseEvent, elementId: string) => {
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
  }, [selectedIds, template]);

  const onMouseDownResize = useCallback((event: ReactMouseEvent, elementId: string) => {
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
  }, [template]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(template);
      setSaved(true);
      // Cleanup any existing timer before scheduling a new one
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [onSave, template]);

  const handlePageSize = useCallback((pageSizeKey: string) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, pageSize: pageSizeKey }));
  }, [pushHistory, template]);

  const handleOrientationChange = useCallback((nextOrientation: TemplateOrientation) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, orientation: nextOrientation }));
  }, [pushHistory, template]);

  const resetToDefault = useCallback(() => {
    pushHistory(template);
    setTemplate(defaultTemplate);
    setSelectedIds([]);
  }, [defaultTemplate, pushHistory, template]);

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
