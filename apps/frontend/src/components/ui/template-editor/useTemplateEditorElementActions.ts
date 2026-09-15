/**
 * @file useTemplateEditorElementActions.ts
 * @description Hook providing element lifecycle operations: add, delete, duplicate, layer, nudge, and patch.
 */

import { useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import type {
  ElementStyle,
  PageSizeInfo,
  TemplateElement,
  TemplateFieldDefinition,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import {
  alignElements,
  bringSelectedToFront as bringSelectedToFrontUtil,
  centerElementOnPage,
  distributeElements,
  newId,
  sendSelectedToBack as sendSelectedToBackUtil,
  snap,
  type AlignmentType,
} from "./templateEditorUtils";
import {
  createDividerElement,
  createFieldElement,
  createHeadingElement,
  createLogoElement,
  createQrCodeElement,
  createStaticTextElement,
  createTableElement,
  findInsertionPos,
} from "./templateEditorElementFactories";

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
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;

  /** Event-free selection, usable from keyboard handlers (which have no `button`). */
  const selectElement = useCallback(
    (elementId: string) => {
      setSelectedIds([elementId]);
    },
    [setSelectedIds]
  );

  const patchElement = useCallback(
    (
      elementId: string,
      patch: Partial<TemplateElement<keyof TPayload & string>>
    ) => {
      const keys = Object.keys(patch).join(",");
      commitUpdateCoalesced(`patch:${elementId}:${keys}`, (els) =>
        els.map((el) => (el.id === elementId ? { ...el, ...patch } : el))
      );
    },
    [commitUpdateCoalesced]
  );

  const patchStyle = useCallback(
    (elementId: string, stylePatch: Partial<ElementStyle>) => {
      const keys = Object.keys(stylePatch).join(",");
      commitUpdateCoalesced(`style:${elementId}:${keys}`, (els) =>
        els.map((el) =>
          el.id === elementId ? { ...el, style: { ...el.style, ...stylePatch } } : el
        )
      );
    },
    [commitUpdateCoalesced]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      commitUpdate((els) => els.filter((el) => el.id !== elementId));
      setSelectedIds((prev) => prev.filter((id) => id !== elementId));
      onElementDeleted?.(1);
    },
    [commitUpdate, onElementDeleted, setSelectedIds]
  );

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    commitUpdate((els) => els.filter((el) => !idSet.has(el.id)));
    setSelectedIds([]);
    onElementDeleted?.(selectedIds.length);
  }, [commitUpdate, onElementDeleted, selectedIds, setSelectedIds]);

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.length === 0) return;
      const idSet = new Set(selectedIds);
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
    },
    [commitUpdateCoalesced, selectedIds, size.height, size.width]
  );

  const resizeSelected = useCallback(
    (dw: number, dh: number) => {
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
    },
    [commitUpdateCoalesced, selectedIds, size.height, size.width]
  );

  const patchSelectedStyles = useCallback(
    (stylePatch: Partial<ElementStyle>) => {
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
    },
    [commitUpdateCoalesced, selectedIds]
  );

  const bringToFront = useCallback(
    (elementId?: string) => {
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
    },
    [commitUpdate, selectedId]
  );

  const sendToBack = useCallback(
    (elementId?: string) => {
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
    },
    [commitUpdate, selectedId]
  );

  const bringSelectedToFront = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitUpdate((els) => bringSelectedToFrontUtil(els, selectedIds));
  }, [commitUpdate, selectedIds]);

  const sendSelectedToBack = useCallback(() => {
    if (selectedIds.length === 0) return;
    commitUpdate((els) => sendSelectedToBackUtil(els, selectedIds));
  }, [commitUpdate, selectedIds]);

  const moveForward = useCallback(
    (elementId?: string) => {
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
    },
    [commitUpdate, selectedId]
  );

  const moveBackward = useCallback(
    (elementId?: string) => {
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
    },
    [commitUpdate, selectedId]
  );

  const offsetFrom = useCallback(
    (el: TemplateElement<keyof TPayload & string>, delta: number) => {
      const nextX = el.x + delta;
      const nextY = el.y + delta;
      return {
        x: nextX + el.w > size.width ? snap(Math.max(0, size.width - el.w - delta)) : snap(nextX),
        y: nextY + el.h > size.height ? snap(Math.max(0, size.height - el.h - delta)) : snap(nextY),
      };
    },
    [size.height, size.width]
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const el = elementsRef.current.find((e) => e.id === elementId);
      if (!el) return;
      const { x, y } = offsetFrom(el, 12);
      const duplicated: TemplateElement<keyof TPayload & string> = {
        ...el,
        id: newId(),
        x,
        y,
        style: { ...el.style },
        columns: el.columns ? el.columns.map((col) => ({ ...col, id: newId() })) : undefined,
        tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
      };
      commitUpdate((els) => [...els, duplicated]);
      setSelectedIds([duplicated.id]);
      onElementAdded?.(duplicated.id);
    },
    [commitUpdate, offsetFrom, onElementAdded, setSelectedIds]
  );

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const targets = elementsRef.current.filter((el) => idSet.has(el.id));
    if (targets.length === 0) return;
    const newElements = targets.map((el) => {
      const { x, y } = offsetFrom(el, 12);
      return {
        ...el,
        id: newId(),
        x,
        y,
        style: { ...el.style },
        columns: el.columns ? el.columns.map((col) => ({ ...col, id: newId() })) : undefined,
        tableConfig: el.tableConfig ? { ...el.tableConfig } : undefined,
      };
    });
    commitUpdate((els) => [...els, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
    if (newElements[0]) onElementAdded?.(newElements[0].id);
  }, [commitUpdate, offsetFrom, onElementAdded, selectedIds, setSelectedIds]);

  const alignSelected = useCallback(
    (alignType: AlignmentType) => {
      if (selectedIds.length < 2) return;
      commitUpdate((els) => alignElements(els, selectedIds, alignType));
    },
    [commitUpdate, selectedIds]
  );

  const distributeSelected = useCallback(
    (axis: "horizontal" | "vertical") => {
      if (selectedIds.length < 2) return;
      commitUpdate((els) => distributeElements(els, selectedIds, axis));
    },
    [commitUpdate, selectedIds]
  );

  const centerSelected = useCallback(
    (axis: "both" | "h" | "v" = "both") => {
      if (selectedIds.length === 0) return;
      const idSet = new Set(selectedIds);
      commitUpdate((els) =>
        els.map((el) => (idSet.has(el.id) ? centerElementOnPage(el, size.width, size.height, axis) : el))
      );
    },
    [commitUpdate, selectedIds, size.height, size.width]
  );

  /** Snaps all selected elements to one of the four page edges conforming to the grid. */
  const snapSelected = useCallback(
    (edge: "top" | "bottom" | "left" | "right") => {
      if (selectedIds.length === 0) return;
      const idSet = new Set(selectedIds);
      commitUpdate((els) =>
        els.map((el) => {
          if (!idSet.has(el.id)) return el;
          switch (edge) {
            case "top":    return { ...el, y: 0 };
            case "bottom": return { ...el, y: snap(Math.max(0, size.height - el.h)) };
            case "left":   return { ...el, x: 0 };
            case "right":  return { ...el, x: snap(Math.max(0, size.width - el.w)) };
          }
        })
      );
    },
    [commitUpdate, selectedIds, size.height, size.width]
  );

  /** Equalizes width, height, or both across selected elements to match the largest in the selection. */
  const equalizeSelectedDimensions = useCallback(
    (dimension: "width" | "height" | "both") => {
      if (selectedIds.length < 2) return;
      const idSet = new Set(selectedIds);

      commitUpdate((els) => {
        const targets = els.filter((el) => idSet.has(el.id));
        if (targets.length < 2) return els;
        const maxWidth = Math.max(...targets.map((el) => el.w));
        const maxHeight = Math.max(...targets.map((el) => el.h));

        return els.map((el) => {
          if (!idSet.has(el.id)) return el;
          return {
            ...el,
            w: dimension === "height" ? el.w : Math.max(4, Math.min(maxWidth, size.width - el.x)),
            h: dimension === "width" ? el.h : Math.max(4, Math.min(maxHeight, size.height - el.y)),
          };
        });
      });
    },
    [commitUpdate, selectedIds, size.height, size.width]
  );

  const getInsertionPos = useCallback(
    (w: number, h: number) => findInsertionPos(elementsRef.current, w, h, size),
    [size]
  );

  const addElement = useCallback(
    (el: TemplateElement<keyof TPayload & string>) => {
      commitUpdate((els) => [...els, el]);
      setSelectedIds([el.id]);
      onElementAdded?.(el.id);
    },
    [commitUpdate, onElementAdded, setSelectedIds]
  );

  const addStaticText = useCallback(() => {
    const { x, y } = getInsertionPos(200, 18);
    addElement(createStaticTextElement(x, y, t("templateEditor.newText")) as TemplateElement<keyof TPayload & string>);
  }, [addElement, getInsertionPos, t]);

  const addHeading = useCallback(() => {
    const w = Math.min(320, Math.max(160, size.width - 40));
    const h = 26;
    const { x, y } = getInsertionPos(w, h);
    addElement(createHeadingElement(x, y, w, t("templateEditor.heading")) as TemplateElement<keyof TPayload & string>);
  }, [addElement, getInsertionPos, size.width, t]);

  const addDivider = useCallback(() => {
    const w = Math.max(40, size.width - 40);
    const h = 1;
    const { x, y } = getInsertionPos(w, h);
    addElement(createDividerElement(x, y, w) as TemplateElement<keyof TPayload & string>);
  }, [addElement, getInsertionPos, size.width]);

  const addField = useCallback(
    (fieldDef: TemplateFieldDefinition<TPayload>) => {
      const { x, y } = getInsertionPos(160, 16);
      addElement(createFieldElement(x, y, fieldDef));
    },
    [addElement, getInsertionPos]
  );

  const addQrCode = useCallback(() => {
    const { x, y } = getInsertionPos(64, 64);
    addElement(createQrCodeElement(x, y, t("templateEditor.qrCode")) as TemplateElement<keyof TPayload & string>);
  }, [addElement, getInsertionPos, t]);

  const addLogo = useCallback(() => {
    const { x, y } = getInsertionPos(80, 80);
    addElement(createLogoElement(x, y, t("templateEditor.logo")) as TemplateElement<keyof TPayload & string>);
  }, [addElement, getInsertionPos, t]);

  const addTable = useCallback(() => {
    const w = Math.min(500, Math.max(240, size.width - 40));
    const h = 120;
    const { x, y } = getInsertionPos(w, h);
    addElement(
      createTableElement(x, y, w, {
        label: t("templateEditor.table"),
        columnIndex: t("templateEditor.columnIndex"),
        columnDescription: t("templateEditor.columnDescription"),
        columnAmount: t("templateEditor.columnAmount"),
      }) as TemplateElement<keyof TPayload & string>
    );
  }, [addElement, getInsertionPos, size.width, t]);

  return useMemo(
    () => ({
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
      snapSelected,
      equalizeSelectedDimensions,
      addStaticText,
      addHeading,
      addDivider,
      addField,
      addQrCode,
      addLogo,
      addTable,
    }),
    [
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
      snapSelected,
      equalizeSelectedDimensions,
      addStaticText,
      addHeading,
      addDivider,
      addField,
      addQrCode,
      addLogo,
      addTable,
    ]
  );
}
