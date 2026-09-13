/**
 * @file templateEditorUtils.ts
 * @description Coordinate snapping, unique ID generation, and multi-element alignment utilities.
 */

import type { DocumentTemplate } from "@mms/shared";

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
        return { ...el, x: snap(targetVal) };
      case "right":
        return { ...el, x: snap(targetVal - (el.w || 0)) };
      case "top":
        return { ...el, y: snap(targetVal) };
      case "bottom":
        return { ...el, y: snap(targetVal - (el.h || 0)) };
      case "centerH":
        return { ...el, x: snap(targetVal - (el.w || 0) / 2) };
      case "centerV":
        return { ...el, y: snap(targetVal - (el.h || 0) / 2) };
    }
  });
}

export function downloadTemplateJson<TPayload = Record<string, unknown>>(
  template: DocumentTemplate<TPayload>
): void {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `document-template-${template.pageSize.toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readTemplateJsonFile<TPayload = Record<string, unknown>>(
  file: File,
  onSuccess: (parsed: DocumentTemplate<TPayload>) => void,
  onError?: (err: unknown) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text) as DocumentTemplate<TPayload>;
      if (parsed && typeof parsed.pageSize === "string" && Array.isArray(parsed.elements)) {
        onSuccess(parsed);
      }
    } catch (err) {
      onError?.(err);
    }
  };
  reader.readAsText(file);
}
