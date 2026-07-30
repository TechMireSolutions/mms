/** Safely calculates a rounded percentage integer. */
export function calcPercentage(value: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
}
