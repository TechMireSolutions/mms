import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

/**
 * Locks background (document body) scrolling while an overlay is mounted, so
 * scrolling inside a modal never chains to the page behind it.
 *
 * - Reference-counted: safe with nested/stacked overlays (only the last unlock restores).
 * - Compensates for the scrollbar width to avoid a layout shift when the bar disappears.
 *
 * @param active - When false, the lock is not applied (e.g. an animated dialog that is closed).
 */
export function useBodyScrollLock(active: boolean = true): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const body = document.body;

    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      previousOverflow = body.style.overflow;
      previousPaddingRight = body.style.paddingRight;
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
        body.style.paddingRight = `${current + scrollbarWidth}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPaddingRight;
      }
    };
  }, [active]);
}
