import {
  type CardAccentColor,
  getCardStripeClass,
  SEMANTIC_BG,
  SEMANTIC_TEXT,
} from "@/lib/semanticTone";

export interface AccentConfig {
  stripe: string;
  iconBg: string;
  iconText: string;
  ring: string;
}

export type AccentColor = CardAccentColor | string;

export const ACCENT_MAP: Record<string, AccentConfig> = {
  primary: {
    stripe: getCardStripeClass("primary"),
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    ring: "ring-primary/20",
  },
  success: {
    stripe: getCardStripeClass("success"),
    iconBg: SEMANTIC_BG.success,
    iconText: SEMANTIC_TEXT.success,
    ring: "ring-success/20",
  },
  warning: {
    stripe: getCardStripeClass("warning"),
    iconBg: SEMANTIC_BG.warning,
    iconText: SEMANTIC_TEXT.warning,
    ring: "ring-warning/20",
  },
  destructive: {
    stripe: getCardStripeClass("destructive"),
    iconBg: SEMANTIC_BG.destructive,
    iconText: SEMANTIC_TEXT.destructive,
    ring: "ring-destructive/20",
  },
  info: {
    stripe: getCardStripeClass("info"),
    iconBg: SEMANTIC_BG.info,
    iconText: SEMANTIC_TEXT.info,
    ring: "ring-info/20",
  },
  secondary: {
    stripe: getCardStripeClass("secondary"),
    iconBg: "bg-secondary/10",
    iconText: SEMANTIC_TEXT.secondary,
    ring: "ring-secondary/20",
  },
  muted: {
    stripe: getCardStripeClass("muted"),
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

/** Resolves an accent configuration with comprehensive fallback to primary tone. */
export function resolveAccent(accent?: AccentColor | string | null): AccentConfig {
  if (!accent) return ACCENT_MAP.primary;

  const normalized = accent.toLowerCase();
  if (normalized.includes("success") || normalized.includes("emerald") || normalized.includes("green")) return ACCENT_MAP.success;
  if (normalized.includes("destructive") || normalized.includes("rose") || normalized.includes("red")) return ACCENT_MAP.destructive;
  if (normalized.includes("warning") || normalized.includes("amber")) return ACCENT_MAP.warning;
  if (normalized.includes("info") || normalized.includes("blue") || normalized.includes("indigo") || normalized.includes("teal")) return ACCENT_MAP.info;
  if (normalized.includes("secondary") || normalized.includes("purple")) return ACCENT_MAP.secondary;
  if (normalized.includes("primary") || normalized.includes("violet")) return ACCENT_MAP.primary;

  return ACCENT_MAP[normalized] || ACCENT_MAP.primary;
}
