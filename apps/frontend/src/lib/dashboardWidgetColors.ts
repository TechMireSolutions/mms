import { COLOR_MAP } from '@/lib/reports/pinnedWidgetTypes';
import type { QuickActionColor } from '@/lib/dashboardQuickActions';

export type WidgetCardAccent =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

/** Map widget/quick-action color tokens → WidgetCard / StatCard accents. */
export const WIDGET_COLOR_TO_ACCENT: Record<string, WidgetCardAccent> = {
  emerald: 'success',
  blue: 'info',
  violet: 'primary',
  amber: 'warning',
  red: 'destructive',
  slate: 'primary',
};

export function widgetColorToAccent(color: string | undefined): WidgetCardAccent {
  return WIDGET_COLOR_TO_ACCENT[color ?? ''] ?? 'primary';
}

export function getWidgetColorTheme(color: string | undefined) {
  return COLOR_MAP[color ?? ''] ?? COLOR_MAP.emerald;
}

/** Icon chip classes for quick actions — derived from COLOR_MAP (+ slate muted). */
export function getQuickActionIconClasses(color: QuickActionColor): string {
  if (color === 'slate') return 'bg-muted text-muted-foreground';
  const theme = getWidgetColorTheme(color);
  return `${theme.bg} ${theme.text}`;
}

/** Soft glow fill for quick-action hover orbs. */
export function getQuickActionGlowClass(color: QuickActionColor): string {
  if (color === 'slate') return 'bg-muted-foreground/15';
  const theme = getWidgetColorTheme(color);
  return theme.bg.replace('/10', '/15');
}
