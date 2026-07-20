/** Semantic Tailwind tone classes — prefer these over raw palette utilities. */

export const SURFACE = {
  glass: 'border border-border/60 bg-card/80 backdrop-blur-xl',
  card: 'rounded-xl border border-border bg-card shadow-surface',
  elevated: 'rounded-xl border border-border bg-card shadow-surface-lg',
  mutedHeader: 'border-b border-border bg-muted/20',
} as const;

/** Logo / avatar image on themed backgrounds */
export const LOGO_IMAGE =
  'object-cover bg-card border border-border';

/** Toggle switch thumb — theme-aware (not raw white) */
export const TOGGLE_THUMB = 'bg-card shadow-sm';

/** Selected wizard / radio inner dot */
export const WIZARD_SELECTION_DOT = 'bg-primary-foreground';

/** Frosted chip on primary gradient banners */
export const BANNER_FROST_CHIP =
  'bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15';

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

/** Payment method chips (finance module). */
export const PAYMENT_METHOD_BADGE: Record<string, string> = {
  Cash: SEMANTIC_BADGE.success,
  'Bank Transfer': SEMANTIC_BADGE.info,
  Online: 'bg-primary/10 text-primary border-primary/20',
  Cheque: SEMANTIC_BADGE.warning,
  Other: SEMANTIC_BADGE.muted,
};

/** Money-in / money-out summary surfaces (cashbook, accounting). */
export const FLOW_TONE = {
  in: {
    border: 'border-success/30',
    bg: 'bg-success/10',
    text: 'text-success',
    badge: SEMANTIC_BADGE.successStrong,
  },
  out: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    badge: SEMANTIC_BADGE.destructiveStrong,
  },
} as const;

/** KPI stat card shell — icon tint + surface. */
export const KPI_TONE = {
  success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  info: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
} as const;

/** Obligation / wakala type chips */
export const OBLIGATION_TYPE_BADGE: Record<string, string> = {
  Syed: 'bg-primary/15 text-primary border-primary/30',
  'Non-Syed': SEMANTIC_BADGE.infoStrong,
  Both: SEMANTIC_BADGE.success,
  None: SEMANTIC_BADGE.muted,
  Income: SEMANTIC_BADGE.success,
  Liability: SEMANTIC_BADGE.destructive,
};

/** Card left-border accent stripe colors (globle1). */
export const CARD_STRIPE_COLORS = {
  primary: "bg-primary/45 group-hover/card:bg-primary",
  success: "bg-success/45 group-hover/card:bg-success",
  warning: "bg-warning/45 group-hover/card:bg-warning",
  destructive: "bg-destructive/45 group-hover/card:bg-destructive",
  info: "bg-info/45 group-hover/card:bg-info",
  emerald: "bg-success/45 group-hover/card:bg-success",
  indigo: "bg-primary/45 group-hover/card:bg-primary",
  rose: "bg-destructive/45 group-hover/card:bg-destructive",
  amber: "bg-warning/45 group-hover/card:bg-warning",
} as const;
