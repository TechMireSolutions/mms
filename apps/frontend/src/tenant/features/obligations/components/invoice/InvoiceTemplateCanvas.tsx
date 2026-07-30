import type React from "react";
import { Button } from "@/components/ui/button";
import { PAGE_SIZES, type InvoiceTemplate, type PageSizeInfo, type TemplateElement } from "@/lib/invoiceTemplateStore";
import { PRINT_NEUTRAL, type getPrintBrandingTokens } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

type PrintBrandingTokens = ReturnType<typeof getPrintBrandingTokens>;

interface InvoiceTemplateCanvasProps {
  template: InvoiceTemplate;
  selectedId: string | null;
  size: PageSizeInfo;
  canvasScale: number;
  showGuides: boolean;
  canvasViewportRef: React.RefObject<HTMLElement | null>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  branding: {
    logoUrl?: string | null;
  };
  printTokens: PrintBrandingTokens;
  onDeselect: () => void;
  onMouseDownElement: (event: React.MouseEvent, elementId: string) => void;
  onMouseDownResize: (event: React.MouseEvent, elementId: string) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  t: TranslationFunction;
}

export function InvoiceTemplateCanvas({
  template,
  selectedId,
  size,
  canvasScale,
  showGuides,
  canvasViewportRef,
  canvasRef,
  branding,
  printTokens,
  onDeselect,
  onMouseDownElement,
  onMouseDownResize,
  onDuplicateElement,
  onDeleteElement,
  t,
}: InvoiceTemplateCanvasProps): React.JSX.Element {
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
        return branding.logoUrl
          ? <img src={branding.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: elementStyle.objectFit || "contain" }} />
          : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: printTokens.logoPlaceholderBg, borderRadius: 6, border: `2px dashed ${printTokens.logoPlaceholderBorder}` }}>
                <span style={{ fontSize: 24, fontWeight: "bold", color: printTokens.primary }}>م</span>
              </div>
            );
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
        onMouseDown={(event) => onMouseDownElement(event, templateElement.id)}
      >
        {content()}
        {isSelected && (
          <div
            onMouseDown={(event) => onMouseDownResize(event, templateElement.id)}
            className="absolute -bottom-2 -end-2 z-10 cursor-se-resize rounded-md"
            style={{
              background: printTokens.primary,
              height: 44 / canvasScale,
              width: 44 / canvasScale,
            }}
            aria-hidden
          />
        )}
        {isSelected && (
          <div
            className="absolute start-0 z-20 flex gap-1"
            style={{ top: -48 / canvasScale }}
          >
            <Button
              type="button"
              onClick={(event) => { event.stopPropagation(); onDuplicateElement(templateElement.id); }}
              className="rounded-md p-0 text-xs font-bold shadow-none"
              style={{
                background: printTokens.primary,
                color: printTokens.onPrimary,
                minHeight: 44 / canvasScale,
                minWidth: 44 / canvasScale,
              }}
              aria-label={t("obligations.invoiceTemplate.duplicate")}
            >
              ⧉
            </Button>
            <Button
              type="button"
              onClick={(event) => { event.stopPropagation(); onDeleteElement(templateElement.id); }}
              className="rounded-md p-0 text-xs font-bold shadow-none"
              style={{
                background: printTokens.destructive,
                color: printTokens.onPrimary,
                minHeight: 44 / canvasScale,
                minWidth: 44 / canvasScale,
              }}
              aria-label={t("common.delete")}
            >
              ✕
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main
      ref={canvasViewportRef}
      className="flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto bg-muted/40 p-4 sm:p-8"
      onClick={onDeselect}
    >
      <div
        className="relative mx-auto shrink-0"
        style={{ width: size.width * canvasScale, height: size.height * canvasScale }}
      >
        <div
          className="relative origin-top-left"
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${canvasScale})`,
            direction: "ltr",
          }}
          ref={canvasRef}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: printTokens.paper,
            boxShadow: "0 4px 30px rgba(0,0,0,0.15)",
            border: `1px solid ${printTokens.border}`,
          }} />
          {showGuides && (
            <div style={{
              position: "absolute", top: -20, insetInlineStart: 0,
              fontSize: 10, color: PRINT_NEUTRAL.muted, fontFamily: "monospace",
            }}>
              {PAGE_SIZES[template.pageSize]?.label} — {size.width}×{size.height}px
            </div>
          )}
          {template.elements.map(renderElement)}
        </div>
      </div>
    </main>
  );
}
