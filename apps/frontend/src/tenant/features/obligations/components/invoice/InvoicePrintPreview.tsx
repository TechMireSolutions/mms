/**
 * InvoicePrintPreview
 * Pure render of the invoice/receipt on a page canvas.
 * Used both in the editor (live preview) and in the print/PDF modal.
 */
import React from "react";
import { generateQrSvgUri, getPageDimensions, resolveField, type InvoiceTemplate, type TemplateElement, type FieldLookupInfo } from "@/lib/invoiceTemplateStore";
import { type ObligationCollection } from '@/lib/data/obligationsData';
import { useBranding } from "@/tenant/hooks/useBranding";
import { getPrintBrandingTokens, PRINT_NEUTRAL } from "@/lib/printBrandingTokens";



export interface InvoicePrintPreviewProps {
  template: InvoiceTemplate;
  collection?: ObligationCollection | null;
  lookups?: FieldLookupInfo;
  selectedId?: string | null;
  onSelect?: ((id: string) => void) | null;
  scale?: number;
  showBoundary?: boolean;
}

/**
 * InvoicePrintPreview component.
 * @param {InvoicePrintPreviewProps} props
 */
export function InvoicePrintPreview({
  template,
  collection = null,
  lookups = {},
  selectedId = null,
  onSelect = null,
  scale = 1,
  showBoundary = true,
}: InvoicePrintPreviewProps) {
  const branding = useBranding();
  const printTokens = getPrintBrandingTokens();
  const size = getPageDimensions(template.pageSize, template.orientation);

  const renderElement = (templateElement: TemplateElement) => {
    const isSelected = selectedId === templateElement.id;
    const elementStyle = templateElement.style || {};

    const isTextElement = templateElement.type === "static" || templateElement.type === "field";

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: templateElement.x,
      top: templateElement.y,
      width: templateElement.w,
      height: templateElement.h,
      fontSize: elementStyle.fontSize || 10,
      fontWeight: elementStyle.fontWeight || "normal",
      fontFamily: elementStyle.fontFamily || "'Inter', 'Amiri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontStyle: elementStyle.fontStyle || "normal",
      textAlign: elementStyle.textAlign || "left",
      color: elementStyle.color || PRINT_NEUTRAL.text,
      direction: elementStyle.direction || "ltr",
      overflow: isTextElement ? "visible" : "hidden",
      lineHeight: isTextElement ? 1.25 : undefined,
      cursor: onSelect ? "pointer" : "default",
      boxSizing: "border-box",
      userSelect: onSelect ? "none" : "auto",
      outline: isSelected ? `2px solid ${printTokens.primary}` : "none",
      outlineOffset: "1px",
      wordBreak: isTextElement ? "break-word" : undefined,
    };

    const handleClick = onSelect
      ? (event: React.MouseEvent) => { event.stopPropagation(); onSelect(templateElement.id); }
      : undefined;

    if (templateElement.type === "logo") {
      if (!branding.logoUrl && !onSelect) return null;
      return (
        <div key={templateElement.id} style={baseStyle} onClick={handleClick}>
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="logo"
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: elementStyle.objectFit || "contain" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: printTokens.logoPlaceholderBg, borderRadius: 8, border: `2px dashed ${printTokens.logoPlaceholderBorder}` }}>
              <span style={{ fontSize: 28, fontWeight: "bold", color: printTokens.primary }}>م</span>
            </div>
          )}
        </div>
      );
    }

    if (templateElement.type === "divider") {
      return (
        <div
          key={templateElement.id}
          style={{
            ...baseStyle,
            height: Math.max(templateElement.h, 1),
            backgroundColor: elementStyle.color || printTokens.border,
            border: "none",
          }}
          onClick={handleClick}
        />
      );
    }

    if (templateElement.type === "qrcode") {
      const payload = collection
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/receipt?no=${encodeURIComponent(collection.receipt_no)}&amount=${collection.amount}&date=${collection.received_date}`
        : "MMS-RECEIPT-VERIFICATION";
      return (
        <div key={templateElement.id} style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleClick}>
          <img
            src={generateQrSvgUri(payload, elementStyle.color || "#000000")}
            alt="Receipt Verification QR"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      );
    }

    if (templateElement.type === "field" && collection) {
      const fieldValue = resolveField(templateElement.field!, collection as unknown as Record<string, unknown>, lookups);
      return (
        <div key={templateElement.id} style={baseStyle} onClick={handleClick}>
          {fieldValue || <span style={{ color: printTokens.placeholder, fontStyle: "italic" }}>—</span>}
        </div>
      );
    }

    if (templateElement.type === "field" && !collection) {
      // In editor without collection — show placeholder
      return (
        <div key={templateElement.id} style={{ ...baseStyle, background: printTokens.fieldPlaceholderBg, border: `1px dashed ${printTokens.fieldPlaceholderBorder}`, borderRadius: 2 }} onClick={handleClick}>
          <span style={{ color: printTokens.primary, fontSize: Math.min(elementStyle.fontSize || 10, 11), fontStyle: "italic" }}>{templateElement.label}</span>
        </div>
      );
    }

    // type === "static"
    return (
      <div key={templateElement.id} style={baseStyle} onClick={handleClick}>
        {templateElement.label}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: size.width,
        height: size.height,
        background: printTokens.paper,
        boxShadow: showBoundary ? "0 2px 20px rgba(0,0,0,0.15)" : "none",
        border: showBoundary ? `1px solid ${printTokens.border}` : "none",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        overflow: "hidden",
        fontFamily: "'Inter', 'Amiri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {template.elements.map(renderElement)}
    </div>
  );
}
