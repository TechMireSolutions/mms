export type AccentColor =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "muted"
  | "indigo"
  | "rose"
  | "teal"
  | "purple"
  | "green"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "violet"
  | string;

export const ACCENT_MAP: Record<
  string,
  { stripe: string; iconBg: string; iconText: string; ring: string }
> = {
  primary: {
    stripe: "bg-primary/60 group-hover:bg-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    ring: "ring-primary/20",
  },
  success: {
    stripe: "bg-success/60 group-hover:bg-success",
    iconBg: "bg-success/10",
    iconText: "text-success",
    ring: "ring-success/20",
  },
  warning: {
    stripe: "bg-warning/60 group-hover:bg-warning",
    iconBg: "bg-warning/10",
    iconText: "text-warning",
    ring: "ring-warning/20",
  },
  destructive: {
    stripe: "bg-destructive/60 group-hover:bg-destructive",
    iconBg: "bg-destructive/10",
    iconText: "text-destructive",
    ring: "ring-destructive/20",
  },
  info: {
    stripe: "bg-info/60 group-hover:bg-info",
    iconBg: "bg-info/10",
    iconText: "text-info",
    ring: "ring-info/20",
  },
  secondary: {
    stripe: "bg-secondary/60 group-hover:bg-secondary",
    iconBg: "bg-secondary/10",
    iconText: "text-secondary",
    ring: "ring-secondary/20",
  },
  muted: {
    stripe: "bg-muted-foreground/30 group-hover:bg-muted-foreground",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
    ring: "ring-muted/20",
  },
};

ACCENT_MAP.green = ACCENT_MAP.success;
ACCENT_MAP.emerald = ACCENT_MAP.success;
ACCENT_MAP.amber = ACCENT_MAP.warning;
ACCENT_MAP.red = ACCENT_MAP.destructive;
ACCENT_MAP.rose = ACCENT_MAP.destructive;
ACCENT_MAP.blue = ACCENT_MAP.info;
ACCENT_MAP.indigo = ACCENT_MAP.info;
ACCENT_MAP.teal = ACCENT_MAP.info;
ACCENT_MAP.violet = ACCENT_MAP.primary;
ACCENT_MAP.purple = ACCENT_MAP.secondary;

export function resolveAccent(accent?: string) {
  if (!accent) return ACCENT_MAP.primary;

  if (accent.includes("success") || accent.includes("emerald") || accent.includes("green")) return ACCENT_MAP.success;
  if (accent.includes("destructive") || accent.includes("rose") || accent.includes("red")) return ACCENT_MAP.destructive;
  if (accent.includes("warning") || accent.includes("amber")) return ACCENT_MAP.warning;
  if (accent.includes("info") || accent.includes("blue") || accent.includes("indigo") || accent.includes("teal")) return ACCENT_MAP.info;
  if (accent.includes("secondary") || accent.includes("purple")) return ACCENT_MAP.secondary;
  if (accent.includes("primary") || accent.includes("violet")) return ACCENT_MAP.primary;

  return ACCENT_MAP[accent] || ACCENT_MAP.primary;
}
