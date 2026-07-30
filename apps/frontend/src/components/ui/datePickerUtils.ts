export function parseIsoDate(isoStr?: string): Date | undefined {
  if (!isoStr) return undefined;
  const [year, month, day] = isoStr.split("-").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
  return new Date(year, month - 1, day);
}

export function parseIsoYear(isoStr?: string): number | undefined {
  if (!isoStr) return undefined;
  const [year] = isoStr.split("-").map(Number);
  return isNaN(year) ? undefined : year;
}
