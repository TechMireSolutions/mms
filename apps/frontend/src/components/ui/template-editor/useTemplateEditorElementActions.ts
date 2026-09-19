/**
 * @file useTemplateEditorElementActions.ts
 * @description Hook providing element lifecycle operations: add, delete, duplicate, layer, nudge, and patch.
 */

import { useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import type {
  ElementStyle,
  PageSizeInfo,
  TemplateElement,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { newId, snap } from "./templateEditorUtils";
import { useTemplateEditorAlignActions } from "./useTemplateEditorAlignActions";
import { useTemplateEditorLayerActions } from "./useTemplateEditorLayerActions";
import { useTemplateEditorAddActions } from "./useTemplateEditorAddActions";

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

  const alignActions = useTemplateEditorAlignActions<TPayload>({
    selectedIds,
    commitUpdate,
    size,
  });

  const layerActions = useTemplateEditorLayerActions<TPayload>({
    selectedId,
    selectedIds,
    commitUpdate,
  });

  const addActions = useTemplateEditorAddActions<TPayload>({
    elementsRef,
    setSelectedIds,
    commitUpdate,
    size,
    onElementAdded,
    t,
  });

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
      duplicateElement,
      duplicateSelected,
      ...layerActions,
      ...alignActions,
      ...addActions,
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
      duplicateElement,
      duplicateSelected,
      layerActions,
      alignActions,
      addActions,
    ]
  );
}
