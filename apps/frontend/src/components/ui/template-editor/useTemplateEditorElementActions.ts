/**
 * @file useTemplateEditorElementActions.ts
 * @description Hook providing element lifecycle operations: add, delete, duplicate, layer, nudge, and patch.
 */

import type { Dispatch, SetStateAction } from "react";
import type {
  ElementStyle,
  PageSizeInfo,
  TemplateElement,
  TemplateFieldDefinition,
} from "@mms/shared";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  alignElements,
  bringSelectedToFront as bringSelectedToFrontUtil,
  centerElementOnPage,
  distributeElements,
  newId,
  sendSelectedToBack as sendSelectedToBackUtil,
  type AlignmentType,
} from "./templateEditorUtils";

export interface UseTemplateEditorElementActionsOptions<TPayload = Record<string, unknown>> {
  elements: TemplateElement<keyof TPayload & string>[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  commitUpdate: (
    updateFn: (
      elements: TemplateElement<keyof TPayload & string>[]
    ) => TemplateElement<keyof TPayload & string>[]
  ) => void;
  /**
   * Commits an edit that repeats while the user types or holds a key. History is
   * coalesced per key so a 14-character label is one undo step, not fourteen.
   */
  commitUpdateCoalesced: (
    coalesceKey: string,
    updateFn: (
      elements: TemplateElement<keyof TPayload & string>[]
    ) => TemplateElement<keyof TPayload & string>[]
  ) => void;
  size: PageSizeInfo;
  /** Highlights and scrolls to a freshly added element. */
  onElementAdded?: (elementId: string) => void;
  /**
   * Called after a deletion. The delete button unmounts itself, so without this focus
   * falls to `<body>` and nothing tells a screen-reader user that the element is gone.
   */
  onElementDeleted?: (deletedCount: number) => void;
  t: TranslationFunction;
}

export function useTemplateEditorElementActions<TPayload = Record<string, unknown>>({
  elements,
  selectedIds,
  setSelectedIds,
  commitUpdate,
  commitUpdateCoalesced,
  size,
  onElementAdded,
  onElementDeleted,
  t,
}: UseTemplateEditorElementActionsOptions<TPayload>) {
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  /** Event-free selection, usable from keyboard handlers (which have no `button`). */
  const selectElement = (elementId: string) => {
    setSelectedIds([elementId]);
  };

  const patchElement = (
    elementId: string,
    patch: Partial<TemplateElement<keyof TPayload & string>>
  ) => {
    const keys = Object.keys(patch).join(",");
    commitUpdateCoalesced(`patch:${elementId}:${keys}`, (els) =>
      els.map((el) => (el.id === elementId ? { ...el, ...patch } : el))
    );
  };

  const patchStyle = (elementId: string, stylePatch: Partial<ElementStyle>) => {
    const keys = Object.keys(stylePatch).join(",");
    commitUpdateCoalesced(`style:${elementId}:${keys}`, (els) =>
      els.map((el) =>
        el.id === elementId ? { ...el, style: { ...el.style, ...stylePatch } } : el
      )
    );
  };

  const deleteElement = (elementId: string) => {
    commitUpdate((els) => els.filter((el) => el.id !== elementId));
    setSelectedIds((prev) => prev.filter((id) => id !== elementId));
    onElementDeleted?.(1);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((els) => els.filter((el) => !idSet.has(el.id)));
    setSelectedIds([]);
    onElementDeleted?.(selectedIds.length);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    // Holding an arrow key repeats this: one undo step per gesture, not per repeat.
    commitUpdateCoalesced("nudge", (els) =>
      els.map((el) =>
        idSet.has(el.id)
          ? {
              ...el,
              x: Math.min(Math.max(0, size.width - el.w), Math.max(0, el.x + dx)),
              y: Math.min(Math.max(0, size.height - el.h), Math.max(0, el.y + dy)),
            }
          : el
      )
    );
  };

  const resizeSelected = (dw: number, dh: number) => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdateCoalesced("resize", (els) =>
      els.map((el) =>
        idSet.has(el.id)
          ? {
              ...el,
              w: Math.min(Math.max(20, size.width - el.x), Math.max(20, el.w + dw)),
              h: Math.min(Math.max(4, size.height - el.y), Math.max(4, el.h + dh)),
            }
          : el
      )
    );
  };

  const patchSelectedStyles = (stylePatch: Partial<ElementStyle>) => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const keys = Object.keys(stylePatch).join(",");
    commitUpdateCoalesced(`styleSelected:${keys}`, (els) =>
      els.map((el) =>
        idSet.has(el.id)
          ? {
              ...el,
              style: { ...el.style, ...stylePatch },
            }
          : el
      )
    );
  };

  const bringToFront = (elementId?: string) => {
    const targetId = elementId || selectedId;
    if (!targetId) return;
    commitUpdate((els) => {
      const idx = els.findIndex((el) => el.id === targetId);
      if (idx === -1 || idx === els.length - 1) return els;
      const copy = [...els];
      const [item] = copy.splice(idx, 1);
      if (item) copy.push(item);
      return copy;
    });
  };

  const sendToBack = (elementId?: string) => {
    const targetId = elementId || selectedId;
    if (!targetId) return;
    commitUpdate((els) => {
      const idx = els.findIndex((el) => el.id === targetId);
      if (idx <= 0) return els;
      const copy = [...els];
      const [item] = copy.splice(idx, 1);
      if (item) copy.unshift(item);
      return copy;
    });
  };

  const bringSelectedToFront = () => {
    if (selectedIds.length === 0) return;
    commitUpdate((els) => bringSelectedToFrontUtil(els, selectedIds));
  };

  const sendSelectedToBack = () => {
    if (selectedIds.length === 0) return;
    commitUpdate((els) => sendSelectedToBackUtil(els, selectedIds));
  };

  const moveForward = (elementId?: string) => {
    const targetId = elementId || selectedId;
    if (!targetId) return;
    commitUpdate((els) => {
      const idx = els.findIndex((el) => el.id === targetId);
      if (idx === -1 || idx === els.length - 1) return els;
      const copy = [...els];
      const temp = copy[idx]!;
      copy[idx] = copy[idx + 1]!;
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const moveBackward = (elementId?: string) => {
    const targetId = elementId || selectedId;
    if (!targetId) return;
    commitUpdate((els) => {
      const idx = els.findIndex((el) => el.id === targetId);
      if (idx <= 0) return els;
      const copy = [...els];
      const temp = copy[idx]!;
      copy[idx] = copy[idx - 1]!;
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const offsetFrom = (el: TemplateElement<keyof TPayload & string>, delta: number) => {
    const nextX = el.x + delta;
    const nextY = el.y + delta;
    return {
      x: nextX + el.w > size.width ? Math.max(0, size.width - el.w - delta) : nextX,
      y: nextY + el.h > size.height ? Math.max(0, size.height - el.h - delta) : nextY,
    };
  };

  const duplicateElement = (elementId: string) => {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;
    const { x, y } = offsetFrom(el, 12);
    const duplicated: TemplateElement<keyof TPayload & string> = {
      ...el,
      id: newId(),
      x,
      y,
      style: { ...el.style },
      columns: el.columns ? el.columns.map((col) => ({ ...col })) : undefined,
      tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
    };
    commitUpdate((els) => [...els, duplicated]);
    setSelectedIds([duplicated.id]);
    onElementAdded?.(duplicated.id);
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const targets = elements.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;
    const newElements = targets.map((el) => {
      const { x, y } = offsetFrom(el, 12);
      return {
        ...el,
        id: newId(),
        x,
        y,
        style: { ...el.style },
        columns: el.columns ? el.columns.map((col) => ({ ...col })) : undefined,
        tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
      };
    });
    commitUpdate((els) => [...els, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
    if (newElements[0]) onElementAdded?.(newElements[0].id);
  };

  const alignSelected = (alignType: AlignmentType) => {
    commitUpdate((els) => alignElements(els, selectedIds, alignType));
  };

  const distributeSelected = (axis: "horizontal" | "vertical") => {
    commitUpdate((els) => distributeElements(els, selectedIds, axis));
  };

  const centerSelected = (axis: "both" | "h" | "v" = "both") => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((els) =>
      els.map((el) => (idSet.has(el.id) ? centerElementOnPage(el, size.width, size.height, axis) : el))
    );
  };

  /**
   * Finds a free spot for a new element instead of stacking it on top of the last one.
   *
   * The old rule was "below the last element, else stagger by element count", which on a
   * shipped 25-element preset dropped every new element around (36,36) — underneath the
   * logo — so "Add" looked like it had done nothing.
   */
  const getInsertionPos = (w: number, h: number) => {
    const pad = 6;
    const overlaps = (x: number, y: number) =>
      elements.some(
        (el) =>
          x < el.x + el.w + pad &&
          x + w + pad > el.x &&
          y < el.y + el.h + pad &&
          y + h + pad > el.y
      );
    const x = 20;
    for (let y = 20; y + h <= size.height - 20; y += 10) {
      if (!overlaps(x, y)) return { x, y };
    }
    const stagger = (elements.length % 6) * 16;
    return {
      x: Math.min(Math.max(0, size.width - w - 20), 20 + stagger),
      y: Math.min(Math.max(0, size.height - h - 20), 20 + stagger),
    };
  };

  const addElement = (el: TemplateElement<keyof TPayload & string>) => {
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
    onElementAdded?.(el.id);
  };

  const addStaticText = () => {
    const { x, y } = getInsertionPos(200, 18);
    addElement({
      id: newId(),
      type: "static",
      label: t("templateEditor.newText"),
      x,
      y,
      w: 200,
      h: 18,
      style: { fontSize: 11, color: PRINT_NEUTRAL.text },
    });
  };

  const addHeading = () => {
    const w = Math.min(320, Math.max(160, size.width - 40));
    const h = 26;
    const { x, y } = getInsertionPos(w, h);
    addElement({
      id: newId(),
      type: "static",
      label: t("templateEditor.heading"),
      x,
      y,
      w,
      h,
      style: { fontSize: 16, fontWeight: "bold", color: PRINT_NEUTRAL.text },
    });
  };

  const addDivider = () => {
    const w = Math.max(40, size.width - 40);
    const h = 1;
    const { x, y } = getInsertionPos(w, h);
    addElement({
      id: newId(),
      type: "divider",
      label: "",
      x,
      y,
      w,
      h,
      style: { color: PRINT_NEUTRAL.border },
    });
  };

  const addField = (fieldDef: TemplateFieldDefinition<TPayload>) => {
    const { x, y } = getInsertionPos(160, 16);
    addElement({
      id: newId(),
      type: "field",
      label: fieldDef.label,
      field: fieldDef.field,
      x,
      y,
      w: 160,
      h: 16,
      style: { fontSize: 10, color: PRINT_NEUTRAL.text },
    });
  };

  const addQrCode = () => {
    const { x, y } = getInsertionPos(64, 64);
    addElement({
      id: newId(),
      type: "qrcode",
      label: t("templateEditor.qrCode"),
      x,
      y,
      w: 64,
      h: 64,
    });
  };

  const addLogo = () => {
    const { x, y } = getInsertionPos(80, 80);
    addElement({
      id: newId(),
      type: "logo",
      label: t("templateEditor.logo"),
      x,
      y,
      w: 80,
      h: 80,
    });
  };

  const addTable = () => {
    const w = Math.min(500, Math.max(240, size.width - 40));
    const h = 120;
    const { x, y } = getInsertionPos(w, h);
    addElement({
      id: newId(),
      type: "table",
      label: t("templateEditor.table"),
      x,
      y,
      w,
      h,
      columns: [
        { header: t("templateEditor.columnIndex"), field: "id", width: 40, align: "center" },
        { header: t("templateEditor.columnDescription"), field: "description", width: 220, align: "left" },
        { header: t("templateEditor.columnAmount"), field: "amount", width: 100, align: "right" },
      ],
      tableConfig: {
        showHeader: true,
        rowHeight: 24,
        zebra: true,
        borderColor: PRINT_NEUTRAL.border,
      },
      style: {
        fontSize: 10,
        color: PRINT_NEUTRAL.text,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: PRINT_NEUTRAL.border,
      },
    });
  };

  return {
    selectElement,
    patchElement,
    patchStyle,
    patchSelectedStyles,
    deleteElement,
    deleteSelected,
    nudgeSelected,
    resizeSelected,
    bringToFront,
    sendToBack,
    bringSelectedToFront,
    sendSelectedToBack,
    moveForward,
    moveBackward,
    duplicateElement,
    duplicateSelected,
    alignSelected,
    distributeSelected,
    centerSelected,
    addStaticText,
    addHeading,
    addDivider,
    addField,
    addQrCode,
    addLogo,
    addTable,
  };
}
