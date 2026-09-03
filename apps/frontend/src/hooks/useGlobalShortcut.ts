import { useEffect, useRef } from "react";

interface GlobalShortcutOptions {
  /** Require Ctrl (windows/linux) and/or Meta (⌘). Defaults to allowing either. */
  ctrl?: boolean;
  meta?: boolean;
}

/**
 * Registers a global keyboard shortcut (e.g. Cmd/Ctrl+K). Only fires when a
 * matching modifier is held for the given key, and prevents the default browser
 * action (e.g. focusing the URL bar). The handler is kept in a ref so callers
 * don't need to memoize it. Single DRY source for Cmd/Ctrl-shortcuts used by both
 * the tenant app shell and the platform console.
 */
export function useGlobalShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { ctrl = true, meta = true }: GlobalShortcutOptions = {},
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const modifierHeld = (meta && event.metaKey) || (ctrl && event.ctrlKey);
      if (!modifierHeld) return;
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      event.preventDefault();
      handlerRef.current(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, meta, ctrl]);
}
