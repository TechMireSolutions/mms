import { useEffect, useRef } from "react";

/**
 * Applies a {@link createModuleWorkDrillDown} filter on mount (pending in sessionStorage)
 * and whenever it is dispatched while the page is already open.
 */
export function useWorkDrillDownListener<F extends object>(
  event: string,
  consume: () => F | null,
  onApply: (filter: F) => void,
): void {
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  useEffect(() => {
    const pending = consume();
    if (pending) onApplyRef.current(pending);

    const handler = (e: Event) => {
      consume();
      const detail = (e as CustomEvent<F>).detail;
      if (detail) onApplyRef.current(detail);
    };
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, consume]);
}
