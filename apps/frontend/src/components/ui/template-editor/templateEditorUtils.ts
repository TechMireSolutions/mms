/**
 * @file templateEditorUtils.ts
 * @description Coordinate snapping, unique ID generation, and multi-element alignment utilities.
 */


/**
 * Canvas chrome colours, defined once.
 *
 * The editing surface is deliberately NOT branded: the page below it is a print
 * document whose colours come from the template (see `printBrandingTokens`), and a
 * tenant-emerald selection outline disappears against emerald document content. These
 * were previously six copies of the same raw hex and raw Tailwind palette classes
 * scattered across the canvas and the element renderer.
 */
export const CANVAS_ACCENT = {
  /** Selection outline / handles. */
  selection: "#0284c7",
  /** Darker variant, for text on the accent (contrast >= 4.5:1 on white). */
  selectionStrong: "#075985",
  /** Selection tint over the element box. */
  selectionSoft: "rgba(2, 132, 199, 0.06)",
  /** Marquee fill. */
  marqueeSoft: "rgba(2, 132, 199, 0.08)",
  /** Guide grid dots. */
  grid: "#94a3b8",
} as const;

export const SNAP = 4;

export function snap(value: number): number {
  return Math.round(value / SNAP) * SNAP;
}

export function newId(): string {
  return `el_${crypto.randomUUID()}`;
}

export type AlignmentType = "left" | "right" | "top" | "bottom" | "centerH" | "centerV";

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boxesIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function alignElements<T extends BoundingBox & { id: string }>(
  elements: T[],
  selectedIds: string[],
  alignType: AlignmentType
): T[] {
  if (selectedIds.length < 2) return elements;
  const idSet = new Set(selectedIds);
  const targets = elements.filter((el) => idSet.has(el.id));
  if (targets.length < 2) return elements;

  let targetVal: number;
  switch (alignType) {
    case "left":
      targetVal = Math.min(...targets.map((el) => el.x));
      break;
    case "right":
      targetVal = Math.max(...targets.map((el) => el.x + (el.w || 0)));
      break;
    case "top":
      targetVal = Math.min(...targets.map((el) => el.y));
      break;
    case "bottom":
      targetVal = Math.max(...targets.map((el) => el.y + (el.h || 0)));
      break;
    case "centerH": {
      const minX = Math.min(...targets.map((el) => el.x));
      const maxX = Math.max(...targets.map((el) => el.x + (el.w || 0)));
      targetVal = minX + (maxX - minX) / 2;
      break;
    }
    case "centerV": {
      const minY = Math.min(...targets.map((el) => el.y));
      const maxY = Math.max(...targets.map((el) => el.y + (el.h || 0)));
      targetVal = minY + (maxY - minY) / 2;
      break;
    }
  }

  return elements.map((el) => {
    if (!idSet.has(el.id)) return el;
    switch (alignType) {
      case "left":
        return { ...el, x: snap(Math.max(0, targetVal)) };
      case "right":
        return { ...el, x: snap(Math.max(0, targetVal - (el.w || 0))) };
      case "top":
        return { ...el, y: snap(Math.max(0, targetVal)) };
      case "bottom":
        return { ...el, y: snap(Math.max(0, targetVal - (el.h || 0))) };
      case "centerH":
        return { ...el, x: snap(Math.max(0, targetVal - (el.w || 0) / 2)) };
      case "centerV":
        return { ...el, y: snap(Math.max(0, targetVal - (el.h || 0) / 2)) };
    }
  });
}

export function centerElementOnPage<T extends BoundingBox>(
  element: T,
  pageWidth: number,
  pageHeight: number,
  axis: "both" | "h" | "v" = "both"
): T {
  const newX = axis === "v" ? element.x : snap(Math.max(0, (pageWidth - element.w) / 2));
  const newY = axis === "h" ? element.y : snap(Math.max(0, (pageHeight - element.h) / 2));
  return {
    ...element,
    x: newX,
    y: newY,
  };
}

export function distributeElements<T extends BoundingBox & { id: string }>(
  elements: T[],
  selectedIds: string[],
  axis: "horizontal" | "vertical"
): T[] {
  if (selectedIds.length < 3) return elements;
  const idSet = new Set(selectedIds);
  const targets = elements.filter((el) => idSet.has(el.id));
  if (targets.length < 3) return elements;

  if (axis === "horizontal") {
    const sorted = [...targets].sort((a, b) => a.x - b.x);
    const minX = sorted[0]!.x;
    const last = sorted[sorted.length - 1]!;
    const maxX = last.x + (last.w || 0);
    const totalElementWidth = sorted.reduce((sum, el) => sum + (el.w || 0), 0);
    const availableGap = Math.max(0, maxX - minX - totalElementWidth);
    const gap = sorted.length > 1 ? availableGap / (sorted.length - 1) : 0;

    let currentX = minX;
    const posMap = new Map<string, number>();
    for (const el of sorted) {
      posMap.set(el.id, snap(currentX));
      currentX += (el.w || 0) + gap;
    }
    return elements.map((el) => {
      const newX = posMap.get(el.id);
      return newX !== undefined ? { ...el, x: newX } : el;
    });
  } else {
    const sorted = [...targets].sort((a, b) => a.y - b.y);
    const minY = sorted[0]!.y;
    const last = sorted[sorted.length - 1]!;
    const maxY = last.y + (last.h || 0);
    const totalElementHeight = sorted.reduce((sum, el) => sum + (el.h || 0), 0);
    const availableGap = Math.max(0, maxY - minY - totalElementHeight);
    const gap = sorted.length > 1 ? availableGap / (sorted.length - 1) : 0;

    let currentY = minY;
    const posMap = new Map<string, number>();
    for (const el of sorted) {
      posMap.set(el.id, snap(currentY));
      currentY += (el.h || 0) + gap;
    }
    return elements.map((el) => {
      const newY = posMap.get(el.id);
      return newY !== undefined ? { ...el, y: newY } : el;
    });
  }
}

/**
 * Reorders selected elements to the top of the render stack (end of array), preserving relative order.
 */
export function bringSelectedToFront<T extends { id: string }>(
  elements: T[],
  selectedIds: string[]
): T[] {
  if (selectedIds.length === 0) return elements;
  const idSet = new Set(selectedIds);
  const unselected = elements.filter((el) => !idSet.has(el.id));
  const selected = elements.filter((el) => idSet.has(el.id));
  return [...unselected, ...selected];
}

/**
 * Reorders selected elements to the bottom of the render stack (start of array), preserving relative order.
 */
export function sendSelectedToBack<T extends { id: string }>(
  elements: T[],
  selectedIds: string[]
): T[] {
  if (selectedIds.length === 0) return elements;
  const idSet = new Set(selectedIds);
  const unselected = elements.filter((el) => !idSet.has(el.id));
  const selected = elements.filter((el) => idSet.has(el.id));
  return [...selected, ...unselected];
}

/**
 * Normalizes any CSS color string to a valid 7-character `#rrggbb` format required by HTML5 `<input type="color">`.
 * Supports 3-, 6-, 8-digit hex colors, rgb/rgba strings, and standard named colors.
 */
export function normalizeHexColor(color?: string, fallback = "#0f172a"): string {
  if (!color || typeof color !== "string") return fallback;
  const trimmed = color.trim().toLowerCase();
  if (trimmed === "white") return "#ffffff";
  if (trimmed === "black") return "#000000";
  if (trimmed === "transparent") return "#000000";
  if (/^#[0-9a-f]{8}$/.test(trimmed)) return trimmed.slice(0, 7);
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1]!, 10))).toString(16).padStart(2, "0");
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2]!, 10))).toString(16).padStart(2, "0");
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3]!, 10))).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return fallback;
}

export function interpolateTemplateTokens(
  text: string,
  data?: Record<string, unknown>
): string {
  if (!text || !data) return text;
  return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    // Direct match check first
    if (key in data && data[key] != null) {
      return String(data[key]);
    }
    // Deep path traversal if dotted key
    if (key.includes(".")) {
      const parts = key.split(".");
      let current: unknown = data;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current != null) {
        return String(current);
      }
    }
    return match;
  });
}

export {
  computeSmartGuides,
  type SmartGuideLine,
  type SnapResult,
} from "./templateSmartGuides";

export {
  downloadTemplateJson,
  readTemplateJsonFile,
} from "./templateJsonIo";
