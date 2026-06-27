/**
 * InvoicePrintPreview
 * Pure render of the invoice/receipt on a page canvas.
 * Used both in the editor (live preview) and in the print/PDF modal.
 */
import React from "react";
import { PAGE_SIZES, resolveField, InvoiceTemplate, TemplateElement, FieldLookupInfo } from "../../../lib/invoiceTemplateStore";
import { getObject } from "../../../lib/db";
import { ObligationCollection } from '@/lib/data/obligationsData';
import { DEFAULT_BRANDING_SETTINGS } from "@mms/shared";
import { getPrintBrandingTokens, PRINT_NEUTRAL } from "@/lib/printBrandingTokens";

interface Branding {
  madrasaName: string;
  logoUrl: string;
  primaryColor: string;
}

function getBranding(): Branding {
  const b = getObject<Branding | null>("branding", null);
  if (b) return b;
  try {
    const raw = localStorage.getItem("madrasa_branding");
    if (raw) {
      const parsed = JSON.parse(raw);
      localStorage.setItem("mms_branding", raw);
      try {
        localStorage.removeItem("madrasa_branding");
      } catch {
        void 0;
      }
      return parsed;
    }
  } catch {
    void 0;
  }
  return { madrasaName: "MMS", logoUrl: "", primaryColor: DEFAULT_BRANDING_SETTINGS.primaryColor };
}

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
  const branding = getBranding();
  const printTokens = getPrintBrandingTokens();
  const size = PAGE_SIZES[template.pageSize] || PAGE_SIZES.A6;

  const renderElement = (el: TemplateElement) => {
    const isSelected = selectedId === el.id;
    const s = el.style || {};

    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: el.x,
      top: el.y,
      width: el.w,
      height: el.h,
      fontSize: s.fontSize || 10,
      fontWeight: s.fontWeight || "normal",
      fontFamily: s.fontFamily || "inherit",
      fontStyle: s.fontStyle || "normal",
      textAlign: s.textAlign || "left",
      color: s.color || PRINT_NEUTRAL.text,
      direction: s.direction || "ltr",
      overflow: "hidden",
      cursor: onSelect ? "pointer" : "default",
      boxSizing: "border-box",
      userSelect: "none",
      outline: isSelected ? `2px solid ${printTokens.primary}` : "none",
      outlineOffset: "1px",
    };

    const handleClick = onSelect
      ? (e: React.MouseEvent) => { e.stopPropagation(); onSelect(el.id); }
      : undefined;

    if (el.type === "logo") {
      return (
        <div key={el.id} style={baseStyle} onClick={handleClick}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: s.objectFit || "contain" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: printTokens.logoPlaceholderBg, borderRadius: 8, border: `2px dashed ${printTokens.logoPlaceholderBorder}` }}>
              <span style={{ fontSize: 28, fontWeight: "bold", color: printTokens.primary }}>م</span>
            </div>
          )}
        </div>
      );
    }

    if (el.type === "divider") {
      return (
        <div key={el.id} style={{ ...baseStyle, borderTop: `${el.h || 1}px solid ${s.color || printTokens.border}`, height: undefined }} onClick={handleClick} />
      );
    }

    if (el.type === "field" && collection) {
      const val = resolveField(el.field!, collection as unknown as Record<string, unknown>, lookups);
      return (
        <div key={el.id} style={baseStyle} onClick={handleClick}>
          {val || <span style={{ color: printTokens.placeholder, fontStyle: "italic" }}>—</span>}
        </div>
      );
    }

    if (el.type === "field" && !collection) {
      // In editor without collection — show placeholder
      return (
        <div key={el.id} style={{ ...baseStyle, background: printTokens.fieldPlaceholderBg, border: `1px dashed ${printTokens.fieldPlaceholderBorder}`, borderRadius: 2 }} onClick={handleClick}>
          <span style={{ color: printTokens.primary, fontSize: Math.min(s.fontSize || 10, 11), fontStyle: "italic" }}>{el.label}</span>
        </div>
      );
    }

    // type === "static"
    return (
      <div key={el.id} style={baseStyle} onClick={handleClick}>
        {el.label}
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
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {template.elements.map(renderElement)}
    </div>
  );
}
