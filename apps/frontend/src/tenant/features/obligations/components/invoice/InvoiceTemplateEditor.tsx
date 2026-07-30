import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useBranding } from "@/tenant/hooks/useBranding";
import { PAGE_SIZES, loadTemplate, saveTemplate, type ElementStyle, type InvoiceTemplate, type TemplateElement } from "@/lib/invoiceTemplateStore";
import { getPrintBrandingTokens, PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import { InvoiceTemplateCanvas } from "./InvoiceTemplateCanvas";
import { InvoiceTemplateElementPalette, type InvoiceTemplateFieldOption } from "./InvoiceTemplateElementPalette";
import { InvoiceTemplateKeyboardHints } from "./InvoiceTemplateKeyboardHints";
import { InvoiceTemplatePropertiesPanel } from "./InvoiceTemplatePropertiesPanel";
import { InvoiceTemplateToolbar } from "./InvoiceTemplateToolbar";
import { newId, snap } from "./invoiceTemplateEditorUtils";

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
}

export function InvoiceTemplateEditor({ onClose, fullscreen = true }: InvoiceTemplateEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const branding = useBranding();
  const printTokens = getPrintBrandingTokens();
  const [template, setTemplate] = useState<InvoiceTemplate>(() => loadTemplate());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<InvoiceTemplate[]>([]);
  const [future, setFuture] = useState<InvoiceTemplate[]>([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasViewportRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string, startX: number, startY: number, origX: number, origY: number } | null>(null);
  const resizeState = useRef<{ id: string, startX: number, startY: number, origW: number, origH: number } | null>(null);

  const size = PAGE_SIZES[template.pageSize] || PAGE_SIZES.A6;
  const selectedElement = template.elements.find((templateElement) => templateElement.id === selectedId);

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

  const pushHistory = useCallback((currentTemplate: InvoiceTemplate) => {
    setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
    setFuture([]);
  }, []);

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

  const updateElements = useCallback((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => ({ ...currentTemplate, elements: updateFn(currentTemplate.elements) }));
  }, []);

  const commitUpdate = useCallback((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => {
      const nextTemplate = { ...currentTemplate, elements: updateFn(currentTemplate.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
      setFuture([]);
      return nextTemplate;
    });
  }, []);

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
    setSelectedId(null);
  };

  const duplicateElement = (elementId: string) => {
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    const duplicatedElement: TemplateElement = { ...templateElement, id: newId(), x: templateElement.x + 12, y: templateElement.y + 12, style: { ...templateElement.style } };
    commitUpdate((elements) => [...elements, duplicatedElement]);
    setSelectedId(duplicatedElement.id);
  };

  const addStaticText = () => {
    const templateElement: TemplateElement = { id: newId(), type: "static", label: t("obligations.invoiceTemplate.newText"), x: 20, y: 20, w: 200, h: 18, style: { fontSize: 11, color: PRINT_NEUTRAL.text } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  const addDivider = () => {
    const templateElement: TemplateElement = { id: newId(), type: "divider", label: "", x: 20, y: 20, w: size.width - 40, h: 1, style: { color: PRINT_NEUTRAL.border } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  const addField = (fieldDef: InvoiceTemplateFieldOption) => {
    const templateElement: TemplateElement = { id: newId(), type: "field", label: fieldDef.label, field: fieldDef.field, x: 20, y: 20, w: 160, h: 16, style: { fontSize: 10, color: PRINT_NEUTRAL.text } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  const onMouseDownElement = (event: React.MouseEvent, elementId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(elementId);
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    if (!canvasRef.current) return;
    dragState.current = {
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      origX: templateElement.x,
      origY: templateElement.y,
    };
  };

  const onMouseMove = useCallback((event: MouseEvent) => {
    const currentDrag = dragState.current;
    if (currentDrag) {
      const deltaX = (event.clientX - currentDrag.startX) / canvasScale;
      const deltaY = (event.clientY - currentDrag.startY) / canvasScale;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === currentDrag.id
          ? { ...templateElement, x: snap(Math.max(0, currentDrag.origX + deltaX)), y: snap(Math.max(0, currentDrag.origY + deltaY)) }
          : templateElement
        )
      );
    }

    const currentResize = resizeState.current;
    if (currentResize) {
      const deltaX = (event.clientX - currentResize.startX) / canvasScale;
      const deltaY = (event.clientY - currentResize.startY) / canvasScale;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === currentResize.id
          ? { ...templateElement, w: snap(Math.max(20, currentResize.origW + deltaX)), h: snap(Math.max(8, currentResize.origH + deltaY)) }
          : templateElement
        )
      );
    }
  }, [canvasScale, updateElements]);

  const onMouseUp = useCallback(() => {
    if (dragState.current || resizeState.current) {
      setTemplate((currentTemplate) => {
        setHistory((historyStack) => [...historyStack.slice(-30), currentTemplate]);
        setFuture([]);
        return currentTemplate;
      });
    }
    dragState.current = null;
    resizeState.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onMouseDownResize = (event: React.MouseEvent, elementId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    resizeState.current = { id: elementId, startX: event.clientX, startY: event.clientY, origW: templateElement.w, origH: templateElement.h };
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

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") { event.preventDefault(); undo(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "y") { event.preventDefault(); redo(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "d") { event.preventDefault(); if (selectedId) duplicateElement(selectedId); }
      if (event.key === "Delete" || event.key === "Backspace") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedId) deleteElement(selectedId);
      }
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex flex-col bg-background rounded-xl border border-border overflow-hidden"} style={!fullscreen ? { height: "80vh" } : {}}>
      <InvoiceTemplateToolbar
        template={template}
        historyLength={history.length}
        futureLength={future.length}
        saved={saved}
        showGuides={showGuides}
        fullscreen={fullscreen}
        onUndo={undo}
        onRedo={redo}
        onPageSizeChange={handlePageSize}
        onToggleGuides={() => setShowGuides(!showGuides)}
        onSave={handleSave}
        onClose={onClose}
        t={t}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <InvoiceTemplateElementPalette
          onAddStaticText={addStaticText}
          onAddDivider={addDivider}
          onAddField={addField}
          t={t}
        />
        <InvoiceTemplateCanvas
          template={template}
          selectedId={selectedId}
          size={size}
          canvasScale={canvasScale}
          showGuides={showGuides}
          canvasViewportRef={canvasViewportRef}
          canvasRef={canvasRef}
          branding={branding}
          printTokens={printTokens}
          onDeselect={() => setSelectedId(null)}
          onMouseDownElement={onMouseDownElement}
          onMouseDownResize={onMouseDownResize}
          onDuplicateElement={duplicateElement}
          onDeleteElement={deleteElement}
          t={t}
        />
        <InvoiceTemplatePropertiesPanel
          selectedElement={selectedElement}
          onPatchElement={patchElement}
          onPatchStyle={patchStyle}
          onDuplicateElement={duplicateElement}
          onDeleteElement={deleteElement}
          t={t}
        />
      </div>

      <InvoiceTemplateKeyboardHints t={t} />
    </div>
  );
}
