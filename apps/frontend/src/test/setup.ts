import { afterEach } from 'vitest';

export {};

// Declare React 19 Act Environment globally
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Stub window.matchMedia for happy-dom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Stub ResizeObserver for happy-dom
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
}

// Stub IntersectionObserver for happy-dom
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserverStub {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

// Stub scrolling APIs (scrollIntoView, scrollTo, scrollBy)
if (typeof window !== 'undefined') {
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
  if (!window.scrollBy) {
    window.scrollBy = () => {};
  }
  if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// Stub HTMLCanvasElement.prototype.getContext for 2D graphics
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: (x: number, y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
      colorSpace: 'srgb' as PredefinedColorSpace,
    }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// Global teardown: remove residual Radix portals after each test
afterEach(() => {
  if (typeof document !== 'undefined') {
    const portals = document.querySelectorAll('[data-radix-portal]');
    for (const portal of portals) {
      portal.remove();
    }
  }
});
