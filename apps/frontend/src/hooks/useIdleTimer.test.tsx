import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIdleTimer, type IdleTimerState } from "./useIdleTimer";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("useIdleTimer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not churn re-renders every second outside the warning window and triggers warn then timeout", async () => {
    let state!: IdleTimerState;
    let renderCount = 0;
    const onWarn = vi.fn();
    const onTimeout = vi.fn();

    function TestComponent() {
      renderCount++;
      state = useIdleTimer({
        enabled: true,
        timeoutMs: 60_000,
        warnBeforeMs: 15_000,
        onWarn,
        onTimeout,
      });
      return null;
    }

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(state.isWarning).toBe(false);
    expect(state.remainingMs).toBe(60_000);
    const initialRenderCount = renderCount;

    // Advance 10 seconds: still outside warning window (deadline is at 45s for warning)
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    // Zero tick re-renders happened during the 10 seconds
    expect(renderCount).toBe(initialRenderCount);
    expect(onWarn).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance past warning threshold (to 46s total, within 15s warning window)
    await act(async () => {
      vi.advanceTimersByTime(35_000);
    });

    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(state.isWarning).toBe(true);

    // Inside warning window: it ticks every 1 second
    const warningRenderCount = renderCount;
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(renderCount).toBeGreaterThan(warningRenderCount);

    // Advance to timeout (remaining 13s)
    await act(async () => {
      vi.advanceTimersByTime(14_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("resets timeout window on user interaction", async () => {
    let state!: IdleTimerState;
    const onWarn = vi.fn();
    const onTimeout = vi.fn();

    function TestComponent() {
      state = useIdleTimer({
        enabled: true,
        timeoutMs: 60_000,
        warnBeforeMs: 15_000,
        onWarn,
        onTimeout,
      });
      return null;
    }

    await act(async () => {
      root.render(<TestComponent />);
    });

    // Advance into warning window
    await act(async () => {
      vi.advanceTimersByTime(46_000);
    });
    expect(state.isWarning).toBe(true);

    // Trigger user activity
    await act(async () => {
      window.dispatchEvent(new Event("mousedown"));
    });

    expect(state.isWarning).toBe(false);
    expect(state.remainingMs).toBeGreaterThan(45_000);
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
