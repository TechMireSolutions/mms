/** Semantic Tailwind tone classes — prefer these over raw palette utilities. */

export const SEMANTIC_BADGE = {
  success: 'bg-success/10 text-success border-success/20',
  successStrong: 'bg-success/15 text-success border-success/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  destructiveStrong: 'bg-destructive/15 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/20',
  warningStrong: 'bg-warning/15 text-warning border-warning/30',
  info: 'bg-info/10 text-info border-info/20',
  infoStrong: 'bg-info/15 text-info border-info/30',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  muted: 'bg-muted text-muted-foreground border-border',
} as const;

export const SEMANTIC_TEXT = {
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
  secondary: 'text-secondary',
} as const;

export const SEMANTIC_BG = {
  success: 'bg-success/10',
  successSolid: 'bg-success',
  destructive: 'bg-destructive/10',
  destructiveSolid: 'bg-destructive',
  warning: 'bg-warning/10',
  warningSolid: 'bg-warning',
  info: 'bg-info/10',
  infoSolid: 'bg-info',
} as const;

export const AVATAR_GRADIENTS = {
  male: 'from-info to-primary',
  female: 'from-secondary to-primary',
  neutral: 'from-primary to-info',
} as const;

export const AVATAR_GRADIENT_ROTATION = [
  'from-info to-primary',
  'from-secondary to-primary',
  'from-primary to-success',
  'from-warning to-primary',
] as const;

const GENDER_SELECT_IDLE =
  'border-border bg-card text-muted-foreground hover:bg-muted';

/** Gender pill selected/unselected classes — theme tokens only (Tailwind v4). */
export function genderSelectClass(gender: string, isSelected: boolean): string {
  if (!isSelected) return GENDER_SELECT_IDLE;
  const g = gender.toLowerCase();
  if (g === 'male') {
    return 'border-info text-info bg-info/10 ring-2 ring-info/10';
  }
  if (g === 'female') {
    return 'border-secondary text-secondary bg-secondary/10 ring-2 ring-secondary/10';
  }
  return 'border-primary text-primary bg-primary/10 ring-2 ring-primary/10';
}

/** Gender badge chip — theme tokens only. */
export function genderBadgeClass(gender: string): string {
  const g = gender?.toLowerCase();
  if (g === 'male') return SEMANTIC_BADGE.info;
  if (g === 'female') return SEMANTIC_BADGE.secondary;
  return SEMANTIC_BADGE.infoStrong;
}

/** Avatar gradient by gender — theme tokens only. */
export function genderAvatarGradient(gender: string): string {
  const g = gender?.toLowerCase();
  if (g === 'male') return AVATAR_GRADIENTS.male;
  if (g === 'female') return AVATAR_GRADIENTS.female;
  return AVATAR_GRADIENTS.neutral;
}

/** Capacity / progress bar fill by percentage. */
export function progressBarClass(pct: number, thresholds = { warn: 80, danger: 100 }): string {
  if (pct >= thresholds.danger) return 'bg-destructive';
  if (pct >= thresholds.warn) return 'bg-warning';
  return 'bg-success';
}

/** Attendance or completion rate text + bar colours. */
export function rateToneClass(
  rate: number,
  thresholds = { good: 90, ok: 75 },
): { text: string; bar: string } {
  if (rate >= thresholds.good) return { text: 'text-success', bar: 'bg-success' };
  if (rate >= thresholds.ok) return { text: 'text-warning', bar: 'bg-warning' };
  return { text: 'text-destructive', bar: 'bg-destructive' };
}

/** Signed delta for KPI trends. */
export function trendTextClass(delta: number): string {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-destructive';
  return 'text-muted-foreground';
}
