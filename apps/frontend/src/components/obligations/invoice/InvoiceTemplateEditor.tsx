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

function snap(v: number) { return Math.round(v / SNAP) * SNAP; }

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
      <Input type={type} value={value} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
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
  const selectedEl = template.elements.find((e) => e.id === selectedId);

  // ── History management ────────────────────────────────────────────────────
  const pushHistory = useCallback((tmpl: InvoiceTemplate) => {
    setHistory((h) => [...h.slice(-30), tmpl]);
    setFuture([]);
  }, []);

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [template, ...f]);
    setHistory((h) => h.slice(0, -1));
    setTemplate(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, template]);
    setFuture((f) => f.slice(1));
    setTemplate(next);
  };

  // ── Element mutations ─────────────────────────────────────────────────────
  const updateElements = useCallback((fn: (els: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((t) => {
      const next = { ...t, elements: fn(t.elements) };
      return next;
    });
  }, []);

  const commitUpdate = useCallback((fn: (els: TemplateElement[]) => TemplateElement[]) => {
    setTemplate((t) => {
      const prev = t;
      const next = { ...t, elements: fn(t.elements) };
      setHistory((h) => [...h.slice(-30), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const patchEl = (id: string, patch: Partial<TemplateElement>) => {
    commitUpdate((els) => els.map((e) => e.id === id ? { ...e, ...patch } as TemplateElement : e));
  };

  const patchStyle = (id: string, stylePatch: Partial<ElementStyle>) => {
    commitUpdate((els) => els.map((e) => e.id === id ? { ...e, style: { ...e.style, ...stylePatch } } as TemplateElement : e));
  };

  const deleteEl = (id: string) => {
    commitUpdate((els) => els.filter((e) => e.id !== id));
    setSelectedId(null);
  };

  const duplicateEl = (id: string) => {
    const templateElement = template.elements.find((element) => element.id === id);
    if (!templateElement) return;
    const copy: TemplateElement = { ...templateElement, id: newId(), x: templateElement.x + 12, y: templateElement.y + 12, style: { ...templateElement.style } };
    commitUpdate((elements) => [...elements, copy]);
    setSelectedId(copy.id);
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
  const onMouseDownEl = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const templateElement = template.elements.find((element) => element.id === id);
    if (!templateElement) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: templateElement.x,
      origY: templateElement.y,
      canvasLeft: rect.left,
      canvasTop: rect.top,
    };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.current) {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      updateElements((els) =>
        els.map((el) => el.id === dragState.current!.id
          ? { ...el, x: snap(Math.max(0, dragState.current!.origX + dx)), y: snap(Math.max(0, dragState.current!.origY + dy)) }
          : el
        )
      );
    }
    if (resizeState.current) {
      const dx = e.clientX - resizeState.current.startX;
      const dy = e.clientY - resizeState.current.startY;
      updateElements((els) =>
        els.map((el) => el.id === resizeState.current!.id
          ? { ...el, w: snap(Math.max(20, resizeState.current!.origW + dx)), h: snap(Math.max(8, resizeState.current!.origH + dy)) }
          : el
        )
      );
    }
  }, [updateElements]);

  const onMouseUp = useCallback(() => {
    if (dragState.current || resizeState.current) {
      // commit to history
      setTemplate((t) => {
        setHistory((h) => [...h.slice(-30), t]);
        setFuture([]);
        return t;
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

  const onMouseDownResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const templateElement = template.elements.find((element) => element.id === id);
    if (!templateElement) return;
    resizeState.current = { id, startX: e.clientX, startY: e.clientY, origW: templateElement.w, origH: templateElement.h };
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    saveTemplate(template);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePageSize = (ps: string) => {
    pushHistory(template);
    setTemplate((t) => ({ ...t, pageSize: ps }));
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); if (selectedId) duplicateEl(selectedId); }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedId) deleteEl(selectedId);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Render element (draggable) ────────────────────────────────────────────
  const renderEl = (el: TemplateElement) => {
    const isSelected = selectedId === el.id;
    const elementStyle = el.style || {};

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: el.x,
      top: el.y,
      width: el.w,
      height: el.h,
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
      if (el.type === "logo") {
        const b = (() => {
          const current = getObject<{logoUrl?: string}>("branding", {});
          if (current && Object.keys(current).length > 0) return current;
          try {
            return JSON.parse(localStorage.getItem("madrasa_branding") || "{}");
          } catch {
            return {};
          }
        })();
        return b.logoUrl
          ? <img src={b.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: elementStyle.objectFit || "contain" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: printTokens.logoPlaceholderBg, borderRadius: 6, border: `2px dashed ${printTokens.logoPlaceholderBorder}` }}>
              <span style={{ fontSize: 24, fontWeight: "bold", color: printTokens.primary }}>م</span>
            </div>;
      }
      if (el.type === "divider") {
        return <div style={{ borderTop: `${el.h || 1}px solid ${elementStyle.color || printTokens.border}`, width: "100%", marginTop: (el.h || 1) / 2 }} />;
      }
      if (el.type === "field") {
        return <span style={{ opacity: 0.7, fontStyle: "italic" }}>{el.label}</span>;
      }
      return <span>{el.label}</span>;
    };

    return (
      <div
        key={el.id}
        style={baseStyle}
        onMouseDown={(e) => onMouseDownEl(e, el.id)}
      >
        {content()}
        {/* Resize handle */}
        {isSelected && (
          <div
            onMouseDown={(e) => onMouseDownResize(e, el.id)}
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
            <Button type="button" onClick={(e) => { e.stopPropagation(); duplicateEl(el.id); }}
              style={{ padding: "1px 4px", background: printTokens.primary, color: printTokens.onPrimary, border: "none", borderRadius: 3, fontSize: 9, cursor: "pointer" }}>⧉</Button>
            <Button type="button" onClick={(e) => { e.stopPropagation(); deleteEl(el.id); }}
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
          {Object.entries(PAGE_SIZES).map(([k, v]) => (
            <Button type="button" key={k} onClick={() => handlePageSize(k)}
              variant={template.pageSize === k ? "default" : "outline"}
              className={`h-auto px-2.5 py-1 text-xs font-semibold rounded border transition-colors shadow-none ${template.pageSize === k ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {k}
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
            {template.elements.map(renderEl)}
          </div>
        </main>

        {/* Right panel — properties */}
        <aside className="w-60 flex-shrink-0 border-l border-border bg-card overflow-y-auto p-3 space-y-4">
          {!selectedEl ? (
            <div className="text-xs text-muted-foreground text-center pt-10 space-y-1">
              <Move className="w-6 h-6 mx-auto opacity-30" aria-hidden="true" />
              <p className="m-0">Click an element to edit its properties</p>
              <p className="text-[10px] opacity-60 m-0">Drag to move • Drag corner to resize</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">
                  {selectedEl.type === "field" ? "Data Field" : selectedEl.type === "logo" ? "Logo" : selectedEl.type === "divider" ? "Divider" : "Text"} Properties
                </p>

                {/* Label / content */}
                {(selectedEl.type === "static") && (
                  <StyleInput label="Content" value={selectedEl.label || ""}
                    onChange={(v) => patchEl(selectedEl.id, { label: String(v) })} />
                )}
                {(selectedEl.type === "field") && (
                  <StyleInput label="Display Label" value={selectedEl.label || ""}
                    onChange={(v) => patchEl(selectedEl.id, { label: String(v) })} />
                )}
              </div>

              {/* Position & size */}
              <div>
                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Position & Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <StyleInput label="X" type="number" value={selectedEl.x} onChange={(v) => patchEl(selectedEl.id, { x: snap(Number(v)) })} step={SNAP} />
                  <StyleInput label="Y" type="number" value={selectedEl.y} onChange={(v) => patchEl(selectedEl.id, { y: snap(Number(v)) })} step={SNAP} />
                  <StyleInput label="W" type="number" value={selectedEl.w || 0} onChange={(v) => patchEl(selectedEl.id, { w: snap(Number(v)) })} min={20} step={SNAP} />
                  <StyleInput label="H" type="number" value={selectedEl.h || 0} onChange={(v) => patchEl(selectedEl.id, { h: snap(Number(v)) })} min={4} step={SNAP} />
                </div>
              </div>

              {/* Typography */}
              {selectedEl.type !== "logo" && selectedEl.type !== "divider" && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Typography</p>
                  <div className="space-y-2">
                    <StyleInput label="Font Size (px)" type="number" value={selectedEl.style?.fontSize || 10}
                      onChange={(v) => patchStyle(selectedEl.id, { fontSize: Number(v) })} min={7} max={72} />
                    <StyleInput label="Color" type="color" value={selectedEl.style?.color || PRINT_NEUTRAL.text}
                      onChange={(v) => patchStyle(selectedEl.id, { color: String(v) })} />
                    <div className="flex gap-1">
                      <StyleBtn title="Bold" active={selectedEl.style?.fontWeight === "bold"}
                        onClick={() => patchStyle(selectedEl.id, { fontWeight: selectedEl.style?.fontWeight === "bold" ? "normal" : "bold" })}>
                        <Bold className="w-3 h-3" aria-hidden="true" />
                      </StyleBtn>
                      <StyleBtn title="Italic" active={selectedEl.style?.fontStyle === "italic"}
                        onClick={() => patchStyle(selectedEl.id, { fontStyle: selectedEl.style?.fontStyle === "italic" ? "normal" : "italic" })}>
                        <Italic className="w-3 h-3" aria-hidden="true" />
                      </StyleBtn>
                    </div>
                    {/* Alignment */}
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide block mb-1">Alignment</span>
                      <div className="flex gap-1">
                        {["left","center","right"].map((a) => (
                          <StyleBtn key={a} title={a} active={selectedEl.style?.textAlign === a}
                            onClick={() => patchStyle(selectedEl.id, { textAlign: a as ElementStyle['textAlign'] })}>
                            {a === "left" ? <AlignLeft className="w-3 h-3" aria-hidden="true" /> : a === "center" ? <AlignCenter className="w-3 h-3" aria-hidden="true" /> : <AlignRight className="w-3 h-3" aria-hidden="true" />}
                          </StyleBtn>
                        ))}
                      </div>
                    </div>
                    {/* Font family */}
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide block mb-1">Font</span>
                      <FormSelect value={selectedEl.style?.fontFamily || "inherit"}
                        onChange={(fontFamily) => patchStyle(selectedEl.id, { fontFamily })}
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
                      <Checkbox checked={selectedEl.style?.direction === "rtl"}
                        onCheckedChange={(checked) => patchStyle(selectedEl.id, { direction: checked ? "rtl" : "ltr" })} />
                      RTL Direction
                    </label>
                  </div>
                </div>
              )}

              {/* Divider color */}
              {selectedEl.type === "divider" && (
                <div>
                  <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-2 m-0">Divider</p>
                  <StyleInput label="Color" type="color" value={selectedEl.style?.color || PRINT_NEUTRAL.border}
                    onChange={(v) => patchStyle(selectedEl.id, { color: String(v) })} />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-border flex gap-2">
                <Button type="button" onClick={() => duplicateEl(selectedEl.id)}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 h-auto text-[10px] font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none">
                  <Copy className="w-3 h-3" aria-hidden="true" /> Duplicate
                </Button>
                <Button type="button" onClick={() => deleteEl(selectedEl.id)}
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
        ].map(([k, v]) => (
          <span key={k} className="text-[9px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded border border-border bg-muted text-foreground font-mono text-[9px]">{k}</kbd> {v}
          </span>
        ))}
      </footer>
    </div>
  );
}
