/**
 * @file useTemplateEditor.ts
 * @description Headless hook managing template state, undo/redo stacks, element lifecycle, and shortcut commands.
 */

import { useCallback, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type DocumentTemplate,
  type DocumentTemplatePreset,
  type TemplateFieldDefinition,
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
import { useTemplateEditorClipboard } from "./useTemplateEditorClipboard";
import { useTemplateEditorDocumentState } from "./useTemplateEditorDocumentState";
import { useTemplateEditorPresetsAndIo } from "./useTemplateEditorPresetsAndIo";
import { useTemplateEditorNotices } from "./useTemplateEditorNotices";

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


export function useTemplateEditor<TPayload = Record<string, unknown>>({
  initialTemplate,
  defaultTemplate = FALLBACK_TEMPLATE as DocumentTemplate<TPayload>,
  availableFields = [],
  presets = [],
  onSave,
  documentType,
}: UseTemplateEditorOptions<TPayload> = {}) {
  const { t, isRtl } = useTranslation();

  const doc = useTemplateEditorDocumentState<TPayload>({
    initialTemplate,
    defaultTemplate,
    onSave,
    t,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuides, setShowGuides] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { flashElementId, deletionNotice, handleElementAdded, handleElementDeleted } =
    useTemplateEditorNotices({ t });

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragStateInfo<TPayload> | null>(null);
  const resizeState = useRef<ResizeStateInfo<TPayload> | null>(null);

  const zoom = useTemplateEditorZoom({ size: doc.size });

  const selectedId = useMemo(
    () => (selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null),
    [selectedIds]
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedElements = useMemo(
    () => doc.template.elements.filter((el) => selectedSet.has(el.id)),
    [doc.template.elements, selectedSet]
  );
  const selectedElement = useMemo(
    () => doc.template.elements.find((el) => el.id === selectedId),
    [doc.template.elements, selectedId]
  );

  const setSelectedId = useCallback((id: string | null) => setSelectedIds(id ? [id] : []), []);
  const deselectAll = useCallback(() => setSelectedIds([]), []);
  const selectAll = useCallback(() => setSelectedIds(doc.template.elements.map((el) => el.id)), [doc.template.elements]);


  const interactions = useTemplateEditorInteractions({
    canvasScale: zoom.canvasScale,
    size: doc.size,
    templateElements: doc.template.elements,
    dragState,
    resizeState,
    canvasViewportRef: zoom.canvasViewportRef,
    updateElements: doc.updateElements,
    setHistory: doc.setHistory,
    setFuture: doc.setFuture,
  });

  const elementActions = useTemplateEditorElementActions<TPayload>({
    elements: doc.template.elements,
    selectedIds,
    setSelectedIds,
    commitUpdate: doc.commitUpdate,
    commitUpdateCoalesced: doc.commitUpdateCoalesced,
    size: doc.size,
    onElementAdded: handleElementAdded,
    onElementDeleted: handleElementDeleted,
    t,
  });

  const clipboard = useTemplateEditorClipboard<TPayload>({
    elements: doc.template.elements,
    selectedSet,
    selectedIds,
    setSelectedIds,
    commitUpdate: doc.commitUpdate,
    size: doc.size,
  });

  useTemplateEditorShortcuts({
    undo: doc.undo,
    redo: doc.redo,
    selectAll,
    deselectAll,
    duplicateSelected: elementActions.duplicateSelected,
    deleteSelected: elementActions.deleteSelected,
    nudgeSelected: elementActions.nudgeSelected,
    resizeSelected: elementActions.resizeSelected,
    hasSelection: selectedIds.length > 0,
    onSave: doc.handleSave,
    copySelected: clipboard.copySelected,
    paste: clipboard.paste,
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    zoomReset: zoom.zoomReset,
  });

  const { exportTemplateJson, importTemplateJson, applyPreset } =
    useTemplateEditorPresetsAndIo<TPayload>({
      template: doc.template,
      setTemplate: doc.setTemplate,
      pushHistory: doc.pushHistory,
      setSelectedIds,
      setActivePresetKey: doc.setActivePresetKey,
      presets,
      documentType,
      t,
    });

  const onMouseDownElement = useCallback(
    (event: ReactMouseEvent, elementId: string) => {
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
      const itemsToDrag = doc.template.elements
        .filter((el) => activeIdSet.has(el.id))
        .map((el) => ({ id: el.id, origX: el.x, origY: el.y }));
      dragState.current = {
        items: itemsToDrag.length > 0 ? itemsToDrag : [{ id: elementId, origX: 0, origY: 0 }],
        startX: event.clientX,
        startY: event.clientY,
        initialTemplate: doc.template,
        hasMoved: false,
      };
    },
    [doc.template, selectedIds, selectedSet]
  );

  const onMouseDownResize = useCallback(
    (event: ReactMouseEvent, elementId: string, handle: ResizeHandle = "se") => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const el = doc.template.elements.find((e) => e.id === elementId);
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
        initialTemplate: doc.template,
        hasMoved: false,
      };
    },
    [doc.template]
  );

  const resetToDefault = useCallback(() => {
    doc.resetToDefault();
    setSelectedIds([]);
  }, [doc]);

  return {
    t,
    isRtl,
    template: doc.template,
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
    saved: doc.saved,
    saving: doc.saving,
    isDirty: doc.isDirty,
    flashElementId,
    deletionNotice,
    history: doc.history,
    future: doc.future,
    ...zoom,
    ...interactions,
    canvasRef,
    size: doc.size,
    orientation: doc.orientation,
    undo: doc.undo,
    redo: doc.redo,
    exportTemplateJson,
    importTemplateJson,
    applyPreset,
    activePresetKey: doc.activePresetKey,
    copySelected: clipboard.copySelected,
    paste: clipboard.paste,
    onMouseDownElement,
    onMouseDownResize,
    handleSave: doc.handleSave,
    handlePageSize: doc.handlePageSize,
    handleOrientationChange: doc.handleOrientationChange,
    resetToDefault,
    availableFields,
    presets,
    ...elementActions,
  };
}
