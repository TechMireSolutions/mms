import { useEffect, type RefObject } from "react";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useFocusTrap } from "./useFocusTrap";

export interface UseOverlayBehaviorOptions {
  /** Whether the overlay is visible/active. */
  open?: boolean;
  /** Callback fired when the user presses the Escape key. */
  onClose?: () => void;
  /** Whether to lock body scrolling when open. Defaults to true. */
  lockScroll?: boolean;
}

/**
 * Encapsulates standard overlay behaviors:
 * - Trapping keyboard focus within container
 * - Locking background body scrolling
 * - Dismissing overlay on Escape key press
 *
 * @param options Configuration for overlay behavior.
 * @returns Ref object to attach to container element for focus trapping.
 */
export function useOverlayBehavior<T extends HTMLElement = HTMLElement>({
  open = true,
  onClose,
  lockScroll = true,
}: UseOverlayBehaviorOptions): RefObject<T | null> {
  useBodyScrollLock(open && lockScroll);
  const containerRef = useFocusTrap<T>(open);

  useEffect(() => {
    if (!open || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return containerRef;
}
