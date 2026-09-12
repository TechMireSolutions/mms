import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { getPageDimensions, getDefaultTemplate, getAvailablePresets, loadTemplate, saveTemplate, type ElementStyle, type InvoiceTemplate, type TemplateElement, type TemplateOrientation } from "@/lib/invoiceTemplateStore";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { InvoiceTemplateFieldOption } from "./InvoiceTemplateElementPalette";
import { alignElements, newId, type AlignmentType } from "./invoiceTemplateEditorUtils";
import { useInvoiceTemplateEditorInteractions, type DragStateInfo, type ResizeStateInfo } from "./useInvoiceTemplateEditorInteractions";

export function useInvoiceTemplateEditor() {
  const { t } = useTranslation();
  const [template, setTemplate] = useState<InvoiceTemplate>(() => loadTemplate());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuides, setShowGuides] = useState(true);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<InvoiceTemplate[]>([]);
  const [future, setFuture] = useState<InvoiceTemplate[]>([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasViewportRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragStateInfo | null>(null);
  const resizeState = useRef<ResizeStateInfo | null>(null);

  const orientation = template.orientation || "portrait";
  const size = getPageDimensions(template.pageSize, orientation);
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedElements = template.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElement = template.elements.find((templateElement) => templateElement.id === selectedId);

  const setSelectedId = (id: string | null) => {
    setSelectedIds(id ? [id] : []);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectAll = () => {
    setSelectedIds(template.elements.map((el) => el.id));
  };

  useEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;

    const updateCanvasScale = () => {
      const availableWidth = Math.max(0, viewport.clientWidth - 32);
      if (availableWidth > 0) {
        setCanvasScale(Math.min(1, availableWidth / size.width));
      }
    };
    const observer = new ResizeObserver(updateCanvasScale);
    observer.observe(viewport);
    updateCanvasScale();
    return () => observer.disconnect();
  }, [size.width]);

  const pushHistory = ((currentTemplate: InvoiceTemplate) => {
    setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
    setFuture([]);
  });

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

  const updateElements = ((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => ({ ...currentTemplate, elements: updateFn(currentTemplate.elements) }));
  });

  const commitUpdate = ((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => {
      const nextTemplate = { ...currentTemplate, elements: updateFn(currentTemplate.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
      setFuture([]);
      return nextTemplate;
    });
  });

  useInvoiceTemplateEditorInteractions({
    canvasScale,
    dragState,
    resizeState,
    updateElements,
    setTemplate,
    setHistory,
    setFuture,
  });

  const patchElement = (elementId: string, patch: Partial<TemplateElement>) => {
    commitUpdate((templateElements) => templateElements.map((templateElement) =>
      templateElement.id === elementId ? { ...templateElement, ...patch } : templateElement
    ));
  };

  const patchStyle = (elementId: string, stylePatch: Partial<ElementStyle>) => {
    commitUpdate((templateElements) => templateElements.map((templateElement) =>
      templateElement.id === elementId
        ? { ...templateElement, style: { ...templateElement.style, ...stylePatch } }
        : templateElement
    ));
  };

  const deleteElement = (elementId: string) => {
    commitUpdate((templateElements) => templateElements.filter((templateElement) => templateElement.id !== elementId));
    setSelectedIds((prev) => prev.filter((id) => id !== elementId));
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((templateElements) => templateElements.filter((templateElement) => !idSet.has(templateElement.id)));
    setSelectedIds([]);
  };

  const duplicateElement = (elementId: string) => {
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    const duplicatedElement: TemplateElement = { ...templateElement, id: newId(), x: templateElement.x + 12, y: templateElement.y + 12, style: { ...templateElement.style } };
    commitUpdate((elements) => [...elements, duplicatedElement]);
    setSelectedIds([duplicatedElement.id]);
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const targets = template.elements.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;
    const newElements: TemplateElement[] = targets.map((el) => ({
      ...el,
      id: newId(),
      x: el.x + 12,
      y: el.y + 12,
      style: { ...el.style },
    }));
    commitUpdate((elements) => [...elements, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
  };

  const handleAlignSelected = (alignType: AlignmentType) => {
    commitUpdate((elements) => alignElements(elements, selectedIds, alignType));
  };

  const addStaticText = () => {
    const templateElement: TemplateElement = { id: newId(), type: "static", label: t("obligations.invoiceTemplate.newText"), x: 20, y: 20, w: 200, h: 18, style: { fontSize: 11, color: PRINT_NEUTRAL.text } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedIds([templateElement.id]);
  };

  const addDivider = () => {
    const templateElement: TemplateElement = { id: newId(), type: "divider", label: "", x: 20, y: 20, w: size.width - 40, h: 1, style: { color: PRINT_NEUTRAL.border } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedIds([templateElement.id]);
  };

  const addField = (fieldDef: InvoiceTemplateFieldOption) => {
    const templateElement: TemplateElement = { id: newId(), type: "field", label: fieldDef.label, field: fieldDef.field, x: 20, y: 20, w: 160, h: 16, style: { fontSize: 10, color: PRINT_NEUTRAL.text } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedIds([templateElement.id]);
  };

  const addQrCode = () => {
    const templateElement: TemplateElement = {
      id: newId(),
      type: "qrcode",
      label: t("obligations.invoiceTemplate.qrCode"),
      x: 20,
      y: 20,
      w: 64,
      h: 64,
    };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedIds([templateElement.id]);
  };

  const applyPreset = (presetKey: string) => {
    const presets = getAvailablePresets();
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
      if (selectedIds.includes(elementId)) {
        activeIds = selectedIds.filter((id) => id !== elementId);
      } else {
        activeIds = [...selectedIds, elementId];
      }
      setSelectedIds(activeIds);
    } else {
      if (!selectedIds.includes(elementId)) {
        activeIds = [elementId];
        setSelectedIds(activeIds);
      }
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
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    resizeState.current = {
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      origW: templateElement.w,
      origH: templateElement.h,
      initialTemplate: template,
      hasMoved: false,
    };
  };

  const handleSave = () => {
    saveTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePageSize = (pageSizeKey: string) => {
    pushHistory(template);
    setTemplate((currentTemplate) => ({ ...currentTemplate, pageSize: pageSizeKey }));
  };

  const handleOrientationChange = (nextOrientation: TemplateOrientation) => {
    pushHistory(template);
    setTemplate((currentTemplate) => ({ ...currentTemplate, orientation: nextOrientation }));
  };

  const resetToDefault = () => {
    pushHistory(template);
    setTemplate(getDefaultTemplate());
    setSelectedIds([]);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = activeEl?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(activeEl?.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        if (!isInput) {
          event.preventDefault();
          selectAll();
          return;
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (!isInput && (event.key === "Delete" || event.key === "Backspace")) {
        if (selectedIds.length > 0) {
          event.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (!isInput && selectedIds.length > 0 && (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const step = event.shiftKey ? 4 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        const idSet = new Set(selectedIds);
        commitUpdate((templateElements) =>
          templateElements.map((templateElement) =>
            idSet.has(templateElement.id)
              ? { ...templateElement, x: Math.max(0, templateElement.x + dx), y: Math.max(0, templateElement.y + dy) }
              : templateElement
          )
        );
        return;
      }
      if (event.key === "Escape") deselectAll();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, template, history, future]);

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
    alignSelected: handleAlignSelected,
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
  };
}

