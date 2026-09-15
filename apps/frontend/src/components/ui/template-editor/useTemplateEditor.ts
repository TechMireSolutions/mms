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
  type ResizeHandle,
  type ResizeStateInfo,
} from "./useTemplateEditorInteractions";
import { useTemplateEditorShortcuts } from "./useTemplateEditorShortcuts";
import { useTemplateEditorElementActions } from "./useTemplateEditorElementActions";
import { useTemplateEditorZoom } from "./useTemplateEditorZoom";
import { downloadTemplateJson, newId, readTemplateJsonFile } from "./templateEditorUtils";
import { notify } from "@/lib/notify";

export interface UseTemplateEditorOptions<TPayload = Record<string, unknown>> {
  initialTemplate?: DocumentTemplate<TPayload>;
  defaultTemplate?: DocumentTemplate<TPayload>;
  availableFields?: TemplateFieldDefinition<TPayload>[];
  presets?: DocumentTemplatePreset<TPayload>[];
  onSave?: (template: DocumentTemplate<TPayload>) => void | Promise<void>;
  /**
   * Called when the editor itself wants to close. Escape is owned by the overlay
   * behaviour hook (see `useTemplateEditorModal`), which understands nested overlays.
   */
  onClose?: () => void;
  documentType?: string;
}

const FALLBACK_TEMPLATE: DocumentTemplate = {
  pageSize: "A5",
  orientation: "portrait",
  elements: [],
};

/** Repeated edits closer together than this collapse into a single undo step. */
const COALESCE_WINDOW_MS = 700;

/** How long a freshly added element stays highlighted on the canvas. */
const FLASH_DURATION_MS = 1600;

/** How long the "element deleted" status message stays available to assistive tech. */
const DELETION_NOTICE_MS = 4000;

export function useTemplateEditor<TPayload = Record<string, unknown>>({
  initialTemplate,
  defaultTemplate = FALLBACK_TEMPLATE as DocumentTemplate<TPayload>,
  availableFields = [],
  presets = [],
  onSave,
  documentType,
}: UseTemplateEditorOptions<TPayload> = {}) {
  const { t, isRtl } = useTranslation();
  const [template, setTemplate] = useState<DocumentTemplate<TPayload>>(() => initialTemplate || defaultTemplate);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuides, setShowGuides] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<DocumentTemplate<TPayload>[]>([]);
  const [future, setFuture] = useState<DocumentTemplate<TPayload>[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  /** Briefly set after an element is added so the canvas can reveal and flash it. */
  const [flashElementId, setFlashElementId] = useState<string | null>(null);
  /**
   * Deletion feedback for screen readers. `nonce` also tells the shell to move focus back
   * to the canvas, because the control that was activated no longer exists.
   */
  const [deletionNotice, setDeletionNotice] = useState<{ nonce: number; message: string } | null>(
    null
  );
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragStateInfo<TPayload> | null>(null);
  const resizeState = useRef<ResizeStateInfo<TPayload> | null>(null);
  // Timer ref for the "saved" flash — cleared on unmount to prevent state update on unmounted component
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Coalescing window for repeated edits (typing, key repeat, colour-picker drags)
  const lastCoalesceRef = useRef<{ key: string; at: number } | null>(null);
  // Serialized snapshot of the template at the point of last save to compute isDirty accurately
  const lastSavedTemplateJsonRef = useRef<string>(JSON.stringify(initialTemplate || defaultTemplate));
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (initialTemplate) {
      const isFirstHydration = !hasHydratedRef.current;
      const initialJson = JSON.stringify(initialTemplate);
      if (
        isFirstHydration ||
        (initialJson !== lastSavedTemplateJsonRef.current &&
          JSON.stringify(template) === lastSavedTemplateJsonRef.current)
      ) {
        setTemplate(initialTemplate);
        lastSavedTemplateJsonRef.current = initialJson;
        hasHydratedRef.current = true;
      }
    }
  }, [initialTemplate, template]);

  const orientation = template.orientation || "portrait";

  // Memoize derived values to avoid recomputation on every render
  const size = useMemo(() => getPageDimensions(template.pageSize, orientation), [template.pageSize, orientation]);
  const zoom = useTemplateEditorZoom({ size });

  const selectedId = useMemo(
    () => (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null),
    [selectedIds]
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedElements = useMemo(
    () => template.elements.filter((el) => selectedSet.has(el.id)),
    [template.elements, selectedSet]
  );
  const selectedElement = useMemo(
    () => template.elements.find((el) => el.id === selectedId),
    [template.elements, selectedId]
  );

  const setSelectedId = useCallback((id: string | null) => setSelectedIds(id ? [id] : []), []);
  const deselectAll = useCallback(() => setSelectedIds([]), []);
  const selectAll = useCallback(() => setSelectedIds(template.elements.map((el) => el.id)), [template.elements]);

  // Cleanup the saved-flash and element-flash timers on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
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
    setActivePresetKey(null);
  }, []);

  /**
   * Commit for edits that repeat while the user works: typing in a field, holding an
   * arrow key, dragging in an OS colour picker.
   *
   * Each of those used to push its own history entry through `commitUpdate`. A
   * fourteen-character label therefore consumed fourteen of the thirty undo slots, and
   * a single label edit could flush the undo history of a whole design session.
   * Repeated edits that share a coalesce key inside {@link COALESCE_WINDOW_MS} collapse
   * into one entry, so undo steps match user intent.
   */
  const commitUpdateCoalesced = useCallback((coalesceKey: string, updateFn: ElementUpdater) => {
    setTemplate((curr) => {
      const nextTemplate = { ...curr, elements: updateFn(curr.elements) };
      const now = Date.now();
      const last = lastCoalesceRef.current;
      const startsNewStep =
        !last || last.key !== coalesceKey || now - last.at > COALESCE_WINDOW_MS;
      if (startsNewStep) {
        setHistory((historyStack) => [...historyStack.slice(-30), curr]);
        setFuture([]);
      }
      lastCoalesceRef.current = { key: coalesceKey, at: now };
      return nextTemplate;
    });
  }, []);

  /** Reveals and highlights a newly added element so "Add" never looks like a no-op. */
  const handleElementAdded = useCallback((elementId: string) => {
    setFlashElementId(elementId);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashElementId(null), FLASH_DURATION_MS);
  }, []);

  /** Announces a deletion and asks the shell to return focus to the canvas. */
  const handleElementDeleted = useCallback(
    (deletedCount: number) => {
      setDeletionNotice((prev) => ({
        nonce: (prev?.nonce ?? 0) + 1,
        message: `${t("templateEditor.elementDeleted")} (${deletedCount})`,
      }));
      if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
      deletionTimerRef.current = setTimeout(() => setDeletionNotice(null), DELETION_NOTICE_MS);
    },
    [t]
  );

  const clipboardRef = useRef<TemplateElement<keyof TPayload & string>[]>([]);

  const interactions = useTemplateEditorInteractions({
    canvasScale: zoom.canvasScale,
    size,
    templateElements: template.elements,
    dragState,
    resizeState,
    canvasViewportRef: zoom.canvasViewportRef,
    updateElements,
    setHistory,
    setFuture,
  });

  const elementActions = useTemplateEditorElementActions<TPayload>({
    elements: template.elements,
    selectedIds,
    setSelectedIds,
    commitUpdate,
    commitUpdateCoalesced,
    size,
    onElementAdded: handleElementAdded,
    onElementDeleted: handleElementDeleted,
    t,
  });

  const handlePageSize = useCallback((pageSizeKey: string) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, pageSize: pageSizeKey }));
  }, [pushHistory, template]);

  const handleOrientationChange = useCallback((nextOrientation: TemplateOrientation) => {
    pushHistory(template);
    setTemplate((curr) => ({ ...curr, orientation: nextOrientation }));
  }, [pushHistory, template]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(template);
      setSaved(true);
      // Reset isDirty baseline to current template content
      lastSavedTemplateJsonRef.current = JSON.stringify(template);
      // Cleanup any existing timer before scheduling a new one
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Template save error:", err);
      notify.error(t("templateEditor.exportFailed"));
    } finally {
      setSaving(false);
    }
  }, [onSave, t, template]);

  const copySelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toCopy = template.elements.filter((el) => selectedSet.has(el.id));
    if (toCopy.length > 0) {
      clipboardRef.current = toCopy;
    }
  }, [selectedIds.length, selectedSet, template.elements]);

  const paste = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    const newElements: TemplateElement<keyof TPayload & string>[] = [];
    const newIds: string[] = [];
    for (const el of clipboardRef.current) {
      const id = newId();
      newIds.push(id);
      const nextX = el.x + 16;
      const nextY = el.y + 16;
      const clampedX = nextX + el.w > size.width ? Math.max(0, size.width - el.w - 16) : nextX;
      const clampedY = nextY + el.h > size.height ? Math.max(0, size.height - el.h - 16) : nextY;
      newElements.push({
        ...el,
        id,
        x: clampedX,
        y: clampedY,
        style: el.style ? { ...el.style } : undefined,
        columns: el.columns ? el.columns.map((col) => ({ ...col })) : undefined,
        tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
      });
    }
    commitUpdate((curr) => [...curr, ...newElements]);
    setSelectedIds(newIds);
  }, [commitUpdate, size.height, size.width]);

  useTemplateEditorShortcuts({
    undo,
    redo,
    selectAll,
    deselectAll,
    duplicateSelected: elementActions.duplicateSelected,
    deleteSelected: elementActions.deleteSelected,
    nudgeSelected: elementActions.nudgeSelected,
    resizeSelected: elementActions.resizeSelected,
    hasSelection: selectedIds.length > 0,
    onSave: handleSave,
    copySelected,
    paste,
    /*
     * `onClose` is deliberately NOT passed any more: Escape-to-close is owned by
     * `useOverlayBehavior` in `useTemplateEditorModal`, which only honours Escape for
     * the topmost overlay. Two handlers meant Escape closed the editor while a nested
     * confirm dialog was open.
     */
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    zoomReset: zoom.zoomReset,
  });

  const exportTemplateJson = useCallback(
    () => downloadTemplateJson(template, documentType),
    [template, documentType]
  );

  const importTemplateJson = useCallback((file: File) => {
    readTemplateJsonFile<TPayload>(
      file,
      (parsed) => {
        pushHistory(template);
        const sanitizedElements: TemplateElement<keyof TPayload & string>[] = (parsed.elements || []).map((el) => ({
          ...el,
          id: typeof el.id === "string" && el.id.trim().length > 0 ? el.id : newId(),
          type: typeof el.type === "string" ? el.type : "text",
          label: typeof el.label === "string" ? el.label : "",
          x: Number.isFinite(el.x) ? Math.max(0, Math.round(el.x)) : 0,
          y: Number.isFinite(el.y) ? Math.max(0, Math.round(el.y)) : 0,
          w: Number.isFinite(el.w) && el.w > 0 ? Math.round(el.w) : 100,
          h: Number.isFinite(el.h) && el.h > 0 ? Math.round(el.h) : 40,
          style: el.style ? { ...el.style } : undefined,
          columns: Array.isArray(el.columns) ? el.columns.map((col) => ({ ...col })) : undefined,
          tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
        }));
        setTemplate((curr) => ({
          ...curr,
          elements: sanitizedElements,
          pageSize: parsed.pageSize || curr.pageSize,
          orientation: parsed.orientation || curr.orientation,
        }));
        setSelectedIds([]);
        notify.success(t("templateEditor.importSuccess"));
      },
      (err) => {
        console.error(err);
        notify.error(t("templateEditor.importFailed"));
      }
    );
  }, [pushHistory, t, template]);

  const applyPreset = useCallback((presetKey: string) => {
    const match = presets.find((p) => p.key === presetKey);
    if (!match) return;
    pushHistory(template);
    const clonedElements: TemplateElement<keyof TPayload & string>[] = match.template.elements.map((el) => ({
      ...el,
      id: newId(),
      style: el.style ? { ...el.style } : undefined,
      columns: el.columns ? el.columns.map((col) => ({ ...col })) : undefined,
      tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
    }));
    setTemplate({
      ...match.template,
      elements: clonedElements,
    });
    setSelectedIds([]);
    setActivePresetKey(presetKey);
  }, [presets, pushHistory, template]);

  const onMouseDownElement = useCallback((event: ReactMouseEvent, elementId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;

    const isMulti = event.shiftKey || event.metaKey || event.ctrlKey;
    let activeIds = selectedIds;
    if (isMulti) {
      activeIds = selectedSet.has(elementId)
        ? selectedIds.filter((id) => id !== elementId)
        : [...selectedIds, elementId];
      setSelectedIds(activeIds);
    } else if (!selectedSet.has(elementId)) {
      activeIds = [elementId];
      setSelectedIds(activeIds);
    }

    const activeIdSet = new Set(activeIds);
    const itemsToDrag = template.elements
      .filter((el) => activeIdSet.has(el.id))
      .map((el) => ({ id: el.id, origX: el.x, origY: el.y }));
    dragState.current = {
      items: itemsToDrag.length > 0 ? itemsToDrag : [{ id: elementId, origX: 0, origY: 0 }],
      startX: event.clientX,
      startY: event.clientY,
      initialTemplate: template,
      hasMoved: false,
    };
  }, [selectedIds, selectedSet, template]);

  const onMouseDownResize = useCallback((event: ReactMouseEvent, elementId: string, handle: ResizeHandle = "se") => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const el = template.elements.find((e) => e.id === elementId);
    if (!el) return;
    resizeState.current = {
      id: elementId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.w,
      origH: el.h,
      initialTemplate: template,
      hasMoved: false,
    };
  }, [template]);

  const resetToDefault = useCallback(() => {
    pushHistory(template);
    const clonedElements: TemplateElement<keyof TPayload & string>[] = defaultTemplate.elements.map((el) => ({
      ...el,
      id: newId(),
      style: el.style ? { ...el.style } : undefined,
      columns: el.columns ? el.columns.map((col) => ({ ...col })) : undefined,
      tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
    }));
    setTemplate({
      ...defaultTemplate,
      elements: clonedElements,
    });
    setSelectedIds([]);
  }, [defaultTemplate, pushHistory, template]);

  const isDirty = useMemo(
    () => JSON.stringify(template) !== lastSavedTemplateJsonRef.current,
    [template]
  );

  return {
    t,
    isRtl,
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
    isDirty,
    flashElementId,
    deletionNotice,
    history,
    future,
    ...zoom,
    ...interactions,
    canvasRef,
    size,
    orientation,
    undo,
    redo,
    exportTemplateJson,
    importTemplateJson,
    applyPreset,
    activePresetKey,
    copySelected,
    paste,
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
