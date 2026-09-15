/**
 * @file useTemplateEditorModal.ts
 * @description Manages fullscreen modal dialog state, focus trap, body scroll locking, and beforeunload safeguards.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export interface UseTemplateEditorModalOptions {
  initialFullscreen?: boolean;
  isDirty?: boolean;
  onClose: () => void;
  confirmDiscardPrompt?: () => boolean;
}

export interface UseTemplateEditorModalReturn {
  isFullscreen: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  handleClose: () => void;
  handleToggleFullscreen: () => void;
}

export function useTemplateEditorModal({
  initialFullscreen = true,
  isDirty = false,
  onClose,
  confirmDiscardPrompt,
}: UseTemplateEditorModalOptions): UseTemplateEditorModalReturn {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [isUserToggled, setIsUserToggled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Sync state if parent toggles initialFullscreen prop and user hasn't explicitly toggled it locally
  useEffect(() => {
    if (!isUserToggled) {
      setIsFullscreen(initialFullscreen);
    }
  }, [initialFullscreen, isUserToggled]);

  // Keep volatile options in a ref so handleClose stays 100% stable. Updated in
  // an effect (not during render) to stay correct under concurrent rendering.
  const optionsRef = useRef({ isDirty, confirmDiscardPrompt, onClose, isFullscreen, isUserToggled });
  useEffect(() => {
    optionsRef.current = { isDirty, confirmDiscardPrompt, onClose, isFullscreen, isUserToggled };
  });

  const handleClose = useCallback(() => {
    const opts = optionsRef.current;
    if (opts.isDirty) {
      const confirmed = opts.confirmDiscardPrompt ? opts.confirmDiscardPrompt() : true;
      if (!confirmed) return;
    }
    if (opts.isFullscreen && opts.isUserToggled) {
      setIsFullscreen(false);
      setIsUserToggled(false);
    } else {
      opts.onClose();
    }
  }, []);

  // Protect against accidental browser tab closure/reload when changes are unsaved
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Focus management: capture previous focus, focus dialog container, restore focus on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (isFullscreen && containerRef.current) {
      containerRef.current.focus();
    }
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [isFullscreen]);

  // Focus trap for modal dialog mode (WCAG 2.1 AA)
  useEffect(() => {
    if (!isFullscreen) return;
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const rawFocusables = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      // Filter visible and non-aria-hidden interactive controls only
      const focusables = Array.from(rawFocusables).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute("aria-hidden")
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Lock background page scroll when fullscreen modal is active
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    setIsUserToggled(true);
  }, []);

  return {
    isFullscreen,
    containerRef,
    handleClose,
    handleToggleFullscreen,
  };
}
