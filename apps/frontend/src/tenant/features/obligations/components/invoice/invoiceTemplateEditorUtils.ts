export const SNAP = 4;

export function snap(value: number): number {
  return Math.round(value / SNAP) * SNAP;
}

let idCounter = Date.now();

export function newId(): string {
  return `el_${++idCounter}`;
}
