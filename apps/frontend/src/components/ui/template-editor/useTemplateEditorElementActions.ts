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
  size: PageSizeInfo;
  t: TranslationFunction;
}

export function useTemplateEditorElementActions<TPayload = Record<string, unknown>>({
  elements,
  selectedIds,
  setSelectedIds,
  commitUpdate,
  size,
  t,
}: UseTemplateEditorElementActionsOptions<TPayload>) {
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  const patchElement = (
    elementId: string,
    patch: Partial<TemplateElement<keyof TPayload & string>>
  ) => {
    commitUpdate((els) => els.map((el) => (el.id === elementId ? { ...el, ...patch } : el)));
  };

  const patchStyle = (elementId: string, stylePatch: Partial<ElementStyle>) => {
    commitUpdate((els) =>
      els.map((el) =>
        el.id === elementId ? { ...el, style: { ...el.style, ...stylePatch } } : el
      )
    );
  };

  const deleteElement = (elementId: string) => {
    commitUpdate((els) => els.filter((el) => el.id !== elementId));
    setSelectedIds((prev) => prev.filter((id) => id !== elementId));
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((els) => els.filter((el) => !idSet.has(el.id)));
    setSelectedIds([]);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((els) =>
      els.map((el) =>
        idSet.has(el.id)
          ? {
              ...el,
              x: Math.max(0, el.x + dx),
              y: Math.max(0, el.y + dy),
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

  const duplicateElement = (elementId: string) => {
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;
    const duplicated: TemplateElement<keyof TPayload & string> = {
      ...el,
      id: newId(),
      x: el.x + 12,
      y: el.y + 12,
      style: { ...el.style },
    };
    commitUpdate((els) => [...els, duplicated]);
    setSelectedIds([duplicated.id]);
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const targets = elements.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;
    const newElements = targets.map((el) => ({
      ...el,
      id: newId(),
      x: el.x + 12,
      y: el.y + 12,
      style: { ...el.style },
    }));
    commitUpdate((els) => [...els, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
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

  const addStaticText = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "static",
      label: t("templateEditor.newText"),
      x: 20,
      y: 20,
      w: 200,
      h: 18,
      style: { fontSize: 11, color: PRINT_NEUTRAL.text },
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  const addHeading = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "static",
      label: t("templateEditor.heading"),
      x: 20,
      y: 20,
      w: Math.min(320, Math.max(160, size.width - 40)),
      h: 26,
      style: { fontSize: 16, fontWeight: "bold", color: PRINT_NEUTRAL.text },
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  const addDivider = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "divider",
      label: "",
      x: 20,
      y: 20,
      w: size.width - 40,
      h: 1,
      style: { color: PRINT_NEUTRAL.border },
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  const addField = (fieldDef: TemplateFieldDefinition<TPayload>) => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "field",
      label: fieldDef.label,
      field: fieldDef.field,
      x: 20,
      y: 20,
      w: 160,
      h: 16,
      style: { fontSize: 10, color: PRINT_NEUTRAL.text },
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  const addQrCode = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "qrcode",
      label: t("templateEditor.qrCode"),
      x: 20,
      y: 20,
      w: 64,
      h: 64,
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  const addLogo = () => {
    const el: TemplateElement<keyof TPayload & string> = {
      id: newId(),
      type: "logo",
      label: t("templateEditor.logo"),
      x: 20,
      y: 20,
      w: 80,
      h: 80,
    };
    commitUpdate((els) => [...els, el]);
    setSelectedIds([el.id]);
  };

  return {
    patchElement,
    patchStyle,
    deleteElement,
    deleteSelected,
    nudgeSelected,
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
  };
}
