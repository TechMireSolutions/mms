import React, { useState, useRef, useCallback, useEffect } from "react";
import { getObject } from "../../../lib/db";
import {
  Move, Trash2, Copy, Save,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Minus, Type, Undo2, Redo2, Eye, EyeOff,
} from "lucide-react";
import {
  PAGE_SIZES, AVAILABLE_FIELDS, loadTemplate, saveTemplate, InvoiceTemplate, TemplateElement, ElementStyle
} from "../../../lib/invoiceTemplateStore";
import { getPrintBrandingTokens, PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";

const SNAP = 4; // px grid snap

function snap(value: number) { return Math.round(value / SNAP) * SNAP; }

let idCounter = Date.now();
function newId() { return `el_${++idCounter}`; }

// ── Style control helpers ─────────────────────────────────────────────────────
interface StyleBtnProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

/**
 * StyleBtn component.
 * @param {StyleBtnProps} props
 */
function StyleBtn({ active, onClick, children, title }: StyleBtnProps) {
  return (
    <Button type="button" title={title} onClick={onClick}
      variant="ghost"
      className={`w-7 h-7 flex items-center justify-center p-0 rounded text-xs transition-colors border shadow-none ${active ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95" : "border-border hover:bg-muted text-foreground"}`}>
      {children}
    </Button>
  );
}

interface StyleInputProps {
  label: string;
  value: string | number;
  onChange: (nextValue: string | number) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * StyleInput component.
 * @param {StyleInputProps} props
 */
function StyleInput({ label, value, onChange, type = "text", min, max, step, className = "" }: StyleInputProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
        min={min} max={max} step={step}
        className="w-full px-1.5 py-0.5 h-auto text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30" />
    </div>
  );
}

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
}

/**
 * InvoiceTemplateEditor component.
 * @param {InvoiceTemplateEditorProps} props
 */
export function InvoiceTemplateEditor({ onClose, fullscreen = true }: InvoiceTemplateEditorProps) {
  const printTokens = getPrintBrandingTokens();
  const [template, setTemplate] = useState<InvoiceTemplate>(() => loadTemplate());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<InvoiceTemplate[]>([]);
  const [future, setFuture] = useState<InvoiceTemplate[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string, startX: number, startY: number, origX: number, origY: number, canvasLeft: number, canvasTop: number } | null>(null);
  const resizeState = useRef<{ id: string, startX: number, startY: number, origW: number, origH: number } | null>(null);

  const size = PAGE_SIZES[template.pageSize] || PAGE_SIZES.A6;
  const selectedElement = template.elements.find((templateElement) => templateElement.id === selectedId);

  // ── History management ────────────────────────────────────────────────────
  const pushHistory = useCallback((tmpl: InvoiceTemplate) => {
    setHistory((historyStack) => [...historyStack.slice(-30), tmpl]);
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

  // ── Element mutations ─────────────────────────────────────────────────────
  const updateElements = useCallback((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => {
      const nextTemplate = { ...currentTemplate, elements: updateFn(currentTemplate.elements) };
      return nextTemplate;
    });
  }, []);

  const commitUpdate = useCallback((updateFn: (templateElements: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((currentTemplate) => {
      const prevTemplate = currentTemplate;
      const nextTemplate = { ...currentTemplate, elements: updateFn(currentTemplate.elements) };
      setHistory((historyStack) => [...historyStack.slice(-30), prevTemplate]);
      setFuture([]);
      return nextTemplate;
    });
  }, []);

  const patchEl = (elementId: string, patch: Partial<TemplateElement>) => {
    commitUpdate((templateElements) => templateElements.map((templateElement) => templateElement.id === elementId ? { ...templateElement, ...patch } as TemplateElement : templateElement));
  };

  const patchStyle = (elementId: string, stylePatch: Partial<ElementStyle>) => {
    commitUpdate((templateElements) => templateElements.map((templateElement) => templateElement.id === elementId ? { ...templateElement, style: { ...templateElement.style, ...stylePatch } } as TemplateElement : templateElement));
  };

  const deleteEl = (elementId: string) => {
    commitUpdate((templateElements) => templateElements.filter((templateElement) => templateElement.id !== elementId));
    setSelectedId(null);
  };

  const duplicateEl = (elementId: string) => {
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    const duplicatedElement: TemplateElement = { ...templateElement, id: newId(), x: templateElement.x + 12, y: templateElement.y + 12, style: { ...templateElement.style } };
    commitUpdate((elements) => [...elements, duplicatedElement]);
    setSelectedId(duplicatedElement.id);
  };

  const addStaticText = () => {
    const templateElement: TemplateElement = { id: newId(), type: "static", label: "New Text", x: 20, y: 20, w: 200, h: 18, style: { fontSize: 11, color: PRINT_NEUTRAL.text } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  const addDivider = () => {
    const templateElement: TemplateElement = { id: newId(), type: "divider", label: "", x: 20, y: 20, w: size.width - 40, h: 1, style: { color: PRINT_NEUTRAL.border } };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  const addField = (fieldDef: { field: string, label: string }) => {
    const templateElement: TemplateElement = {
      id: newId(), type: "field", label: fieldDef.label, field: fieldDef.field,
      x: 20, y: 20, w: 160, h: 16,
      style: { fontSize: 10, color: PRINT_NEUTRAL.text },
    };
    commitUpdate((elements) => [...elements, templateElement]);
    setSelectedId(templateElement.id);
  };

  // ── Drag ─────────────────────────────────────────────────────────────────
  const onMouseDownEl = (event: React.MouseEvent, elementId: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(elementId);
    const templateElement = template.elements.find((element) => element.id === elementId);
    if (!templateElement) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      id: elementId,
      startX: event.clientX,
      startY: event.clientY,
      origX: templateElement.x,
      origY: templateElement.y,
      canvasLeft: rect.left,
      canvasTop: rect.top,
    };
  };

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (dragState.current) {
      const deltaX = event.clientX - dragState.current.startX;
      const deltaY = event.clientY - dragState.current.startY;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === dragState.current!.id
          ? { ...templateElement, x: snap(Math.max(0, dragState.current!.origX + deltaX)), y: snap(Math.max(0, dragState.current!.origY + deltaY)) }
          : templateElement
        )
      );
    }
    if (resizeState.current) {
      const deltaX = event.clientX - resizeState.current.startX;
      const deltaY = event.clientY - resizeState.current.startY;
      updateElements((templateElements) =>
        templateElements.map((templateElement) => templateElement.id === resizeState.current!.id
          ? { ...templateElement, w: snap(Math.max(20, resizeState.current!.origW + deltaX)), h: snap(Math.max(8, resizeState.current!.origH + deltaY)) }
          : templateElement
        )
      );
    }
  }, [updateElements]);

  const onMouseUp = useCallback(() => {
    if (dragState.current || resizeState.current) {
      // commit to history
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

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    saveTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePageSize = (pageSizeKey: string) => {
    pushHistory(template);
    setTemplate((currentTemplate) => ({ ...currentTemplate, pageSize: pageSizeKey }));
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") { event.preventDefault(); undo(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "y") { event.preventDefault(); redo(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "d") { event.preventDefault(); if (selectedId) duplicateEl(selectedId); }
      if (event.key === "Delete" || event.key === "Backspace") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedId) deleteEl(selectedId);
      }
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Render element (draggable) ────────────────────────────────────────────
  const renderElement = (templateElement: TemplateElement) => {
    const isSelected = selectedId === templateElement.id;
    const elementStyle = templateElement.style || {};

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: templateElement.x,
      top: templateElement.y,
      width: templateElement.w,
      height: templateElement.h,
      fontSize: elementStyle.fontSize || 10,
      fontWeight: elementStyle.fontWeight || "normal",
      fontFamily: elementStyle.fontFamily || "inherit",
      fontStyle: elementStyle.fontStyle || "normal",
      textAlign: elementStyle.textAlign || "left",
      color: elementStyle.color || PRINT_NEUTRAL.text,
      direction: elementStyle.direction || "ltr",
      overflow: "visible",
      cursor: "move",
      boxSizing: "border-box",
      userSelect: "none",
      outline: isSelected ? `2px solid ${printTokens.primary}` : "1px dashed transparent",
      outlineOffset: 1,
      transition: "outline 0.1s",
    };

    const content = () => {
      if (templateElement.type === "logo") {
        const branding = (() => {
          const current = getObject<{logoUrl?: string}>("branding", {});
          if (current && Object.keys(current).length > 0) return current;
          try {
            return JSON.parse(localStorage.getItem("madrasa_branding") || "{}");
          } catch {
            return {};
          }
        })();
        return branding.logoUrl
          ? <img src={branding.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: elementStyle.objectFit || "contain" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: printTokens.logoPlaceholderBg, borderRadius: 6, border: `2px dashed ${printTokens.logoPlaceholderBorder}` }}>
              <span style={{ fontSize: 24, fontWeight: "bold", color: printTokens.primary }}>م</span>
            </div>;
      }
      if (templateElement.type === "divider") {
        return <div style={{ borderTop: `${templateElement.h || 1}px solid ${elementStyle.color || printTokens.border}`, width: "100%", marginTop: (templateElement.h || 1) / 2 }} />;
      }
      if (templateElement.type === "field") {
        return <span style={{ opacity: 0.7, fontStyle: "italic" }}>{templateElement.label}</span>;
      }
      return <span>{templateElement.label}</span>;
    };

    return (
      <div
        key={templateElement.id}
        style={baseStyle}
        onMouseDown={(event) => onMouseDownEl(event, templateElement.id)}
      >
        {content()}
        {/* Resize handle */}
        {isSelected && (
          <div
            onMouseDown={(event) => onMouseDownResize(event, templateElement.id)}
            style={{
              position: "absolute", bottom: -4, right: -4,
              width: 10, height: 10,
              background: printTokens.primary, borderRadius: 2,
              cursor: "se-resize", zIndex: 10,
            }}
          />
        )}
        {/* Action strip */}
        {isSelected && (
          <div style={{ position: "absolute", top: -22, left: 0, display: "flex", gap: 2, zIndex: 20 }}>
            <Button type="button" onClick={(event) => { event.stopPropagation(); duplicateEl(templateElement.id); }}
              style={{ padding: "1px 4px", background: printTokens.primary, color: printTokens.onPrimary, border: "none", borderRadius: 3, fontSize: 9, cursor: "pointer" }}>⧉</Button>
            <Button type="button" onClick={(event) => { event.stopPropagation(); deleteEl(templateElement.id); }}
              style={{ padding: "1px 4px", background: printTokens.destructive, color: printTokens.onPrimary, border: "none", borderRadius: 3, fontSize: 9, cursor: "pointer" }}>✕</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex flex-col bg-background rounded-xl border border-border overflow-hidden"} style={!fullscreen ? { height: "80vh" } : {}}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card flex-shrink-0 flex-wrap">
        <h2 className="font-bold text-sm text-foreground m-0">Invoice Template Editor</h2>
        <div className="flex items-center gap-1 ml-2">
          <Button type="button" onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"
            variant="ghost"
            className="p-1.5 h-auto rounded hover:bg-muted disabled:opacity-30 transition-colors shadow-none"><Undo2 className="w-4 h-4" aria-hidden="true" /></Button>
          <Button type="button" onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)"
            variant="ghost"
            className="p-1.5 h-auto rounded hover:bg-muted disabled:opacity-30 transition-colors shadow-none"><Redo2 className="w-4 h-4" aria-hidden="true" /></Button>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-muted-foreground font-semibold">Page:</span>
          {Object.entries(PAGE_SIZES).map(([pageSizeKey]) => (
            <Button type="button" key={pageSizeKey} onClick={() => handlePageSize(pageSizeKey)}
              variant={template.pageSize === pageSizeKey ? "default" : "outline"}
              className={`h-auto px-2.5 py-1 text-xs font-semibold rounded border transition-colors shadow-none ${template.pageSize === pageSizeKey ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {pageSizeKey}
            </Button>
          ))}
        </div>

        {/* Guides toggle */}
        <Button type="button" onClick={() => setShowGuides(!showGuides)} title="Toggle snap guides"
          variant="ghost"
          className="p-1.5 h-auto rounded hover:bg-muted transition-colors ml-1 shadow-none">
          {showGuides ? <Eye className="w-4 h-4 text-primary" aria-hidden="true" /> : <EyeOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" onClick={handleSave}
            className="flex items-center gap-1.5 h-auto px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> {saved ? "Saved!" : "Save Template"}
          </Button>
          {fullscreen && (
            <Button type="button" onClick={onClose}
              variant="outline"
              className="px-3 py-1.5 h-auto text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none">
              Close
            </Button>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — element palette */}
        <aside className="w-48 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-4">
          <div>
            <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Add Elements</p>
            <div className="space-y-1">
              <Button type="button" onClick={addStaticText}
                variant="outline"
                className="w-full text-left px-2.5 py-1.5 h-auto text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2 shadow-none justify-start">
                <Type className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> Static Text
              </Button>
              <Button type="button" onClick={addDivider}
                variant="outline"
                className="w-full text-left px-2.5 py-1.5 h-auto text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors flex items-center gap-2 shadow-none justify-start">
                <Minus className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" /> Divider Line
              </Button>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Add Fields</p>
            <div className="space-y-1">
              {AVAILABLE_FIELDS.map((fieldOption) => (
                <Button type="button" key={fieldOption.field} onClick={() => addField(fieldOption)}
                  variant="outline"
                  className="w-full text-left px-2.5 py-1.5 h-auto text-[10px] font-medium rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-colors shadow-none justify-start">
                  {fieldOption.label}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Centre — canvas */}
        <main className="flex-1 overflow-auto bg-muted/40 flex items-start justify-center p-8"
          onClick={() => setSelectedId(null)}>
          <div style={{ position: "relative", width: size.width, height: size.height }}
            ref={canvasRef}>
            {/* Page background */}
            <div style={{
              position: "absolute", inset: 0,
              background: printTokens.paper,
              boxShadow: "0 4px 30px rgba(0,0,0,0.15)",
              border: `1px solid ${printTokens.border}`,
            }} />
            {/* Page boundary label */}
            {showGuides && (
              <div style={{
                position: "absolute", top: -20, left: 0,
                fontSize: 10, color: PRINT_NEUTRAL.muted, fontFamily: "monospace",
              }}>
                {PAGE_SIZES[template.pageSize]?.label} — {size.width}×{size.height}px
              </div>
            )}
            {/* Elements */}
            {template.elements.map(renderElement)}
          </div>
        </main>

        {/* Right panel — properties */}
        <aside className="w-60 flex-shrink-0 border-l border-border bg-card overflow-y-auto p-3 space-y-4">
          {!selectedElement ? (
            <div className="text-xs text-muted-foreground text-center pt-10 space-y-1">
              <Move className="w-6 h-6 mx-auto opacity-30" aria-hidden="true" />
              <p className="m-0">Click an element to edit its properties</p>
              <p className="text-[10px] opacity-60 m-0">Drag to move • Drag corner to resize</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
                  {selectedElement.type === "field" ? "Data Field" : selectedElement.type === "logo" ? "Logo" : selectedElement.type === "divider" ? "Divider" : "Text"} Properties
                </p>

                {/* Label / content */}
                {(selectedElement.type === "static") && (
                  <StyleInput label="Content" value={selectedElement.label || ""}
                    onChange={(nextValue) => patchEl(selectedElement.id, { label: String(nextValue) })} />
                )}
                {(selectedElement.type === "field") && (
                  <StyleInput label="Display Label" value={selectedElement.label || ""}
                    onChange={(nextValue) => patchEl(selectedElement.id, { label: String(nextValue) })} />
                )}
              </div>

              {/* Position & size */}
              <div>
                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Position & Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <StyleInput label="X" type="number" value={selectedElement.x} onChange={(nextValue) => patchEl(selectedElement.id, { x: snap(Number(nextValue)) })} step={SNAP} />
                  <StyleInput label="Y" type="number" value={selectedElement.y} onChange={(nextValue) => patchEl(selectedElement.id, { y: snap(Number(nextValue)) })} step={SNAP} />
                  <StyleInput label="W" type="number" value={selectedElement.w || 0} onChange={(nextValue) => patchEl(selectedElement.id, { w: snap(Number(nextValue)) })} min={20} step={SNAP} />
                  <StyleInput label="H" type="number" value={selectedElement.h || 0} onChange={(nextValue) => patchEl(selectedElement.id, { h: snap(Number(nextValue)) })} min={4} step={SNAP} />
                </div>
              </div>

              {/* Typography */}
              {selectedElement.type !== "logo" && selectedElement.type !== "divider" && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Typography</p>
                  <div className="space-y-2">
                    <StyleInput label="Font Size (px)" type="number" value={selectedElement.style?.fontSize || 10}
                      onChange={(nextValue) => patchStyle(selectedElement.id, { fontSize: Number(nextValue) })} min={7} max={72} />
                    <StyleInput label="Color" type="color" value={selectedElement.style?.color || PRINT_NEUTRAL.text}
                      onChange={(nextValue) => patchStyle(selectedElement.id, { color: String(nextValue) })} />
                    <div className="flex gap-1">
                      <StyleBtn title="Bold" active={selectedElement.style?.fontWeight === "bold"}
                        onClick={() => patchStyle(selectedElement.id, { fontWeight: selectedElement.style?.fontWeight === "bold" ? "normal" : "bold" })}>
                        <Bold className="w-3 h-3" aria-hidden="true" />
                      </StyleBtn>
                      <StyleBtn title="Italic" active={selectedElement.style?.fontStyle === "italic"}
                        onClick={() => patchStyle(selectedElement.id, { fontStyle: selectedElement.style?.fontStyle === "italic" ? "normal" : "italic" })}>
                        <Italic className="w-3 h-3" aria-hidden="true" />
                      </StyleBtn>
                    </div>
                    {/* Alignment */}
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide block mb-1">Alignment</span>
                      <div className="flex gap-1">
                        {["left","center","right"].map((textAlignOption) => (
                          <StyleBtn key={textAlignOption} title={textAlignOption} active={selectedElement.style?.textAlign === textAlignOption}
                            onClick={() => patchStyle(selectedElement.id, { textAlign: textAlignOption as ElementStyle['textAlign'] })}>
                            {textAlignOption === "left" ? <AlignLeft className="w-3 h-3" aria-hidden="true" /> : textAlignOption === "center" ? <AlignCenter className="w-3 h-3" aria-hidden="true" /> : <AlignRight className="w-3 h-3" aria-hidden="true" />}
                          </StyleBtn>
                        ))}
                      </div>
                    </div>
                    {/* Font family */}
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide block mb-1">Font</span>
                      <FormSelect value={selectedElement.style?.fontFamily || "inherit"}
                        onChange={(fontFamily) => patchStyle(selectedElement.id, { fontFamily })}
                        className="w-full"
                        options={[
                          { value: "inherit", label: "Default (Inter)" },
                          { value: "serif", label: "Serif" },
                          { value: "monospace", label: "Monospace" },
                          { value: "'Amiri', serif", label: "Amiri (Arabic)" },
                          { value: "Arial, sans-serif", label: "Arial" },
                          { value: "Georgia, serif", label: "Georgia" }
                        ]}
                      />
                    </div>
                    {/* RTL */}
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                      <Checkbox checked={selectedElement.style?.direction === "rtl"}
                        onCheckedChange={(checked) => patchStyle(selectedElement.id, { direction: checked ? "rtl" : "ltr" })} />
                      RTL Direction
                    </label>
                  </div>
                </div>
              )}

              {/* Divider color */}
              {selectedElement.type === "divider" && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Divider</p>
                  <StyleInput label="Color" type="color" value={selectedElement.style?.color || PRINT_NEUTRAL.border}
                    onChange={(nextValue) => patchStyle(selectedElement.id, { color: String(nextValue) })} />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-border flex gap-2">
                <Button type="button" onClick={() => duplicateEl(selectedElement.id)}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 h-auto text-[10px] font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none">
                  <Copy className="w-3 h-3" aria-hidden="true" /> Duplicate
                </Button>
                <Button type="button" onClick={() => deleteEl(selectedElement.id)}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 h-auto text-[10px] font-semibold rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors shadow-none">
                  <Trash2 className="w-3 h-3" aria-hidden="true" /> Delete
                </Button>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── Keyboard hints ─────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 flex-wrap">
        {[
          ["Ctrl+Z", "Undo"], ["Ctrl+Y", "Redo"], ["Ctrl+D", "Duplicate"],
          ["Del", "Delete"], ["Esc", "Deselect"],
        ].map(([shortcutKey, shortcutLabel]) => (
          <span key={shortcutKey} className="text-[9px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-[9px]">{shortcutKey}</kbd> {shortcutLabel}
          </span>
        ))}
      </footer>
    </div>
  );
}
