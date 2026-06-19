export interface GradeInfo {
  label: string;
  color: string;
  bg: string;
  border: string;
}

/**
 * Resolves score percentage to appropriate Grade metadata (label, colors).
 */
export function getGrade(pct: number): GradeInfo {
  if (pct >= 90) return { label: 'A+', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  if (pct >= 80) return { label: 'A', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' };
  if (pct >= 70) return { label: 'B', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
  if (pct >= 60) return { label: 'C', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  if (pct >= 50) return { label: 'D', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
  return { label: 'F', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
}

/**
 * Returns rank format string with correct ordinal suffix (e.g. 1st, 2nd, 3rd, 4th).
 */
export function getRankSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0];
  return n + suffix;
}
