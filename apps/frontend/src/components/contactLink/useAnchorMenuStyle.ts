import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export function useAnchorMenuStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;

    const update = (): void => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const gap = 6;
      const maxHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const placeAbove = spaceBelow < 160 && rect.top > spaceBelow;
      setStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 70,
        maxHeight,
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + gap, top: "auto" }
          : { top: rect.bottom + gap, bottom: "auto" }),
      });
    };

    update();
    window.addEventListener("resize", update);
    // Capture scroll inside modals / overflow containers.
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  return style;
}
